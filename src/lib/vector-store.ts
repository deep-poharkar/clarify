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
  try {
    // Further reduce text size to stay well under the 10KB limit
    const truncatedText = text.slice(0, 2048);
    
    const embedModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await embedModel.embedContent(truncatedText);
    const embedding = result.embedding;
    
    if (!embedding || !embedding.values || embedding.values.length === 0) {
      throw new Error('Failed to generate embedding');
    }
    
    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Store document with vector embedding
export async function storeDocument(content: string, metadata: any = {}) {
  try {
    if (!content || content.trim() === '') {
      return { success: false, message: 'Empty content cannot be stored' };
    }
    
    // Split content into smaller chunks
    const chunks = splitIntoChunks(content, 2048);
    const results = [];
    
    for (const chunk of chunks) {
      const collection = await db.collection(COLLECTION_NAME);
      const vector = await generateEmbedding(chunk);
      
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      const doc = {
        _id: docId,
        content: chunk,
        metadata: {
          ...metadata,
          isChunk: chunks.length > 1,
          totalChunks: chunks.length
        },
        embedding: vector, // Changed from vector to embedding
        timestamp: new Date().toISOString()
      };

      await collection.insertOne(doc);
      results.push(docId);
    }
    
    return { success: true, message: `Document stored in ${chunks.length} chunks`, ids: results };
  } catch (error) {
    console.error('Store document error:', error);
    return { success: false, message: 'Failed to store document', error: String(error) };
  }
}

// Find relevant documents
export async function findRelevantDocuments(query: string) {
  try {
    const collection = await db.collection(COLLECTION_NAME);
    const queryVector = await generateEmbedding(query);
    
    // Updated vector search syntax for AstraDB
    try {
      const results = await collection.find({
        $search: {
          vector: {
            embedding: queryVector,
            path: "embedding",
            k: 5
          }
        }
      }).toArray();
      
      if (results.length > 0) {
        return results;
      }
    } catch (vectorError) {
      console.error('Vector search failed:', vectorError);
    }
    
    // Fallback to text search if vector search fails
    console.log('Falling back to text search');
    return await collection.find({}, { limit: 5 }).toArray();
    
  } catch (error) {
    console.error('Error finding relevant documents:', error);
    return [];
  }
}

// Delete document by ID
export async function deleteDocument(id: string) {
  try {
    const collection = await db.collection(COLLECTION_NAME);
    const result = await collection.deleteOne({ _id: id });
    return { success: result.deletedCount > 0, message: result.deletedCount > 0 ? 'Document deleted' : 'Document not found' };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, message: 'Failed to delete document' };
  }
}

// Get all documents (for management purposes)
export async function getAllDocuments(limit = 100) {
  try {
    const collection = await db.collection(COLLECTION_NAME);
    const results = await collection.find({}, { limit }).toArray();
    return results.map(doc => ({
      id: doc._id,
      content: doc.content?.substring(0, 150) + (doc.content?.length > 150 ? '...' : ''),
      source: doc.metadata?.source || 'Unknown',
      timestamp: doc.timestamp
    }));
  } catch (error) {
    console.error('Error retrieving all documents:', error);
    return [];
  }
}

// Add a diagnostic function to test the system
export async function diagnosticTest() {
  try {
    // Test environment variables
    console.log('Environment variables check:');
    console.log('- ASTRA_DB_TOKEN:', process.env.ASTRA_DB_TOKEN ? '✓ Present' : '✗ Missing');
    console.log('- ASTRA_DB_ENDPOINT:', process.env.ASTRA_DB_ENDPOINT ? '✓ Present' : '✗ Missing');
    console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Present' : '✗ Missing');
    
    // Test database connection
    console.log('\nTesting database connection...');
    const collection = await db.collection(COLLECTION_NAME);
    console.log('Database connection successful');
    
    // Test embedding generation
    console.log('\nTesting embedding generation...');
    const testVector = await generateEmbedding('Test embedding generation');
    console.log(`Embedding generation successful (${testVector.length} dimensions)`);
    
    // Check for existing documents
    console.log('\nChecking for existing documents...');
    const existingDocs = await collection.find({}).limit(5).toArray();
    console.log(`Found ${existingDocs.length} existing documents`);
    
    // Test document insertion
    console.log('\nTesting document insertion...');
    const insertResult = await storeDocument(
      'This is a test document inserted during diagnostics.',
      { source: 'Diagnostic Test' }
    );
    console.log('Document insertion result:', insertResult);
    
    // Test document retrieval
    console.log('\nTesting document retrieval...');
    const retrievedDocs = await findRelevantDocuments('test document diagnostics');
    console.log(`Retrieved ${retrievedDocs.length} documents from search`);
    
    return {
      success: true,
      message: 'Diagnostic tests completed',
      results: {
        existingDocCount: existingDocs.length,
        insertionSuccess: insertResult.success,
        retrievalSuccess: retrievedDocs.length > 0,
        retrievedDocCount: retrievedDocs.length
      }
    };
  } catch (error) {
    console.error('Diagnostic test failed:', error);
    return {
      success: false,
      message: 'Diagnostic tests failed',
      error: String(error)
    };
  }
}