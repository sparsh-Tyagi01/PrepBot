import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/institution/students/[studentId]
// Returns the student's profile + all their reports/interviews (institution-admin only)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "institution-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = await params;

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { institutionId: true },
    });

    if (!admin?.institutionId) {
      return NextResponse.json({ error: "No institution linked" }, { status: 404 });
    }

    // Confirm student belongs to this institution
    const student = await prisma.user.findFirst({
      where: { id: studentId, institutionId: admin.institutionId, role: "student" },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        yearOfStudy: true,
        branch: true,
        section: true,
        createdAt: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Fetch all interview sessions with reports
    const sessions = await prisma.interviewSession.findMany({
      where: { userId: studentId },
      include: {
        interviewType: { select: { name: true, icon: true } },
        report: {
          select: {
            id: true,
            overallScore: true,
            strengths: true,
            weaknesses: true,
            recommendations: true,
            detailedAnalysis: true,
            skillBreakdown: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate stats
    const completedSessions = sessions.filter((s) => s.status === "completed");
    const scores = completedSessions
      .map((s) => s.report?.overallScore)
      .filter((s): s is number => s != null);

    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    const scoreHistory = completedSessions
      .filter((s) => s.report)
      .map((s) => ({
        date: s.completedAt ?? s.createdAt,
        score: s.report!.overallScore,
        title: s.title,
        type: s.interviewType.name,
      }))
      .reverse(); // oldest first for chart

    return NextResponse.json({
      student,
      stats: {
        totalInterviews: sessions.length,
        completedInterviews: completedSessions.length,
        averageScore,
        scoreHistory,
      },
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        difficulty: s.difficulty,
        duration: s.duration,
        completedAt: s.completedAt,
        createdAt: s.createdAt,
        interviewType: s.interviewType,
        report: s.report,
      })),
    });
  } catch (error) {
    console.error("Student analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch student data" }, { status: 500 });
  }
}
