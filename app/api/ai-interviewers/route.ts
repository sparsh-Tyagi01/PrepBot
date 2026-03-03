import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/ai-interviewers - Get all active AI interviewers
export async function GET(request: NextRequest) {
  try {
    const aiInterviewers = await prisma.aIInterviewer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(aiInterviewers);
  } catch (error) {
    console.error('Error fetching AI interviewers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI interviewers' },
      { status: 500 }
    );
  }
}
