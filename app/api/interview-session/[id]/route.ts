import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/interview-session/[id] - Get a specific interview session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const interviewSession = await prisma.interviewSession.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        aiInterviewer: true,
        interviewType: true,
        report: true,
      },
    });

    if (!interviewSession) {
      return NextResponse.json(
        { error: 'Interview session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(interviewSession);
  } catch (error) {
    console.error('Error fetching interview session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview session' },
      { status: 500 }
    );
  }
}

// PATCH /api/interview-session/[id] - Update interview session
export async function PATCH(
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
    const { status, score, feedback, conversationLog, questionsAsked, videoRecording, audioRecording } = body;

    // Verify ownership
    const existing = await prisma.interviewSession.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Interview session not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'in-progress' && !existing.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === 'completed' && !existing.completedAt) {
        updateData.completedAt = new Date();
      }
    }
    if (score !== undefined) updateData.score = score;
    if (feedback) updateData.feedback = feedback;
    if (conversationLog) updateData.conversationLog = conversationLog;
    if (questionsAsked) updateData.questionsAsked = questionsAsked;
    if (videoRecording) updateData.videoRecording = videoRecording;
    if (audioRecording) updateData.audioRecording = audioRecording;

    const updated = await prisma.interviewSession.update({
      where: { id },
      data: updateData,
      include: {
        aiInterviewer: true,
        interviewType: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating interview session:', error);
    return NextResponse.json(
      { error: 'Failed to update interview session' },
      { status: 500 }
    );
  }
}
