import { NextResponse } from 'next/server';
import { storeDocument } from '@/lib/vector-store';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    
    // Determine file type and extract content
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    let content = '';
    
    if (fileType === 'txt' || fileType === 'md' || fileType === 'json') {
      content = await file.text();
    } else if (fileType === 'pdf' || fileType === 'docx' || fileType === 'doc') {
      // For this MVP, we'll just handle text files
      // In a production app, you'd use libraries like pdf-parse or mammoth
      return NextResponse.json(
        { success: false, error: `${fileType} files require additional processing libraries` }, 
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type' }, 
        { status: 400 }
      );
    }
    
    // Store in vector database
    await storeDocument(content, { 
      source: file.name,
      type: 'file',
      fileType
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File ingestion error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message }, 
      { status: 500 }
    );
  }
}