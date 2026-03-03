import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Get or create analytics record
    let analytics = await prisma.analytics.findUnique({ where: { userId } });
    if (!analytics) {
      analytics = await prisma.analytics.create({ data: { userId } });
    }

    // All completed sessions with type info
    const completedSessions = await prisma.interviewSession.findMany({
      where: { userId, status: "completed" },
      include: { interviewType: true },
      orderBy: { completedAt: "desc" },
    });

    // Total hours practiced
    let totalMinutes = 0;
    for (const s of completedSessions) totalMinutes += (s.duration ?? 0);
    const totalHours = parseFloat((totalMinutes / 60).toFixed(1));

    // All reports with session details
    const reports = await prisma.report.findMany({
      where: { userId },
      include: {
        interviewSession: {
          include: { interviewType: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute average skill breakdown across all reports
    const SKILL_KEYS = [
      "communication",
      "technical_knowledge",
      "problem_solving",
      "clarity",
      "confidence",
    ] as const;
    const skillSums: Record<string, number> = {};
    const skillCounts: Record<string, number> = {};
    for (const report of reports) {
      const bd = report.skillBreakdown as Record<string, number> | null;
      if (!bd) continue;
      for (const key of SKILL_KEYS) {
        if (bd[key] != null) {
          skillSums[key] = (skillSums[key] ?? 0) + bd[key];
          skillCounts[key] = (skillCounts[key] ?? 0) + 1;
        }
      }
    }
    const skillAverages: Record<string, number> = {};
    for (const key of SKILL_KEYS) {
      skillAverages[key] = skillCounts[key]
        ? Math.round((skillSums[key] / skillCounts[key]) * 10)
        : 0;
    }

    // Per-type average scores from sessions
    const typeScores: Record<string, { sum: number; count: number }> = {};
    for (const s of completedSessions) {
      if (s.score == null) continue;
      const name = s.interviewType.name;
      if (!typeScores[name]) typeScores[name] = { sum: 0, count: 0 };
      typeScores[name].sum += s.score;
      typeScores[name].count += 1;
    }
    const typeAverages: Record<string, number> = {};
    for (const [name, { sum, count }] of Object.entries(typeScores)) {
      typeAverages[name] = Math.round(sum / count);
    }

    // Interview history (for analytics table)
    const interviewHistory = reports.slice(0, 30).map((r: typeof reports[number]) => ({
      id: r.id,
      sessionId: r.interviewSessionId,
      date: r.createdAt,
      type: r.interviewSession.interviewType.name,
      score: Math.round(r.overallScore),
      duration: r.interviewSession.duration,
      questionsAsked: Array.isArray(r.interviewSession.questionsAsked)
        ? (r.interviewSession.questionsAsked as unknown[]).length
        : 0,
      status: "completed" as const,
    }));

    // Recent sessions (for dashboard)
    const recentSessions = completedSessions.slice(0, 5).map((s: typeof completedSessions[number]) => ({
      id: s.id,
      type: s.interviewType.name,
      title: s.title,
      score: s.score != null ? Math.round(s.score) : null,
      date: s.completedAt ?? s.updatedAt,
    }));

    // Readiness / overall score
    let reportsScoreSum = 0;
    for (const r of reports) reportsScoreSum += (r.overallScore as number);
    const readinessScore = reports.length > 0 ? Math.round(reportsScoreSum / reports.length) : 0;

    return NextResponse.json({
      analytics: { ...analytics, totalHours },
      skillAverages,
      typeAverages,
      interviewHistory,
      recentSessions,
      readinessScore,
      totalReports: reports.length,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
