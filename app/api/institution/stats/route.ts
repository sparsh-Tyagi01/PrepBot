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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { institutionId: true },
    });

    if (!user?.institutionId) {
      return NextResponse.json({ error: "No institution linked to this account" }, { status: 404 });
    }

    const institutionId = user.institutionId;

    const [institution, totalStudents, interviewTypes, recentSessions, totalInterviewsCount] = await Promise.all([
      prisma.institution.findUnique({
        where: { id: institutionId },
        select: { id: true, name: true, type: true, email: true, joinCode: true, createdAt: true },
      }),
      prisma.user.count({
        where: { institutionId, role: "student" },
      }),
      prisma.interviewType.count({
        where: { institutionId },
      }),
      prisma.interviewSession.findMany({
        where: {
          user: { institutionId },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          score: true,
          status: true,
          createdAt: true,
          user: { select: { name: true } },
          interviewType: { select: { name: true } },
        },
      }),
      prisma.interviewSession.count({
        where: { user: { institutionId } },
      }),
    ]);

    // Calculate average score from recent sessions
    const completedSessions = await prisma.interviewSession.findMany({
      where: {
        user: { institutionId },
        status: "completed",
        score: { not: null },
      },
      select: { score: true },
    });

    const avgScore =
      completedSessions.length > 0
        ? completedSessions.reduce((sum: number, s) => sum + (s.score ?? 0), 0) / completedSessions.length
        : 0;

    return NextResponse.json({
      institution,
      stats: {
        totalStudents,
        totalInterviews: totalInterviewsCount,
        averageScore: Math.round(avgScore),
        customInterviewTypes: interviewTypes,
      },
      recentSessions: recentSessions.map((s) => ({
        id: s.id,
        title: s.title,
        studentName: s.user.name,
        interviewType: s.interviewType.name,
        score: s.score,
        status: s.status,
        date: s.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Institution stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
