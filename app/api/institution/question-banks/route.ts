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

// GET question banks for institution (optionally filter by interviewTypeId)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) {
      return NextResponse.json({ error: "No institution linked" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const interviewTypeId = searchParams.get("typeId");

    const where: Record<string, unknown> = { institutionId };
    if (interviewTypeId) where.interviewTypeId = interviewTypeId;

    const questionBanks = await prisma.questionBank.findMany({
      where,
      include: {
        interviewType: { select: { name: true, icon: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ questionBanks });
  } catch (error) {
    console.error("Get question banks error:", error);
    return NextResponse.json({ error: "Failed to fetch question banks" }, { status: 500 });
  }
}

// POST create question bank
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
    const { name, description, interviewTypeId, difficulty, branchId, sectionId } = body;

    if (!name || !interviewTypeId) {
      return NextResponse.json({ error: "Name and interview type are required" }, { status: 400 });
    }

    const questionBank = await prisma.questionBank.create({
      data: {
        institution: { connect: { id: institutionId } },
        interviewType: { connect: { id: interviewTypeId } },
        name,
        description,
        difficulty: difficulty || "medium",
        branchId: branchId || null,
        sectionId: sectionId || null,
      },
      include: {
        interviewType: { select: { name: true, icon: true } },
        _count: { select: { questions: true } },
      },
    });

    return NextResponse.json({ questionBank }, { status: 201 });
  } catch (error) {
    console.error("Create question bank error:", error);
    return NextResponse.json({ error: "Failed to create question bank" }, { status: 500 });
  }
}
