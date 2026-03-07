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
    const { name, description, icon, duration, difficulty, requireResume, branchIds, sectionIds } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const branchArr: string[] = Array.isArray(branchIds) ? branchIds.filter(Boolean) : [];
    const sectionArr: string[] = Array.isArray(sectionIds) ? sectionIds.filter(Boolean) : [];

    // Replace branch/section targeting in a transaction
    const interviewType = await prisma.$transaction(async (tx) => {
      await tx.interviewTypeBranch.deleteMany({ where: { interviewTypeId: id } });
      await tx.interviewTypeSection.deleteMany({ where: { interviewTypeId: id } });

      return tx.interviewType.update({
        where: { id },
        data: {
          name,
          description: description || null,
          icon: icon || "📋",
          duration: duration ? Number(duration) : null,
          difficulty: difficulty || null,
          requireResume: requireResume === true,
          branches: branchArr.length
            ? { create: branchArr.map((branchId) => ({ branchId })) }
            : undefined,
          sections: sectionArr.length
            ? { create: sectionArr.map((sectionId) => ({ sectionId })) }
            : undefined,
        },
        include: {
          _count: { select: { questionBanks: true, interviewSessions: true } },
          branches: { select: { branch: { select: { id: true, name: true, code: true } } } },
          sections: { select: { section: { select: { id: true, name: true, code: true } } } },
        },
      });
    });

    const shaped = {
      ...interviewType,
      branches: interviewType.branches.map(b => b.branch),
      sections: interviewType.sections.map(s => s.section),
    };

    return NextResponse.json({ interviewType: shaped });
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
