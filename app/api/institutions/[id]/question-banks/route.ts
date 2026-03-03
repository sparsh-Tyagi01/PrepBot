import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/institutions/[id]/question-banks - Get institution's question banks
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

    // Check if user is institution admin or super admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (
      user?.role !== 'super-admin' &&
      (user?.role !== 'institution-admin' || user?.institutionId !== id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const questionBanks = await prisma.questionBank.findMany({
      where: { institutionId: id },
      include: {
        interviewType: true,
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(questionBanks);
  } catch (error) {
    console.error('Error fetching question banks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question banks' },
      { status: 500 }
    );
  }
}

// POST /api/institutions/[id]/question-banks - Create a new question bank
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

    // Check if user is institution admin or super admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (
      user?.role !== 'super-admin' &&
      (user?.role !== 'institution-admin' || user?.institutionId !== id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, interviewTypeId, difficulty } = body;

    if (!name || !interviewTypeId) {
      return NextResponse.json(
        { error: 'Name and interview type are required' },
        { status: 400 }
      );
    }

    const questionBank = await prisma.questionBank.create({
      data: {
        institutionId: id,
        name,
        description,
        interviewTypeId,
        difficulty: difficulty || 'medium',
      },
      include: {
        interviewType: true,
      },
    });

    return NextResponse.json(questionBank);
  } catch (error) {
    console.error('Error creating question bank:', error);
    return NextResponse.json(
      { error: 'Failed to create question bank' },
      { status: 500 }
    );
  }
}
