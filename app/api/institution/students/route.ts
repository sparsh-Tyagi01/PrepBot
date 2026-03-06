import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { institutionId: true },
    });

    if (!admin?.institutionId) {
      return NextResponse.json({ error: "No institution linked" }, { status: 404 });
    }

    const students = await prisma.user.findMany({
      where: { institutionId: admin.institutionId, role: "student" },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        yearOfStudy: true,
        branchId: true,
        sectionId: true,
        branch: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true, code: true } },
        createdAt: true,
        _count: { select: { interviewSessions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json(
      { error: "Failed to fetch students", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE — institution admin removes a student
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = await request.json();
    if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { institutionId: true },
    });

    if (!admin?.institutionId) {
      return NextResponse.json({ error: "No institution linked" }, { status: 404 });
    }

    // Confirm the student actually belongs to this institution
    const student = await prisma.user.findFirst({
      where: { id: studentId, institutionId: admin.institutionId, role: "student" },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found in your institution" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: studentId },
      data: { institutionId: null, branchId: null, sectionId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove student error:", error);
    return NextResponse.json({ error: "Failed to remove student" }, { status: 500 });
  }
}
