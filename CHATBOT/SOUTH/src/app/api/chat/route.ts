import { NextRequest, NextResponse } from 'next/server';
import { callGemini, ChatMessage } from '@/lib/gemini';
import { stripStarsAndAsterisks, enforceMaxThreeLines } from '@/lib/textUtils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, userContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    // Format incoming messages to Gemini ChatMessage format
    const formattedMessages: ChatMessage[] = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await callGemini(formattedMessages, userContext);

    return NextResponse.json({
      role: 'assistant',
      content: enforceMaxThreeLines(response.text),
      toolCalls: response.toolCallsExecuted,
    });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json(
      {
        role: 'assistant',
        content: "I apologize, but I am currently having trouble connecting to the college records system. Please reach out to our Admissions desk at +91 96069 41908 (Monday to Friday, 8:30 AM to 5:00 PM) or email admin@gopalanpucollege.com.",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
