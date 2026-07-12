# Nrolled AI HR Chatbot

## Overview
This project is an AI-powered HR Assistant built for the Nrolled IT Team Selection Assignment (Option 2). It provides a sleek, modern chat interface to handle queries regarding the leave process, payroll, job creation, and workforce management.

## Setup
1. Clone the repository.
2. Install dependencies: `npm install`
3. Ensure you have a `.env.local` file with your OpenAI API key: `OPENAI_API_KEY=your_key_here`
4. Run the development server: `npm run dev`
5. Open `http://localhost:3000` in your browser.

## Tech Stack
- **Frontend**: Next.js (App Router), React, Vanilla CSS (Glassmorphism design, CSS modules)
- **AI Core**: Vercel AI SDK (`ai`), OpenAI (`gpt-4o-mini`)
- **Icons**: Lucide React

## Architecture
- **UI**: A client-side React component (`src/app/page.js`) that uses the `useChat` hook to seamlessly stream AI responses and render tool calls. 
- **API**: A Next.js serverless API route (`src/app/api/chat/route.js`) handles incoming messages, manages the conversation context, and exposes custom Tools to the LLM.
- **RAG / Knowledge Base**: Simulated via the `searchPolicies` tool which reads a local markdown file (`src/data/hr_policies.md`) to provide document-based answers without hallucinations.
- **Actions**: API integrations for dynamic data are simulated using Server-side Tools (`getLeaveBalance`, `createJobPosting`).

## AI Usage
AI tools were used extensively during the development of this project:
- **Code Generation & Architecture**: Leveraged AI to design the Next.js API routes and Vercel AI SDK integrations, significantly speeding up development time.
- **UI Design**: Used AI to generate the CSS for the premium glassmorphism aesthetic, micro-animations, and responsive layout without relying on external UI libraries like Tailwind.
- **Prompt Engineering**: Crafted the system prompt for the HR assistant to ensure accurate tool usage, professional tone, and strict adherence to provided context.

## Assumptions
- The application relies on an active internet connection to communicate with the OpenAI API.
- The company policies are currently static (read from a markdown file) but the architecture supports seamlessly swapping this out for a real Vector Database (like Pinecone or pgvector).
- API integrations (like checking leave balance) return dummy data for demonstration purposes (e.g., querying for ID 101 or 102).
