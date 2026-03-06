import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getInstitutionId(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { institutionId: true } });
  return user?.institutionId ?? null;
}

// GET — list sections for a branch
export async function GET(_req: Request, { params }: { params: Promise<{ branchId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) return NextResponse.json({ error: "No institution linked" }, { status: 404 });

    const { branchId } = await params;
    const branch = await prisma.branch.findFirst({ where: { id: branchId, institutionId } });
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const sections = await prisma.branchSection.findMany({
      where: { branchId },
      include: { _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("Get sections error:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

// POST — create section in a branch
export async function POST(request: Request, { params }: { params: Promise<{ branchId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) return NextResponse.json({ error: "No institution linked" }, { status: 404 });

    const { branchId } = await params;
    const branch = await prisma.branch.findFirst({ where: { id: branchId, institutionId } });
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const body = await request.json();
    const name = body.name?.trim();
    const description = body.description?.trim() || null;
    const rawCode = body.code?.trim().toUpperCase();

    if (!name) return NextResponse.json({ error: "Section name is required" }, { status: 400 });

    let code = rawCode;
    if (!code) {
      // Auto: branch-code prefix + section base + random
      const sectionBase = name.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 2).padEnd(2, "X");
      const suffix = Math.random().toString(36).substring(2, 4).toUpperCase();
      code = `${branch.code.slice(0, 3)}${sectionBase}${suffix}`;
    }

    const existing = await prisma.branchSection.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: "Code already in use. Choose a different code." }, { status: 409 });

    const section = await prisma.branchSection.create({
      data: { branchId, name, code, description },
      include: { _count: { select: { users: true } } },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error("Create section error:", error);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}
