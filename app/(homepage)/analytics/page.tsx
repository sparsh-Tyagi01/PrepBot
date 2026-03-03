"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, Award, MessageSquare, Code2, Clock,
  ArrowUp, BarChart3, Calendar,
} from "lucide-react";

interface AnalyticsData {
  analytics: {
    totalInterviews: number;
    averageScore: number;
    totalHours: number;
  };
  skillAverages: {
    communication: number;
    technical_knowledge: number;
    problem_solving: number;
    clarity: number;
    confidence: number;
  };
  interviewHistory: {
    id: string;
    sessionId: string;
    date: string;
    type: string;
    score: number;
    duration: number;
    questionsAsked: number;
    status: string;
  }[];
  readinessScore: number;
  totalReports: number;
}

const SKILL_DISPLAY: Record<string, string> = {
  communication: "Communication",
  technical_knowledge: "Technical Knowledge",
  problem_solving: "Problem Solving",
  clarity: "Clarity",
  confidence: "Confidence",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(mins: number): string {
  if (!mins) return "—";
  return `${mins} min`;
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Very Good";
  if (score >= 60) return "Good";
  return "Needs Work";
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const readiness = Math.round(data?.readinessScore ?? 0);
  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference * (1 - readiness / 100);

  const skillEntries = Object.entries(data?.skillAverages ?? {}).map(([key, val]) => ({
    key,
    label: SKILL_DISPLAY[key] ?? key,
    score: Math.round(val),
  }));

  const commScore = Math.round(data?.skillAverages?.communication ?? 0);
  const techScore = Math.round(data?.skillAverages?.technical_knowledge ?? 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Performance Analytics</h1>
        <p className="text-slate-400 text-lg">
          Track your progress and identify areas for improvement
        </p>
      </div>

      {/* Readiness Score */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-violet-600/10 to-cyan-500/10" />
        <CardHeader className="relative">
          <CardTitle className="text-2xl">Overall Readiness Score</CardTitle>
          <CardDescription>Your interview preparation level</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-center">
            {loading ? (
              <div className="flex items-center justify-center w-64 h-64">
                <Skeleton className="w-52 h-52 rounded-full" />
              </div>
            ) : (
              <div className="relative w-64 h-64">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="16" fill="none" className="text-slate-800" />
                  <circle
                    cx="128" cy="128" r="110"
                    stroke="url(#gradient)" strokeWidth="16" fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-6xl font-bold bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    {readiness}%
                  </div>
                  <div className="text-slate-400 mt-2">Readiness Score</div>
                  {readiness > 0 && (
                    <Badge variant="success" className="mt-3">
                      <TrendingUp size={14} className="mr-1" />
                      {scoreLabel(readiness)}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skill Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="text-purple-400" size={24} />
                Skill-wise Performance
              </CardTitle>
              <CardDescription>Averaged across all completed interviews</CardDescription>
            </div>
            <Badge variant="default">{data?.totalReports ?? 0} reports</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))
          ) : skillEntries.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">
              Complete interviews to see skill performance data.
            </p>
          ) : (
            skillEntries.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-300 font-medium">{item.label}</span>
                  </div>
                  <span className="text-xl font-bold text-white">{item.score}%</span>
                </div>
                <Progress value={item.score} className="flex-1" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Communication & Technical split */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="text-blue-400" size={24} />
              Communication Score
            </CardTitle>
            <CardDescription>Clarity, confidence, and articulation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-28 mx-auto" />
                <Skeleton className="h-6 w-20 mx-auto" />
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-400 mb-2">{commScore}%</div>
                  <Badge variant={commScore >= 75 ? "success" : "secondary"}>
                    {scoreLabel(commScore)}
                  </Badge>
                </div>
                <div className="space-y-3 pt-4">
                  {[
                    { label: "Clarity", score: Math.round(data?.skillAverages?.clarity ?? 0) },
                    { label: "Confidence", score: Math.round(data?.skillAverages?.confidence ?? 0) },
                    { label: "Communication", score: commScore },
                  ].map((metric, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{metric.label}</span>
                        <span className="text-white font-medium">{metric.score}%</span>
                      </div>
                      <Progress value={metric.score} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="text-cyan-400" size={24} />
              Technical Score
            </CardTitle>
            <CardDescription>Technical knowledge and problem solving</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-28 mx-auto" />
                <Skeleton className="h-6 w-20 mx-auto" />
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-5xl font-bold text-cyan-400 mb-2">{techScore}%</div>
                  <Badge variant={techScore >= 75 ? "success" : "secondary"}>
                    {scoreLabel(techScore)}
                  </Badge>
                </div>
                <div className="space-y-3 pt-4">
                  {[
                    { label: "Technical Knowledge", score: techScore },
                    { label: "Problem Solving", score: Math.round(data?.skillAverages?.problem_solving ?? 0) },
                  ].map((metric, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{metric.label}</span>
                        <span className="text-white font-medium">{metric.score}%</span>
                      </div>
                      <Progress value={metric.score} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interview History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Calendar className="text-purple-400" size={24} />
            Interview History
          </CardTitle>
          <CardDescription>Detailed log of all your practice sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : !data?.interviewHistory?.length ? (
            <p className="text-slate-400 text-sm text-center py-8">
              No interviews completed yet. Start practicing to see your history here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Date</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Type</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Score</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Duration</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Questions</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.interviewHistory.map((interview, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 text-slate-300">{formatDate(interview.date)}</td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary">{interview.type}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Award size={16} className="text-amber-400" />
                          <span className="text-white font-semibold">
                            {interview.score > 0 ? `${Math.round(interview.score)}%` : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDuration(interview.duration)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{interview.questionsAsked || "—"}</td>
                      <td className="py-4 px-4">
                        <Badge variant={interview.status === "completed" ? "success" : "secondary"}>
                          {interview.status === "completed" ? "Completed" : interview.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
