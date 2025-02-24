export type Message = {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt?: Date
  }
  
  export type ChatRequest = {
    messages: Message[]
  }
  
  export interface VectorDocument {
    id?: string;
    content: string;
    metadata?: {
      source?: string;
      category?: string;
      timestamp?: Date;
    };
  }
  
  export interface SearchResult {
    content: string;
    similarity: number;
    metadata?: Record<string, any>;
  }