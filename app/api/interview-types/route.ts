import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/interview-types - Get all interview types (global + caller's institution, filtered by branch/section)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let institutionId = searchParams.get('institutionId');
    let branchId: string | null = null;
    let sectionId: string | null = null;

    if (!institutionId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { institutionId: true, branchId: true, sectionId: true },
        });
        institutionId = user?.institutionId ?? null;
        branchId = user?.branchId ?? null;
        sectionId = user?.sectionId ?? null;
      }
    }

    // Build filter:
    // - Always include global types
    // - For institution types: include if no branches/sections are targeted (visible to all),
    //   OR if student's branch is in the targeted branches,
    //   OR if student's section is in the targeted sections
    let where: Record<string, unknown>;
    if (institutionId) {
      const institutionConditions: Record<string, unknown>[] = [
        // Institution-wide: no targeting at all
        {
          institutionId,
          branches: { none: {} },
          sections: { none: {} },
        },
      ];

      if (branchId) {
        // Targeted to student's branch (and not further narrowed to a specific section)
        institutionConditions.push({
          institutionId,
          branches: { some: { branchId } },
          sections: { none: {} },
        });
      }

      if (sectionId) {
        // Targeted to student's exact section
        institutionConditions.push({
          institutionId,
          sections: { some: { sectionId } },
        });
      }

      where = { OR: [{ isGlobal: true }, ...institutionConditions] };
    } else {
      where = { isGlobal: true };
    }

    const interviewTypes = await prisma.interviewType.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        isGlobal: true,
        duration: true,
        difficulty: true,
        requireResume: true,
      },
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
