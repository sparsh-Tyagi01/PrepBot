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
        branches: { select: { branchId: true, branch: { select: { id: true, name: true, code: true } } } },
        sections: { select: { sectionId: true, section: { select: { id: true, name: true, code: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const shaped = interviewTypes.map(t => ({
      ...t,
      branches: t.branches.map(b => b.branch),
      sections: t.sections.map(s => s.section),
    }));

    return NextResponse.json({ interviewTypes: shaped });
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
    const { name, description, icon, duration, difficulty, requireResume, branchIds, sectionIds } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const branchArr: string[] = Array.isArray(branchIds) ? branchIds.filter(Boolean) : [];
    const sectionArr: string[] = Array.isArray(sectionIds) ? sectionIds.filter(Boolean) : [];

    const interviewType = await prisma.interviewType.create({
      data: {
        institutionId,
        name,
        description: description || null,
        icon: icon || "📋",
        isGlobal: false,
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

    const shaped = {
      ...interviewType,
      branches: interviewType.branches.map(b => b.branch),
      sections: interviewType.sections.map(s => s.section),
    };

    return NextResponse.json({ interviewType: shaped }, { status: 201 });
  } catch (error) {
    console.error("Create interview type error:", error);
    return NextResponse.json({ error: "Failed to create interview type" }, { status: 500 });
  }
}
