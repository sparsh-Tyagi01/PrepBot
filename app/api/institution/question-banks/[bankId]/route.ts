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

// PATCH update a question bank
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bankId: string }> }
) {
  try {
    const { bankId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) {
      return NextResponse.json({ error: "No institution linked" }, { status: 404 });
    }

    const existing = await prisma.questionBank.findFirst({
      where: { id: bankId, institutionId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Question bank not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, interviewTypeId, difficulty } = body;

    if (!name || !interviewTypeId) {
      return NextResponse.json({ error: "Name and interview type are required" }, { status: 400 });
    }

    const questionBank = await prisma.questionBank.update({
      where: { id: bankId },
      data: { name, description, interviewTypeId, difficulty: difficulty || "medium" },
      include: {
        interviewType: { select: { name: true, icon: true } },
        _count: { select: { questions: true } },
      },
    });

    return NextResponse.json({ questionBank });
  } catch (error) {
    console.error("Update question bank error:", error);
    return NextResponse.json({ error: "Failed to update question bank" }, { status: 500 });
  }
}

// DELETE a question bank
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bankId: string }> }
) {
  try {
    const { bankId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) {
      return NextResponse.json({ error: "No institution linked" }, { status: 404 });
    }

    const existing = await prisma.questionBank.findFirst({
      where: { id: bankId, institutionId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Question bank not found" }, { status: 404 });
    }

    await prisma.questionBank.delete({ where: { id: bankId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete question bank error:", error);
    return NextResponse.json({ error: "Failed to delete question bank" }, { status: 500 });
  }
}
