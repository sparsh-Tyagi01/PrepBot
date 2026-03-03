import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/institutions - Get all institutions (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const institutions = await prisma.institution.findMany({
      include: {
        subscription: true,
        _count: {
          select: {
            users: true,
            questionBanks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(institutions);
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions' },
      { status: 500 }
    );
  }
}

// POST /api/institutions - Create a new institution (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, logo, address, phone, type } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const institution = await prisma.institution.create({
      data: {
        name,
        email,
        logo,
        address,
        phone,
        type: type || 'university',
        subscription: {
          create: {
            tier: 'free',
            maxStudents: 50,
            maxQuestions: 100,
            maxAIInterviewers: 3,
            features: ['basic-interviews', 'analytics'],
          },
        },
        analytics: {
          create: {},
        },
      },
      include: {
        subscription: true,
        analytics: true,
      },
    });

    return NextResponse.json(institution);
  } catch (error) {
    console.error('Error creating institution:', error);
    return NextResponse.json(
      { error: 'Failed to create institution' },
      { status: 500 }
    );
  }
}
