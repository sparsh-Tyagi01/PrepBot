import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
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

// POST /api/interview-session/[id]/generate-report - Generate report for completed interview
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

    // Get interview session with full details
    const interviewSession = await prisma.interviewSession.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        aiInterviewer: true,
        interviewType: true,
      },
    });

    if (!interviewSession) {
      return NextResponse.json(
        { error: 'Interview session not found' },
        { status: 404 }
      );
    }

    if (interviewSession.status !== 'completed') {
      return NextResponse.json(
        { error: 'Interview is not completed yet' },
        { status: 400 }
      );
    }

    // Check if report already exists
    const existingReport = await prisma.report.findUnique({
      where: { interviewSessionId: id },
    });

    if (existingReport) {
      return NextResponse.json(existingReport);
    }

    // Generate report using AI
    const conversationLog = (interviewSession.conversationLog as any[]) || [];
    const conversationText = conversationLog
      .map((msg: any) => `${msg.speaker === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.message}`)
      .join('\n\n');

    const analysisPrompt = `You are an expert interview evaluator. Analyze the following interview conversation and provide a comprehensive report.

Interview Type: ${interviewSession.interviewType.name}
Difficulty Level: ${interviewSession.difficulty}
Interviewer: ${interviewSession.aiInterviewer.name} (${interviewSession.aiInterviewer.personality})

Conversation:
${conversationText}

Please provide a JSON response with the following structure:
{
  "score": number (0-100),
  "strengths": ["strength1", "strength2", ...] (3-5 items),
  "weaknesses": ["weakness1", "weakness2", ...] (3-5 items),
  "recommendations": ["rec1", "rec2", ...] (3-5 items),
  "analysis": "detailed 2-3 paragraph analysis",
  "skillBreakdown": {
    "communication": score (1-10),
    "technical_knowledge": score (1-10),
    "problem_solving": score (1-10),
    "clarity": score (1-10),
    "confidence": score (1-10)
  }
}

Provide ONLY the JSON response, no additional text.`;

    const apiKey = process.env.GEMINI_API_KEY || '';
    const responseText = await callGemini(apiKey, analysisPrompt);
    
    // Extract JSON from response (Gemini might include markdown formatting)
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }
    
    const reportData = JSON.parse(jsonText);

    // Create report in database
    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        interviewSessionId: id,
        overallScore: reportData.score || 0,
        strengths: reportData.strengths || [],
        weaknesses: reportData.weaknesses || [],
        recommendations: reportData.recommendations || [],
        detailedAnalysis: reportData.analysis || '',
        skillBreakdown: reportData.skillBreakdown || {},
      },
    });

    // Update interview session with score and feedback
    await prisma.interviewSession.update({
      where: { id },
      data: {
        score: reportData.score || 0,
        feedback: reportData.analysis || '',
      },
    });

    // Update user analytics
    await updateUserAnalytics(session.user.id, reportData.score || 0);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error generating report:', error);
    const status = error?.status ?? 500;
    const message =
      status === 429 ? 'AI quota exceeded — please wait a moment and try again.' :
      status === 401 || status === 403 ? 'AI API key is invalid or unauthorised.' :
      'Failed to generate report';
    return NextResponse.json({ error: message }, { status });
  }
}

async function updateUserAnalytics(userId: string, score: number) {
  try {
    const analytics = await prisma.analytics.findUnique({
      where: { userId },
    });

    if (analytics) {
      const newTotal = analytics.totalInterviews + 1;
      const newAverage = (analytics.averageScore * analytics.totalInterviews + score) / newTotal;

      await prisma.analytics.update({
        where: { userId },
        data: {
          totalInterviews: newTotal,
          averageScore: newAverage,
          lastInterviewDate: new Date(),
        },
      });
    } else {
      await prisma.analytics.create({
        data: {
          userId,
          totalInterviews: 1,
          averageScore: score,
          lastInterviewDate: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
}
