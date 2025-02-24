import { GoogleGenerativeAI } from "@google/generative-ai";
import { findRelevantDocuments } from '@/lib/vector-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Get relevant docs with fallback handling
    const relevantDocs = await findRelevantDocuments(lastMessage.content);
    
    // Extract content and add source metadata
    const context = relevantDocs.map(doc => {
      const section = doc.metadata?.section ? `[${doc.metadata.section}] ` : '';
      return `${section}${doc.content}`;
    }).join('\n\n');

    // More detailed system prompt
    const systemPrompt = `You are a helpful documentation assistant. Answer questions based ONLY on the provided context. 
If the context doesn't contain relevant information, say "I don't have enough information to answer this question."
If you find relevant information, provide a clear and concise answer, citing the specific section when available.

Context:
${context}`;

    // Prepare chat prompt with clear separation
    const userPrompt = `Question: ${lastMessage.content}

Answer based on the above context:`;

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