import { NextResponse } from 'next/server';
import { storeDocument } from '@/lib/vector-store';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url || !url.trim()) {
      return NextResponse.json({ success: false, error: 'No URL provided' }, { status: 400 });
    }
    
    // Fetch content from URL
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch URL: ${response.statusText}` }, 
        { status: 400 }
      );
    }
    
    const htmlContent = await response.text();
    
    // Basic HTML content extraction (you may want to use a more robust solution like cheerio)
    const textContent = extractTextFromHtml(htmlContent);
    
    // Store in vector database
    await storeDocument(textContent, { source: url });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('URL ingestion error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message }, 
      { status: 500 }
    );
  }
}

// Simple HTML to text converter
function extractTextFromHtml(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
  
  return text;
}