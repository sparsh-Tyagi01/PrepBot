import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  userMessage: string,
  generationConfig: Record<string, unknown> = {},
): Promise<string> {
  const contents = [
    ...history,
    { role: 'user', parts: [{ text: userMessage }] },
  ];
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 500, ...generationConfig },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error: any = new Error(err?.error?.message ?? `Gemini ${res.status}`);
    error.status = res.status;
    throw error;
  }
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

function buildSystemPrompt(s: {
  aiInterviewer: { name: string; personality: string; description?: string | null };
  interviewType: { name: string };
  difficulty: string;
  duration: number;
}, timeRemainingSeconds?: number): string {
  const t = s.interviewType.name;
  const specific: Record<string, string> = {
    'Technical Interview':
      'Ask real coding/algorithmic problems. Present one problem, let the candidate explain their approach, then ask them to write code. When they submit code evaluate correctness, time/space complexity and edge cases. Ask follow-up optimisation questions.',
    'Behavioral Interview':
      'Use the STAR framework. Ask "Tell me about a time when..." or "Describe a situation where...". Probe for specifics: what was YOUR role, what actions did YOU take, what was the measurable result.',
    'System Design':
      'Present an open-ended architecture challenge such as Design a URL shortener or Design Twitter. Walk through requirements, high-level design, components, data models, scalability and trade-offs one step at a time.',
    'HR Interview':
      'Focus on culture fit, career goals, motivations and values. Ask about salary expectations, notice period, team preferences and long-term vision.',
    'Case Study':
      'Present a business problem. Guide through problem structure, data interpretation, hypothesis formation and a final recommendation. Probe analytical thinking and communication.',
  };

  // Build a time-pacing instruction based on remaining seconds
  let timePacing = '';
  if (timeRemainingSeconds !== undefined) {
    const minsLeft = Math.round(timeRemainingSeconds / 60);
    if (minsLeft <= 1) {
      timePacing = `\n\nTIME CRITICAL: Only about 1 minute remains. Ask ONE final brief closing question (e.g. any questions for us?) then say a professional goodbye. Do NOT start a new topic.`;
    } else if (minsLeft <= 3) {
      timePacing = `\n\nTIMING: Only ${minsLeft} minutes remaining. Wrap up the current topic with at most 1 more follow-up, then move to a closing question. Do NOT introduce a new major topic.`;
    } else if (minsLeft <= 5) {
      timePacing = `\n\nTIMING: About ${minsLeft} minutes left. Start transitioning toward final questions. Cover the most important remaining areas concisely.`;
    } else {
      timePacing = `\n\nTIMING: ${minsLeft} minutes remaining out of ${s.duration} total. Pace your questions so you cover all key areas before time runs out.`;
    }
  }

  return (
    `You are ${s.aiInterviewer.name}, a professional interviewer at a top-tier tech company.` +
    ` You are conducting a ${t} interview. Difficulty: ${s.difficulty}. Duration: ${s.duration} minutes.\n\n` +
    `Persona: ${s.aiInterviewer.personality} — ${s.aiInterviewer.description ?? ''}\n\n` +
    `Type-specific instructions:\n${specific[t] ?? 'Conduct a thorough professional interview.'}\n\n` +
    `STRICT rules — apply on EVERY single turn:\n` +
    `1. Speak naturally like a real human interviewer. No robotic language.\n` +
    `2. NEVER use markdown, bullet points, bold text, or numbered lists. Plain prose only.\n` +
    `3. Ask EXACTLY ONE question per response.\n` +
    `4. Keep each response to 2-4 sentences maximum.\n` +
    `5. If the candidate just answered, acknowledge in ONE brief sentence then ask your next question.\n` +
    `6. Do NOT say Great answer or That is excellent. Be measured and professional.\n` +
    `7. When the candidate submits code, give one sentence of feedback then ask a follow-up.\n` +
    `8. When the trigger is [SYSTEM_INIT], skip all welcomes and ask your FIRST real question immediately.` +
    timePacing
  );
}

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
    const isInit = message.startsWith('[SYSTEM_INIT]');

    // Add user message to visible log (skip system triggers)
    if (!isInit) {
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
    const toSend = isInit
      ? '[SYSTEM_INIT] Please ask your first interview question now.'
      : (popped?.parts[0].text ?? message);

    // systemInstruction ensures the AI has full context on EVERY turn
    const apiKey = process.env.GEMINI_API_KEY || '';
    const aiText = (
      await callGemini(apiKey, buildSystemPrompt(iv, timeRemainingSeconds), history, toSend)
    ) || 'Could you tell me a bit more about your background?';

    log.push({ speaker: 'ai', message: aiText, type: 'text', timestamp: new Date().toISOString() });

    await prisma.interviewSession.update({
      where: { id },
      data: { conversationLog: log },
    });

    return NextResponse.json({ message: aiText, conversationLog: log });
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
