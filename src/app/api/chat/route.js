import { generateText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const customOpenAI = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.oxlo.ai/v1',
  compatibility: 'compatible'
});

export const maxDuration = 30;

export async function POST(req) {
  const { messages } = await req.json();

  const coreMessages = messages.map(m => {
    if (m.parts) {
      const content = m.parts
        .filter(part => ['text', 'tool-call', 'tool-result'].includes(part.type))
        .map(part => {
          if (part.type === 'text') return { type: 'text', text: part.text || "" };
          if (part.type === 'tool-call') return { type: 'tool-call', toolName: part.toolName, toolCallId: part.toolCallId, args: part.args || {} };
          if (part.type === 'tool-result') return { type: 'tool-result', toolName: part.toolName, toolCallId: part.toolCallId, result: part.result || "completed" };
          return part;
        });
      return { role: m.role, content: content.length > 0 ? content : m.content || "" };
    }
    return { role: m.role, content: m.content || "" };
  });

  const result = await generateText({
    model: customOpenAI('mistral-7b'),
    system: `You are a helpful, professional AI HR Assistant for Nrolled. 
    You answer questions regarding HR policies, leave balances, and job creation. 
    Always use the provided tools to fetch accurate information rather than guessing.
    If you don't know the answer, politely say so.
    Be concise but friendly.`,
    messages: coreMessages,
    maxSteps: 3,
    tools: {
      searchPolicies: tool({
        description: 'Search the Nrolled HR employee handbook and policies document for answers about leave process, payroll, and workforce management.',
        parameters: z.object({
          query: z.string().describe('The topic to search for in the handbook'),
        }),
        execute: async ({ query }) => {
          const filePath = path.join(process.cwd(), 'src', 'data', 'hr_policies.md');
          try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            return { content: fileContent, note: "Analyze this document to answer the user's question." };
          } catch (e) {
            return { error: "Could not read policies document." };
          }
        },
      }),
      getLeaveBalance: tool({
        description: 'Get the current leave (PTO) balance for an employee.',
        parameters: z.object({
          employeeId: z.string().describe('The ID of the employee (e.g., 101, 102). Ask the user for their ID if not provided.'),
        }),
        execute: async ({ employeeId }) => {
          const balances = {
            "101": 12,
            "102": 5,
            "103": 20
          };
          const balance = balances[employeeId];
          if (balance !== undefined) {
            return { employeeId, balance, unit: "days" };
          }
          return { error: `Employee ID ${employeeId} not found. Try ID 101 or 102.` };
        },
      }),
      createJobPosting: tool({
        description: 'Submit a new Role Requisition Form to create a job posting.',
        parameters: z.object({
          jobTitle: z.string(),
          department: z.string(),
          salaryRange: z.string(),
        }),
        execute: async (params) => {
          return {
            status: "success",
            message: "Role Requisition submitted for Finance approval.",
            details: params,
            requisitionId: "REQ-" + Math.floor(Math.random() * 10000)
          };
        },
      })
    },
  });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const push = (str) => controller.enqueue(encoder.encode(str));
      
      push(`data: {"type":"start"}\n\n`);
      push(`data: {"type":"start-step"}\n\n`);
      
      const step = result.steps?.[result.steps.length - 1] || result;
      const toolCalls = step.toolCalls || [];
      const toolResults = step.toolResults || [];
      
      toolCalls.forEach(tc => {
        push(`data: {"type":"tool-call","toolCallId":"${tc.toolCallId}","toolName":"${tc.toolName}","args":${JSON.stringify(tc.args || tc.input || {})}}\n\n`);
        const tr = toolResults.find(r => r.toolCallId === tc.toolCallId);
        if (tr) {
          push(`data: {"type":"tool-result","toolCallId":"${tc.toolCallId}","toolName":"${tc.toolName}","result":${JSON.stringify(tr.result || tr.output || {})}}\n\n`);
        }
      });

      if (result.text) {
        const msgId = "msg_" + Date.now();
        push(`data: {"type":"text-start","id":"${msgId}"}\n\n`);
        push(`data: {"type":"text-delta","id":"${msgId}","delta":${JSON.stringify(result.text)}}\n\n`);
        push(`data: {"type":"text-end","id":"${msgId}"}\n\n`);
      }

      push(`data: {"type":"finish-step"}\n\n`);
      push(`data: {"type":"finish","finishReason":"stop"}\n\n`);
      push(`data: [DONE]\n\n`);
      
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
  });
}
