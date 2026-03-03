import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all questions in a bank
export async function GET(request: Request, { params }: { params: Promise<{ bankId: string }> }) {
  try {
    const { bankId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questions = await prisma.question.findMany({
      where: { questionBankId: bankId, isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        question: true,
        expectedAnswer: true,
        difficulty: true,
        timeAllocation: true,
        order: true,
      },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Get questions error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

// POST add a question to a bank
export async function POST(request: Request, { params }: { params: Promise<{ bankId: string }> }) {
  try {
    const { bankId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { question, expectedAnswer, difficulty, timeAllocation } = body;

    if (!question) {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 });
    }

    // Get current max order
    const maxOrder = await prisma.question.aggregate({
      where: { questionBankId: bankId },
      _max: { order: true },
    });

    const newQuestion = await prisma.question.create({
      data: {
        questionBankId: bankId,
        question,
        expectedAnswer: expectedAnswer || null,
        difficulty: difficulty || "medium",
        timeAllocation: timeAllocation || 5,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json({ question: newQuestion }, { status: 201 });
  } catch (error) {
    console.error("Add question error:", error);
    return NextResponse.json({ error: "Failed to add question" }, { status: 500 });
  }
}
