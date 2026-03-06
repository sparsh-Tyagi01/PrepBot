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

// PATCH update a question
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bankId: string; questionId: string }> }
) {
  try {
    const { bankId, questionId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) {
      return NextResponse.json({ error: "No institution linked" }, { status: 404 });
    }

    // Verify the question bank belongs to this institution
    const bank = await prisma.questionBank.findFirst({
      where: { id: bankId, institutionId },
    });

    if (!bank) {
      return NextResponse.json({ error: "Question bank not found" }, { status: 404 });
    }

    const existing = await prisma.question.findFirst({
      where: { id: questionId, questionBankId: bankId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const body = await request.json();
    const { question, expectedAnswer, difficulty, timeAllocation } = body;

    if (!question) {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 });
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        question,
        expectedAnswer: expectedAnswer || null,
        difficulty: difficulty || "medium",
        timeAllocation: timeAllocation || 5,
      },
      select: {
        id: true,
        question: true,
        expectedAnswer: true,
        difficulty: true,
        timeAllocation: true,
        order: true,
      },
    });

    return NextResponse.json({ question: updated });
  } catch (error) {
    console.error("Update question error:", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

// DELETE a question
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bankId: string; questionId: string }> }
) {
  try {
    const { bankId, questionId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) {
      return NextResponse.json({ error: "No institution linked" }, { status: 404 });
    }

    // Verify the question bank belongs to this institution
    const bank = await prisma.questionBank.findFirst({
      where: { id: bankId, institutionId },
    });

    if (!bank) {
      return NextResponse.json({ error: "Question bank not found" }, { status: 404 });
    }

    const existing = await prisma.question.findFirst({
      where: { id: questionId, questionBankId: bankId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    await prisma.question.delete({ where: { id: questionId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
