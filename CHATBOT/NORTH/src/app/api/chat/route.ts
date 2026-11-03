import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { callClaude } from '@/lib/claude';
import { stripStarsAndAsterisks, enforceMaxThreeLines } from '@/lib/textUtils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, userContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    // Claude needs non-empty text and a conversation that starts with a user turn
    const formattedMessages: Anthropic.MessageParam[] = messages
      .filter((m: any) => typeof m.content === 'string' && m.content.trim())
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
    while (formattedMessages[0]?.role === 'assistant') formattedMessages.shift();

    const response = await callClaude(formattedMessages, userContext);

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
        content: "I apologize, but I am currently having trouble connecting to the college records system. Please reach out to our Admissions Help Desk at +91 81053 88193 / +91 81230 40418 / +91 96320 70209 or email gpuc.north@gopalanpucollege.com.",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
