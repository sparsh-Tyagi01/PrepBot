import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/interview-session - Create a new interview session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('[Auth] No session found or user ID missing:', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userId: session?.user?.id 
      });
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'You must be logged in to create an interview session',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    const body = await request.json();
    const { interviewTypeId, aiInterviewerId, title, difficulty, duration } = body;

    if (!interviewTypeId || !aiInterviewerId || !title || !difficulty || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const interviewSession = await prisma.interviewSession.create({
      data: {
        userId: session.user.id,
        interviewTypeId,
        aiInterviewerId,
        title,
        difficulty,
        duration,
        status: 'pending',
        questionsAsked: [],
      },
      include: {
        aiInterviewer: true,
        interviewType: true,
      },
    });

    console.log('[Interview Session] Created successfully:', interviewSession.id);
    return NextResponse.json(interviewSession);
  } catch (error) {
    console.error('[Interview Session] Error creating:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create interview session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/interview-session - Get user's interview sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    const where: any = { userId: session.user.id };
    if (status) {
      where.status = status;
    }

    const queryOptions: any = {
      where,
      include: {
        aiInterviewer: true,
        interviewType: true,
      },
      orderBy: { createdAt: 'desc' },
    };

    if (limit) {
      queryOptions.take = parseInt(limit);
    }

    const interviewSessions = await prisma.interviewSession.findMany(queryOptions);

    return NextResponse.json(interviewSessions);
  } catch (error) {
    console.error('Error fetching interview sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview sessions' },
      { status: 500 }
    );
  }
}
