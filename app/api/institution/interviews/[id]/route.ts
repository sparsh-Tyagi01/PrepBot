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

// PATCH update a custom interview type
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) {
      return NextResponse.json({ error: "No institution linked" }, { status: 404 });
    }

    // Ensure the interview type belongs to this institution and is not global
    const existing = await prisma.interviewType.findFirst({
      where: { id, institutionId, isGlobal: false },
    });

    if (!existing) {
      return NextResponse.json({ error: "Interview type not found or not editable" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, icon, duration, difficulty } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const interviewType = await prisma.interviewType.update({
      where: { id },
      data: { name, description, icon: icon || "📋", duration: duration ? Number(duration) : null, difficulty: difficulty || null },
      include: {
        _count: { select: { questionBanks: true, interviewSessions: true } },
      },
    });

    return NextResponse.json({ interviewType });
  } catch (error) {
    console.error("Update interview type error:", error);
    return NextResponse.json({ error: "Failed to update interview type" }, { status: 500 });
  }
}

// DELETE a custom interview type
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) {
      return NextResponse.json({ error: "No institution linked" }, { status: 404 });
    }

    // Ensure the interview type belongs to this institution and is not global
    const existing = await prisma.interviewType.findFirst({
      where: { id, institutionId, isGlobal: false },
    });

    if (!existing) {
      return NextResponse.json({ error: "Interview type not found or not deletable" }, { status: 404 });
    }

    await prisma.interviewType.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete interview type error:", error);
    return NextResponse.json({ error: "Failed to delete interview type" }, { status: 500 });
  }
}
