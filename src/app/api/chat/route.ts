import { GoogleGenerativeAI } from "@google/generative-ai";
import { findRelevantDocuments, diagnosticTest } from '@/lib/vector-store';

// Updated to use the latest API version
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// Using a more reliable model name
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro", 
  generationConfig: { temperature: 0.2 }
});

export async function POST(req: Request) {
  const startTime = Date.now();
  let debugInfo = {
    query: "",
    retrievalTime: 0,
    docsFound: 0,
    generationTime: 0,
    errors: [] as string[]
  };
  
  try {
    const { messages, query } = await req.json();
    debugInfo.query = query;
    console.log('Received query:', query);
    
    // Get relevant docs specifically for the current query
    console.log('Searching for relevant documents...');
    const retrievalStartTime = Date.now();
    let relevantDocs = [];
    
    try {
      relevantDocs = await findRelevantDocuments(query);
      debugInfo.retrievalTime = Date.now() - retrievalStartTime;
      debugInfo.docsFound = relevantDocs.length;
      console.log(`Retrieved ${relevantDocs.length} documents in ${debugInfo.retrievalTime}ms`);
      
      // Log sample of docs for debugging
      if (relevantDocs.length > 0) {
        console.log('Sample document:', JSON.stringify({
          id: relevantDocs[0]._id,
          content: relevantDocs[0].content?.substring(0, 100) + '...',
          metadata: relevantDocs[0].metadata
        }, null, 2));
      } else {
        console.log('No documents found for query');
      }
    } catch (error) {
      debugInfo.errors.push(`Document retrieval error: ${error.message}`);
      console.error('Error retrieving documents:', error);
    }
    
    // Build context from all relevant documents
    let context = '';
    if (relevantDocs && relevantDocs.length > 0) {
        context = relevantDocs.map(doc => {
            const source = doc.metadata?.source ? `[Source: ${doc.metadata.source}]` : '';
            return `${source}\n${doc.content}`;
        }).join('\n\n---\n\n');
        
        console.log('Context built from documents, length:', context.length);
    } else {
        console.log('No context available from documents');
    }
    
    // Create prompt
    const prompt = `
You are an AI assistant specialized in answering questions based on provided documentation.

${context ? 'Here is information from the documentation that may be relevant to the question:' : 'No specific documentation was found for this query.'}

${context || ''}

Question: ${query}

Please answer the question based on the provided information. If the information doesn't contain a clear answer, say "I don't have specific information about that in the available documentation" and then provide your best general response.

Debug info: Retrieved ${relevantDocs.length} documents in ${debugInfo.retrievalTime}ms.
`;

    console.log('Generating response with Gemini...');
    const generationStartTime = Date.now();
    
    try {
      const result = await model.generateContent(prompt);
      debugInfo.generationTime = Date.now() - generationStartTime;
      console.log(`Response generated in ${debugInfo.generationTime}ms`);
      
      const text = result.response.text();
      
      // Create response stream
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(text));
          controller.close();
        }
      });
      
      console.log(`Total processing time: ${Date.now() - startTime}ms`);
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } catch (genAIError) {
      debugInfo.errors.push(`Generation error: ${genAIError.message}`);
      console.error('Gemini API error:', genAIError);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to generate response',
        debugInfo
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    debugInfo.errors.push(`General error: ${error.message}`);
    console.error('Chat API error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process request', 
      details: String(error),
      debugInfo
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Add a diagnostic endpoint to check system health
export async function GET(req: Request) {
  try {
    const diagnosticResults = await diagnosticTest();
    
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'Chat API is operational',
      diagnostics: diagnosticResults
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Chat API diagnostic failed',
      error: String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}