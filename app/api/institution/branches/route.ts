import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getInstitutionId(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { institutionId: true } });
  return user?.institutionId ?? null;
}

// GET — list all branches for this institution (with section counts)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) return NextResponse.json({ error: "No institution linked" }, { status: 404 });

    const branches = await prisma.branch.findMany({
      where: { institutionId },
      include: {
        _count: { select: { sections: true, users: true } },
        sections: {
          select: { id: true, name: true, code: true, _count: { select: { users: true } } },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Get branches error:", error);
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

// POST — create a branch (generates a unique join code)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) return NextResponse.json({ error: "No institution linked" }, { status: 404 });

    const body = await request.json();
    const name = body.name?.trim();
    const description = body.description?.trim() || null;
    // Allow custom code or auto-generate
    const rawCode = body.code?.trim().toUpperCase();

    if (!name) return NextResponse.json({ error: "Branch name is required" }, { status: 400 });

    // Generate a unique 6-char alphanumeric code if not provided
    let code = rawCode;
    if (!code) {
      const base = name.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 3).padEnd(3, "X");
      const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      code = `${base}${suffix}`;
    }

    // Ensure code is unique
    const existing = await prisma.branch.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Code already in use. Choose a different code." }, { status: 409 });
    }

    const branch = await prisma.branch.create({
      data: { institutionId, name, code, description },
      include: {
        _count: { select: { sections: true, users: true } },
        sections: { select: { id: true, name: true, code: true, _count: { select: { users: true } } } },
      },
    });

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    console.error("Create branch error:", error);
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }
}
