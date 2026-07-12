import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const customOpenAI = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.oxlo.ai/v1',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req) {
  const { messages } = await req.json();

  const result = streamText({
    model: customOpenAI('gpt-4o-mini'),
    system: `You are a helpful, professional AI HR Assistant for Nrolled. 
    You answer questions regarding HR policies, leave balances, and job creation. 
    Always use the provided tools to fetch accurate information rather than guessing.
    If you don't know the answer, politely say so.
    Be concise but friendly.`,
    messages,
    tools: {
      searchPolicies: tool({
        description: 'Search the Nrolled HR employee handbook and policies document for answers about leave process, payroll, and workforce management.',
        parameters: z.object({
          query: z.string().describe('The topic to search for in the handbook'),
        }),
        execute: async ({ query }) => {
          // Dummy RAG implementation: Just read the markdown file and return it
          // In a real scenario, this would create embeddings and do a vector search
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
          // Dummy API integration
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
          // Dummy API integration
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

  return result.toUIMessageStreamResponse();
}
