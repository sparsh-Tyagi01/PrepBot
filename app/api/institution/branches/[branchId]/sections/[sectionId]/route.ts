import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getInstitutionId(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { institutionId: true } });
  return user?.institutionId ?? null;
}

// PATCH — update section
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) return NextResponse.json({ error: "No institution linked" }, { status: 404 });

    const { branchId, sectionId } = await params;
    const branch = await prisma.branch.findFirst({ where: { id: branchId, institutionId } });
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const section = await prisma.branchSection.findFirst({ where: { id: sectionId, branchId } });
    if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });

    const body = await request.json();
    const updated = await prisma.branchSection.update({
      where: { id: sectionId },
      data: {
        name: body.name?.trim() || section.name,
        description: body.description?.trim() ?? section.description,
        code: body.code?.trim().toUpperCase() || section.code,
      },
      include: { _count: { select: { users: true } } },
    });

    return NextResponse.json({ section: updated });
  } catch (error) {
    console.error("Update section error:", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

// DELETE — delete section
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ branchId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const institutionId = await getInstitutionId(session.user.id);
    if (!institutionId) return NextResponse.json({ error: "No institution linked" }, { status: 404 });

    const { branchId, sectionId } = await params;
    const branch = await prisma.branch.findFirst({ where: { id: branchId, institutionId } });
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const section = await prisma.branchSection.findFirst({ where: { id: sectionId, branchId } });
    if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });

    await prisma.branchSection.delete({ where: { id: sectionId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete section error:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
