import { GoogleGenerativeAI } from "@google/generative-ai";
import { findRelevantDocuments } from '@/lib/vector-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(req: Request) {
  try {
    const { messages, query } = await req.json();
    console.log('Received query:', query);
    
    // Get relevant docs specifically for the current query
    const relevantDocs = await findRelevantDocuments(query);
    console.log('Retrieved documents count:', relevantDocs.length);

    // Build context from all relevant documents
    let context = '';
    if (relevantDocs && relevantDocs.length > 0) {
        context = relevantDocs.map(doc => {
            const source = doc.metadata?.source ? `[Source: ${doc.metadata.source}]` : '';
            return `${source}\n${doc.content}`;
        }).join('\n\n---\n\n');
    }

    // Enhanced system prompt that better utilizes the context
    const systemPrompt = `You are a knowledgeable AI assistant. Your task is to:
1. Answer questions based on the provided context
2. If the context contains relevant information, use it to provide detailed answers
3. Cite sources when available
4. Keep responses clear and concise

Context:
${context}`;

    // Simplified user prompt
    const userPrompt = `Question: ${query}`;

    // Generate response with combined prompts
    const result = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt }
    ]);
    
    const response = await result.response;
    const text = response.text();

    // Create response stream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Failed to process request', { status: 500 });
  }
}