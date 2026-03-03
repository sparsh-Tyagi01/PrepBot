import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/interview-types - Get all interview types (global + caller's institution)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Allow explicit override via query param (used by institution admin portal)
    let institutionId = searchParams.get('institutionId');

    // If no explicit param, resolve from the authenticated user's linked institution
    if (!institutionId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { institutionId: true },
        });
        institutionId = user?.institutionId ?? null;
      }
    }

    const where = institutionId
      ? { OR: [{ isGlobal: true }, { institutionId }] }
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
