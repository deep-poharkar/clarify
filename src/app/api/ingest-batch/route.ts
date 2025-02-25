import { NextResponse } from 'next/server';
import { storeDocument } from '@/lib/vector-store';

export async function POST(req: Request) {
  try {
    const { urls } = await req.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid URLs provided' }, { status: 400 });
    }
    
    const results = {
      total: urls.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const url of urls) {
      try {
        // Fetch content from URL
        const response = await fetch(url);
        if (!response.ok) {
          results.failed++;
          results.errors.push(`Failed to fetch ${url}: ${response.statusText}`);
          continue;
        }
        
        const htmlContent = await response.text();
        
        // Basic HTML content extraction
        const textContent = extractTextFromHtml(htmlContent);
        
        // Store in vector database
        await storeDocument(textContent, { source: url });
        
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing ${url}: ${(error as Error).message}`);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      processed: results.successful,
      failed: results.failed,
      total: results.total
    });
  } catch (error) {
    console.error('Batch URL ingestion error:', error);
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