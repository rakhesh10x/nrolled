import fs from 'fs';
import path from 'path';

const OXLO_API_KEY = process.env.OPENAI_API_KEY;
const OXLO_BASE_URL = 'https://api.oxlo.ai/v1';

export const maxDuration = 30;

// Tool definitions in OpenAI format
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'searchPolicies',
      description: 'Search the Nrolled HR employee handbook and policies document for answers about leave process, payroll, and workforce management.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The topic to search for in the handbook' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getLeaveBalance',
      description: 'Get the current leave (PTO) balance for an employee.',
      parameters: {
        type: 'object',
        properties: {
          employeeId: { type: 'string', description: 'The ID of the employee (e.g., 101, 102)' }
        },
        required: ['employeeId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createJobPosting',
      description: 'Submit a new Role Requisition Form to create a job posting.',
      parameters: {
        type: 'object',
        properties: {
          jobTitle: { type: 'string' },
          department: { type: 'string' },
          salaryRange: { type: 'string' }
        },
        required: ['jobTitle', 'department', 'salaryRange']
      }
    }
  }
];

// Execute a tool by name
function executeTool(name, args) {
  switch (name) {
    case 'searchPolicies': {
      const filePath = path.join(process.cwd(), 'src', 'data', 'hr_policies.md');
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.stringify({ content: fileContent, note: "Analyze this document to answer the user's question." });
      } catch (e) {
        return JSON.stringify({ error: "Could not read policies document." });
      }
    }
    case 'getLeaveBalance': {
      const balances = { "101": 12, "102": 5, "103": 20 };
      const balance = balances[args.employeeId];
      if (balance !== undefined) {
        return JSON.stringify({ employeeId: args.employeeId, balance, unit: "days" });
      }
      return JSON.stringify({ error: `Employee ID ${args.employeeId} not found. Try 101, 102, or 103.` });
    }
    case 'createJobPosting': {
      return JSON.stringify({
        status: "success",
        message: "Role Requisition submitted for Finance approval.",
        details: args,
        requisitionId: "REQ-" + Math.floor(Math.random() * 10000)
      });
    }
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

// Call the Oxlo API directly
async function callOxlo(messages, tools) {
  const res = await fetch(`${OXLO_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OXLO_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-7b',
      messages,
      ...(tools ? { tools, tool_choice: 'auto' } : {})
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Oxlo API error ${res.status}: ${errText}`);
  }

  return res.json();
}

export async function POST(req) {
  const { messages } = await req.json();

  // Build conversation with system message
  const apiMessages = [
    {
      role: 'system',
      content: `You are a helpful, professional AI HR Assistant for Nrolled. 
You answer questions regarding HR policies, leave balances, and job creation. 
Always use the provided tools to fetch accurate information rather than guessing.
If you don't know the answer, politely say so. Be concise but friendly.`
    },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  try {
    const toolsUsed = [];

    // Step 1: Call with tools
    let response = await callOxlo(apiMessages, TOOLS);
    let choice = response.choices[0];
    let maxSteps = 3;

    // Step 2: Handle tool calls in a loop
    while (choice.finish_reason === 'tool_calls' && maxSteps > 0) {
      const toolCalls = choice.message.tool_calls || [];

      // Add assistant message with tool calls
      apiMessages.push({
        role: 'assistant',
        content: choice.message.content || null,
        tool_calls: toolCalls
      });

      // Execute each tool and add results
      for (const tc of toolCalls) {
        const args = JSON.parse(tc.function.arguments || '{}');
        const result = executeTool(tc.function.name, args);
        
        toolsUsed.push({
          toolName: tc.function.name,
          args,
          result: JSON.parse(result)
        });

        apiMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result
        });
      }

      // Call again with tool results (no tools this time to get final answer)
      response = await callOxlo(apiMessages, TOOLS);
      choice = response.choices[0];
      maxSteps--;
    }

    const text = choice.message.content || "I'm sorry, I couldn't generate a response. Please try again.";

    return Response.json({ text, toolsUsed });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { text: "Sorry, something went wrong. Please try again.", toolsUsed: [] },
      { status: 500 }
    );
  }
}
