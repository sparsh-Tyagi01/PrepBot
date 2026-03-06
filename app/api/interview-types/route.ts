import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/interview-types - Get all interview types (global + caller's institution, filtered by branch/section)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Allow explicit override via query param (used by institution admin portal)
    let institutionId = searchParams.get('institutionId');
    let branchId: string | null = null;
    let sectionId: string | null = null;

    // If no explicit param, resolve from the authenticated user's linked institution
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

    // Build filter: global types + institution types that match student's branch/section
    let where: Record<string, unknown>;
    if (institutionId) {
      // Institution-level conditions: accessible if the type targets this student specifically
      const institutionConditions: Record<string, unknown>[] = [
        // Institution-wide (no branch/section restriction)
        { institutionId, branchId: null, sectionId: null },
      ];
      if (branchId) {
        // Branch-level (targeted at student's branch, no section restriction)
        institutionConditions.push({ institutionId, branchId, sectionId: null });
      }
      if (sectionId) {
        // Section-level (targeted at student's exact section)
        institutionConditions.push({ institutionId, sectionId });
      }
      where = { OR: [{ isGlobal: true }, ...institutionConditions] };
    } else {
      where = { isGlobal: true };
    }

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
