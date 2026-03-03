import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/interview-types - Get all interview types (global + institution-specific)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institutionId');

    const where = institutionId
      ? {
          OR: [
            { isGlobal: true },
            { institutionId: institutionId },
          ],
        }
      : { isGlobal: true };

    const interviewTypes = await prisma.interviewType.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(interviewTypes);
  } catch (error) {
    console.error('Error fetching interview types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview types' },
      { status: 500 }
    );
  }
}
