import { DataAPIClient } from "@datastax/astra-db-ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.ASTRA_DB_TOKEN || !process.env.ASTRA_DB_ENDPOINT || !process.env.GEMINI_API_KEY) {
  throw new Error('Missing environment variables');
}

const client = new DataAPIClient(process.env.ASTRA_DB_TOKEN);
const db = client.db(process.env.ASTRA_DB_ENDPOINT);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const COLLECTION_NAME = 'documentation';

// Generate embeddings using Gemini
async function generateEmbedding(text: string): Promise<number[]> {
  const embedModel = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await embedModel.embedContent(text);
  return result.embedding;
}

// Store document with vector embedding
export async function storeDocument(content: string, metadata: any = {}) {
  try {
    const collection = await db.collection(COLLECTION_NAME);
    const vector = await generateEmbedding(content);
    
    const doc = {
      content,
      metadata,
      vector,
      timestamp: new Date().toISOString()
    };

    await collection.insertOne(doc);
    return { success: true, message: 'Document stored successfully' };
  } catch (error) {
    console.error('Store document error:', error);
    return { success: false, message: 'Failed to store document' };
  }
}

// Find relevant documents
export async function findRelevantDocuments(query: string) {
  try {
    const collection = await db.collection(COLLECTION_NAME);
    
    // First try vector search
    try {
      const queryVector = await generateEmbedding(query);
      const results = await collection.find({
        $vectorSearch: {
          queryVector,
          path: "vector",
          numCandidates: 10,
          limit: 3
        }
      }).toArray();
      
      if (results.length > 0) return results;
    } catch (e) {
      console.log('Vector search fallback to text search');
    }
    
    // Fallback to regular text search if vector search fails
    return await collection.find({}, { limit: 3 }).toArray();
  } catch (error) {
    console.error('Find documents error:', error);
    return [];  // Return empty array instead of throwing
  }
}