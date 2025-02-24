import { storeDocument } from '@/lib/vector-store';

export async function POST(req: Request) {
  try {
    const { content, metadata } = await req.json();
    
    if (!content) {
      return new Response('Content is required', { status: 400 });
    }

    const result = await storeDocument(content, metadata);
    return Response.json({ success: true, id: result.id });
    
  } catch (error) {
    console.error('Ingestion failed:', error);
    return new Response('Failed to store document', { status: 500 });
  }
}