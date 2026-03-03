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
        createdAt: true,
        _count: { select: { interviewSessions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
