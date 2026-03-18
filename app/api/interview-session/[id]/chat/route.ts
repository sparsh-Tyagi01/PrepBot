import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callGemini, buildSystemPrompt, parseAIResponse } from '@/lib/interview-prompts';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, type = 'text', timeRemainingSeconds } = body;

    const iv = await prisma.interviewSession.findUnique({
      where: { id, userId: session.user.id },
      include: { aiInterviewer: true, interviewType: true },
    });
    if (!iv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const log = (iv.conversationLog as any[]) || [];
    const isSystemTrigger = message.startsWith('[SYSTEM_');

    // Add user message to visible log (skip internal system triggers)
    if (!isSystemTrigger) {
      const userText = type === 'code'
        ? 'Here is my code solution:\n```\n' + message + '\n```'
        : message;
      log.push({ speaker: 'user', message: userText, type, timestamp: new Date().toISOString() });
    }

    // Build Gemini history (alternating user/model, must start with user)
    const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const entry of log) {
      if (entry.speaker !== 'user' && entry.speaker !== 'ai') continue;
      history.push({ role: entry.speaker === 'user' ? 'user' : 'model', parts: [{ text: entry.message }] });
    }
    while (history.length > 0 && history[0].role === 'model') history.shift();

    // Pop the last user entry — send it via sendMessage
    const lastEntry = history.at(-1);
    const popped = lastEntry?.role === 'user' ? history.pop() : null;
    const toSend = isSystemTrigger
      ? message
      : (popped?.parts[0].text ?? message);

    // systemInstruction ensures the AI has full context on EVERY turn
    const apiKey = process.env.GEMINI_API_KEY || '';

    // Fetch institution question bank for this interview type (if applicable)
    let institutionQuestions: { question: string; expectedAnswer?: string | null; keyPoints?: unknown }[] = [];
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { institutionId: true },
    });
    if (userData?.institutionId) {
      // Filter question banks and questions by the session's difficulty
      const banks = await prisma.questionBank.findMany({
        where: {
          institutionId: userData.institutionId,
          interviewTypeId: iv.interviewTypeId,
          isActive: true,
          difficulty: iv.difficulty,
        },
        include: {
          questions: {
            where: { isActive: true, difficulty: iv.difficulty },
            orderBy: { order: 'asc' },
          },
        },
      });
      institutionQuestions = banks.flatMap((b: typeof banks[number]) => b.questions);
      // Fallback: if no difficulty-matched questions exist, get all active questions
      if (institutionQuestions.length === 0) {
        const allBanks = await prisma.questionBank.findMany({
          where: {
            institutionId: userData.institutionId,
            interviewTypeId: iv.interviewTypeId,
            isActive: true,
          },
          include: {
            questions: { where: { isActive: true }, orderBy: { order: 'asc' } },
          },
        });
        institutionQuestions = allBanks.flatMap((b: typeof allBanks[number]) => b.questions);
      }
    }

    let aiText = (
      await callGemini(apiKey, buildSystemPrompt(iv, timeRemainingSeconds, institutionQuestions.length > 0 ? institutionQuestions : undefined, iv.resumeText ?? null), history, toSend)
    ) || 'Could you tell me a bit more about your background?';

    // Detect and strip misbehavior/end action tokens
    const { text, misbehaviorAction, earlyEnd } = parseAIResponse(aiText);
    aiText = text;

    log.push({ speaker: 'ai', message: aiText, type: 'text', timestamp: new Date().toISOString() });

    await prisma.interviewSession.update({
      where: { id },
      data: { conversationLog: log },
    });

    return NextResponse.json({ message: aiText, conversationLog: log, misbehaviorAction, earlyEnd });
  } catch (error: any) {
    console.error('Chat error:', error);
    // Surface quota / auth errors with their real HTTP status
    const status = error?.status ?? 500;
    const message =
      status === 429 ? 'AI quota exceeded — please wait a moment and try again.' :
      status === 401 || status === 403 ? 'AI API key is invalid or unauthorised.' :
      'Failed to process AI response';
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const iv = await prisma.interviewSession.findUnique({
      where: { id, userId: session.user.id },
      select: { conversationLog: true },
    });
    if (!iv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ conversationLog: iv.conversationLog });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
