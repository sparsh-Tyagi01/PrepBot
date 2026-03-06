import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getInstitutionId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { institutionId: true },
  });
  return user?.institutionId;
}

// GET all interview types for this institution (custom + global)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) {
      return NextResponse.json({ error: "No institution linked" }, { status: 404 });
    }

    const interviewTypes = await prisma.interviewType.findMany({
      where: {
        OR: [{ institutionId }, { isGlobal: true }],
      },
      include: {
        _count: { select: { questionBanks: true, interviewSessions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ interviewTypes });
  } catch (error) {
    console.error("Get interview types error:", error);
    return NextResponse.json({ error: "Failed to fetch interview types" }, { status: 500 });
  }
}

// POST create a new interview type for this institution
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) {
      return NextResponse.json({ error: "No institution linked" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, icon, duration, difficulty, branchId, sectionId } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const interviewType = await prisma.interviewType.create({
      data: {
        institution: { connect: { id: institutionId } },
        name,
        description,
        icon: icon || "📋",
        isGlobal: false,
        duration: duration ? Number(duration) : null,
        difficulty: difficulty || null,
        branchId: branchId || null,
        sectionId: sectionId || null,
      },
      include: {
        _count: { select: { questionBanks: true, interviewSessions: true } },
      },
    });

    return NextResponse.json({ interviewType }, { status: 201 });
  } catch (error) {
    console.error("Create interview type error:", error);
    return NextResponse.json({ error: "Failed to create interview type" }, { status: 500 });
  }
}
