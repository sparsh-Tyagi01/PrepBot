import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getInstitutionId(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { institutionId: true } });
  return user?.institutionId ?? null;
}

// PATCH — update branch name/description/code
export async function PATCH(request: Request, { params }: { params: Promise<{ branchId: string }> }) {
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
    const updated = await prisma.branch.update({
      where: { id: branchId },
      data: {
        name: body.name?.trim() || branch.name,
        description: body.description?.trim() ?? branch.description,
        code: body.code?.trim().toUpperCase() || branch.code,
      },
      include: {
        _count: { select: { sections: true, users: true } },
        sections: { select: { id: true, name: true, code: true, _count: { select: { users: true } } } },
      },
    });

    return NextResponse.json({ branch: updated });
  } catch (error) {
    console.error("Update branch error:", error);
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 });
  }
}

// DELETE — delete a branch
export async function DELETE(_req: Request, { params }: { params: Promise<{ branchId: string }> }) {
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

    await prisma.branch.delete({ where: { id: branchId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete branch error:", error);
    return NextResponse.json({ error: "Failed to delete branch" }, { status: 500 });
  }
}
