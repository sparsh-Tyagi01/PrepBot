"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Users, PlayCircle, Star } from "lucide-react";

interface Stats {
  totalStudents: number;
  totalInterviews: number;
  averageScore: number;
  customInterviewTypes: number;
}

interface Session {
  id: string;
  title: string;
  studentName: string;
  interviewType: string;
  score: number | null;
  status: string;
  date: string;
}

export default function InstitutionAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/institution/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setSessions(d.recentSessions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const completedSessions = sessions.filter((s) => s.status === "completed" && s.score !== null);
  const scoreDistribution = {
    excellent: completedSessions.filter((s) => (s.score ?? 0) >= 80).length,
    good: completedSessions.filter((s) => (s.score ?? 0) >= 60 && (s.score ?? 0) < 80).length,
    needs_work: completedSessions.filter((s) => (s.score ?? 0) < 60).length,
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 mt-1">Performance overview for your institution</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: stats?.totalStudents ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Total Interviews", value: stats?.totalInterviews ?? 0, icon: PlayCircle, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Average Score", value: `${stats?.averageScore ?? 0}%`, icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Interview Types", value: stats?.customInterviewTypes ?? 0, icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label} className="border-slate-800">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={m.color} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{m.label}</p>
                    {loading ? (
                      <Skeleton className="h-6 w-12 mt-0.5" />
                    ) : (
                      <p className="text-xl font-bold text-white">{m.value}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp size={16} className="text-emerald-400" />
              Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}
              </div>
            ) : completedSessions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No completed interviews yet.</p>
            ) : (
              <>
                {[
                  { label: "Excellent (≥80%)", count: scoreDistribution.excellent, color: "bg-emerald-500", text: "text-emerald-400" },
                  { label: "Good (60-79%)", count: scoreDistribution.good, color: "bg-blue-500", text: "text-blue-400" },
                  { label: "Needs Work (<60%)", count: scoreDistribution.needs_work, color: "bg-amber-500", text: "text-amber-400" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">{item.label}</span>
                      <span className={item.text}>{item.count}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-700`}
                        style={{
                          width: completedSessions.length > 0
                            ? `${(item.count / completedSessions.length) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="text-sm text-white">{s.studentName}</p>
                      <p className="text-xs text-slate-400">{s.interviewType}</p>
                    </div>
                    {s.score !== null && (
                      <div className={`text-sm font-semibold ${
                        s.score >= 80 ? "text-emerald-400" : s.score >= 60 ? "text-blue-400" : "text-amber-400"
                      }`}>
                        {Math.round(s.score)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
