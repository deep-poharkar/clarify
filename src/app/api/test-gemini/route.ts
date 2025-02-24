import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent("Say hello!")
    return new Response(result.response.text())
  } catch (error) {
    return new Response('Gemini API failed: ' + error.message, { status: 500 })
  }
}