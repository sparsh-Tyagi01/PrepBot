"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, Clock, Award, Target, PlayCircle,
  ArrowRight, Code2, MessageSquare, Briefcase, Network,
  CheckCircle2, Calendar, Zap,
} from "lucide-react";
import Link from "next/link";

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
  recentSessions: {
    id: string;
    type: string;
    title: string;
    score: number;
    date: string;
  }[];
  readinessScore: number;
}

const SKILL_DISPLAY: Record<string, string> = {
  communication: "Communication",
  technical_knowledge: "Technical Knowledge",
  problem_solving: "Problem Solving",
  clarity: "Clarity",
  confidence: "Confidence",
};

const INTERVIEW_TYPES = [
  { title: "Technical", icon: Code2, color: "purple", duration: "45-60 min" },
  { title: "Behavioral", icon: MessageSquare, color: "blue", duration: "30-45 min" },
  { title: "HR", icon: Briefcase, color: "cyan", duration: "20-30 min" },
  { title: "System Design", icon: Network, color: "teal", duration: "60-90 min" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: "Total Interviews",
      value: loading ? null : (data?.analytics.totalInterviews ?? 0).toString(),
      icon: Award,
      color: "from-purple-600 to-blue-600",
    },
    {
      title: "Average Score",
      value: loading ? null : `${Math.round(data?.analytics.averageScore ?? 0)}%`,
      icon: TrendingUp,
      color: "from-blue-600 to-cyan-600",
    },
    {
      title: "Hours Practiced",
      value: loading ? null : `${(data?.analytics.totalHours ?? 0).toFixed(1)}h`,
      icon: Clock,
      color: "from-cyan-600 to-teal-600",
    },
    {
      title: "Readiness Score",
      value: loading ? null : `${Math.round(data?.readinessScore ?? 0)}%`,
      icon: Target,
      color: "from-teal-600 to-emerald-600",
    },
  ];

  const skillEntries = Object.entries(data?.skillAverages ?? {}).map(([key, val]) => ({
    skill: SKILL_DISPLAY[key] ?? key,
    progress: Math.round(val),
  }));

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {firstName}!
          </span>
        </h1>
        <p className="text-slate-400 text-lg">
          Ready to practice today? Let&apos;s continue your interview preparation journey.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="group hover:scale-[1.02] cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="text-white" size={24} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-400">{stat.title}</p>
                {stat.value === null ? (
                  <Skeleton className="h-9 w-24" />
                ) : (
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Start Interview Section */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-cyan-600/10" />
          <CardHeader className="relative">
            <CardTitle className="text-2xl flex items-center gap-2">
              <PlayCircle className="text-purple-400" size={28} />
              Start New Interview
            </CardTitle>
            <CardDescription>
              Choose an interview type and begin your practice session
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {INTERVIEW_TYPES.map((type, i) => (
                <Link key={i} href="/interview" className="block">
                  <div className="p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all duration-200 group cursor-pointer">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${type.color}-600 to-${type.color}-500 flex items-center justify-center mb-2`}>
                      <type.icon className="text-white" size={20} />
                    </div>
                    <div className="text-sm font-medium text-white mb-1">{type.title}</div>
                    <div className="text-xs text-slate-400">{type.duration}</div>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/interview">
              <Button variant="primary" size="lg" className="w-full">
                Start Interview <ArrowRight size={18} />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Skill Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="text-amber-400" size={24} />
              Skill Breakdown
            </CardTitle>
            <CardDescription>Based on your completed interviews</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))
            ) : skillEntries.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">
                Complete an interview to see your skill breakdown.
              </p>
            ) : (
              skillEntries.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 font-medium">{item.skill}</span>
                    <span className="text-slate-400">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Interviews */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Recent Interviews</CardTitle>
              <CardDescription>Your latest practice sessions</CardDescription>
            </div>
            <Link href="/reports">
              <Button variant="ghost" size="sm">
                View All <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : !data?.recentSessions?.length ? (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle2 className="mx-auto mb-3 opacity-30" size={40} />
              <p>No interviews yet. Start your first session!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentSessions.map((interview, i) => (
                <Link key={i} href={`/reports?sessionId=${interview.id}`}>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                        <CheckCircle2 className="text-white" size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{interview.type}</span>
                          {interview.title && (
                            <Badge variant="secondary" className="text-xs">
                              {interview.title}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {timeAgo(interview.date)}
                          </span>
                          {interview.score > 0 && (
                            <span className="flex items-center gap-1">
                              <Award size={14} />
                              Score: {Math.round(interview.score)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="text-slate-600 group-hover:text-purple-400 transition-colors" size={20} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Quick Tip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300">
            Practice makes perfect! Try to complete at least one mock interview per day to build confidence and improve your skills consistently.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
