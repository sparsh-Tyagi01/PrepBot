import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callGemini, buildSystemPrompt, parseAIResponse } from '@/lib/interview-prompts';

interface VapiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface VapiCustomLLMPayload {
  model?: string;
  messages?: VapiMessage[];
  call?: {
    id: string;
    metadata?: {
      sessionId?: string;
      userId?: string;
    };
  };
  metadata?: {
    sessionId?: string;
  };
  // Standard webhook fields
  type?: string;
  transcript?: string;
  phoneNumber?: string;
  timestamp?: string;
}

async function fetchInstitutionQuestions(
  userId: string,
  interviewTypeId: string,
  difficulty: string
): Promise<{ question: string; expectedAnswer?: string | null; keyPoints?: unknown }[]> {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: { institutionId: true },
  });

  if (!userData?.institutionId) return [];

  const banks = await prisma.questionBank.findMany({
    where: {
      institutionId: userData.institutionId,
      interviewTypeId,
      isActive: true,
      difficulty,
    },
    include: {
      questions: {
        where: { isActive: true, difficulty },
        orderBy: { order: 'asc' },
      },
    },
  });

  let questions = banks.flatMap((b) => b.questions);

  if (questions.length === 0) {
    const allBanks = await prisma.questionBank.findMany({
      where: {
        institutionId: userData.institutionId,
        interviewTypeId,
        isActive: true,
      },
      include: {
        questions: { where: { isActive: true }, orderBy: { order: 'asc' } },
      },
    });
    questions = allBanks.flatMap((b) => b.questions);
  }

  return questions;
}

export async function POST(request: NextRequest) {
  try {
    const payload: VapiCustomLLMPayload = await request.json();

    console.log('[Vapi Webhook] Received payload:', JSON.stringify(payload, null, 2));

    // Check if this is a custom LLM request (has messages array and model field)
    // Vapi's custom LLM sends OpenAI-compatible format
    if (payload.messages && Array.isArray(payload.messages)) {
      // This is a custom LLM request from Vapi
      const sessionId = payload.call?.metadata?.sessionId || payload.metadata?.sessionId;

      console.log('[Vapi Webhook] Custom LLM request, sessionId:', sessionId);

      if (!sessionId) {
        // Return a default response if no session ID
        return NextResponse.json({
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'gemini',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: "Hello! I'm your interviewer. Could you tell me a little about yourself?",
            },
            finish_reason: 'stop',
          }],
        });
      }

      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: { aiInterviewer: true, interviewType: true },
      });

      if (!session) {
        return NextResponse.json({
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'gemini',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: "I apologize, but there seems to be a technical issue. Please try starting a new interview session.",
            },
            finish_reason: 'stop',
          }],
        });
      }

      // Get messages from payload
      const messages = payload.messages;

      // Find the last user message
      const userMessages = messages.filter(m => m.role === 'user');
      const userMessage = userMessages.length > 0
        ? userMessages[userMessages.length - 1].content
        : '';

      // Fetch institution questions
      const institutionQuestions = await fetchInstitutionQuestions(
        session.userId,
        session.interviewTypeId,
        session.difficulty
      );

      // Build Gemini history from messages (excluding last user message and system messages)
      const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
      for (const msg of messages) {
        if (msg.role === 'system') continue;
        if (msg.role === 'user') {
          // Don't include the last user message in history (it's sent separately)
          if (msg.content === userMessage && messages.indexOf(msg) === messages.length - 1) continue;
          history.push({ role: 'user', parts: [{ text: msg.content }] });
        } else if (msg.role === 'assistant') {
          history.push({ role: 'model', parts: [{ text: msg.content }] });
        }
      }

      // Calculate time remaining
      const startTime = session.startedAt || session.createdAt;
      const elapsedSeconds = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      const timeRemainingSeconds = Math.max(0, session.duration * 60 - elapsedSeconds);

      // Check if this is the first question after greeting
      const isInitialTurn = history.filter(h => h.role === 'model').length <= 1;

      // Build system prompt
      const systemPrompt = buildSystemPrompt(
        session,
        timeRemainingSeconds,
        institutionQuestions.length > 0 ? institutionQuestions : undefined,
        session.resumeText ?? null,
        isInitialTurn
      );

      // Call Gemini
      const apiKey = process.env.GEMINI_API_KEY || '';
      let aiText = '';

      try {
        aiText = await callGemini(apiKey, systemPrompt, history, userMessage || 'Hello');
      } catch (e) {
        console.error('[Vapi Webhook] Gemini error:', e);
        aiText = "I'm sorry, I'm having a technical difficulty. Could you repeat that?";
      }

      if (!aiText) {
        aiText = 'Could you tell me a bit more about that?';
      }

      // Parse response for action tokens
      const { text, misbehaviorAction, earlyEnd } = parseAIResponse(aiText);

      // Update conversation log in database
      const log = (session.conversationLog as any[]) || [];
      if (userMessage) {
        log.push({ speaker: 'user', message: userMessage, type: 'text', timestamp: new Date().toISOString() });
      }
      log.push({ speaker: 'ai', message: text, type: 'text', timestamp: new Date().toISOString() });

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { conversationLog: log },
      });

      // Return OpenAI-compatible response format
      return NextResponse.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'gemini',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: text,
          },
          finish_reason: earlyEnd || misbehaviorAction === 'end' ? 'stop' : 'stop',
        }],
      });
    }

    // Handle other Vapi webhook types (non-custom-LLM events)
    const sessionId = payload.call?.metadata?.sessionId;
    const eventType = payload.type;

    console.log('[Vapi Webhook] Event type:', eventType, 'sessionId:', sessionId);

    switch (eventType) {
      case 'transcript': {
        if (!sessionId) return NextResponse.json({ ok: true });
        const transcript = payload.transcript;
        if (transcript) {
          console.log('[Vapi Webhook] Transcript:', transcript);
        }
        return NextResponse.json({ ok: true });
      }

      case 'end-of-call-report': {
        if (!sessionId) return NextResponse.json({ ok: true });
        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: { status: 'completed' },
        });
        // Trigger report generation
        fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/interview-session/${sessionId}/generate-report`, {
          method: 'POST',
        }).catch(() => {});
        return NextResponse.json({ ok: true });
      }

      case 'speech-update':
      case 'hang':
      case 'status-update': {
        return NextResponse.json({ ok: true });
      }

      default:
        console.log('[Vapi Webhook] Unhandled event:', eventType);
        return NextResponse.json({ ok: true });
    }
  } catch (error) {
    console.error('[Vapi Webhook] Error:', error);
    // Return a valid response even on error to prevent Vapi from retrying
    return NextResponse.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gemini',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: "I apologize, there was a technical issue. Could you please repeat that?",
        },
        finish_reason: 'stop',
      }],
    });
  }
}
