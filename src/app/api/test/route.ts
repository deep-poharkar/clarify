import { testConnection } from '@/lib/vector-store';

export async function GET() {
  const isConnected = await testConnection();
  return Response.json({ connected: isConnected });
}