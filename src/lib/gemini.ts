import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateEmbedding(text: string) {
  const embedModel = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await embedModel.embedContent(text);
  return result.embedding;
}

export async function generateChatResponse(
  messages: Array<{ role: string; content: string }>,
  context?: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const chat = model.startChat({
    history: messages.map(msg => ({
      role: msg.role,
      parts: msg.content,
    })),
  });

  const prompt = context 
    ? `Context: ${context}\n\nRespond as a mental health chatbot that is empathetic and helpful.`
    : 'Respond as a mental health chatbot that is empathetic and helpful.';

  const result = await chat.sendMessage(prompt);

  return result.response;
}