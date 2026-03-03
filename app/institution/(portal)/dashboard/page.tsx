"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, PlayCircle, BarChart3, BookOpen, ArrowRight,
  TrendingUp, Star, Clock, Plus, Copy, CheckCircle,
} from "lucide-react";

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

interface DashboardData {
  institution: { id: string; name: string; type: string; joinCode?: string };
  stats: Stats;
  recentSessions: Session[];
}

export default function InstitutionDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);

  const copyJoinCode = () => {
    if (data?.institution?.joinCode) {
      navigator.clipboard.writeText(data.institution.joinCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  useEffect(() => {
    fetch("/api/institution/stats")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: "Total Students",
      value: data?.stats.totalStudents ?? 0,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Interviews",
      value: data?.stats.totalInterviews ?? 0,
      icon: PlayCircle,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      title: "Average Score",
      value: `${data?.stats.averageScore ?? 0}%`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Custom Interview Types",
      value: data?.stats.customInterviewTypes ?? 0,
      icon: BookOpen,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {loading ? (
            <Skeleton className="h-8 w-64 mb-2" />
          ) : (
            <h1 className="text-3xl font-bold text-white">
              {data?.institution.name ?? "Institution"}
            </h1>
          )}
          <p className="text-slate-400 mt-1">Welcome to your institution dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/institution/interviews">
            <Button className="bg-blue-600 hover:bg-blue-500 gap-2">
              <Plus size={16} />
              New Interview Type
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats + Join Code */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{card.title}</p>
                      {loading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                      ) : (
                        <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                      <Icon size={22} className={card.color} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Join Code Highlight */}
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Student Join Code</p>
                <p className="text-xs text-slate-500 mb-3">Share this code with students so they can link their accounts to your institution.</p>
                {loading ? (
                  <Skeleton className="h-10 w-40" />
                ) : (
                  <div className="text-4xl font-mono font-bold tracking-[0.3em] text-blue-300">
                    {data?.institution?.joinCode ?? "------"}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={copyJoinCode}
                disabled={loading || !data?.institution?.joinCode}
                className="shrink-0"
              >
                {codeCopied ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
                {codeCopied ? "Copied!" : "Copy Code"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="border-slate-800 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Interview Sessions</CardTitle>
            <Link href="/institution/students">
              <Button variant="ghost" size="sm" className="text-slate-400 gap-1">
                View All <ArrowRight size={14} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.recentSessions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <PlayCircle size={40} className="mx-auto mb-3 opacity-30" />
                <p>No interview sessions yet.</p>
                <p className="text-sm mt-1">Students will appear here once they start interviews.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.recentSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-white">{s.studentName}</p>
                      <p className="text-xs text-slate-400">{s.interviewType} · {s.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.score !== null && (
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star size={12} />
                          <span className="text-sm font-medium">{Math.round(s.score)}%</span>
                        </div>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          s.status === "completed"
                            ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                            : s.status === "in-progress"
                            ? "border-blue-500/50 text-blue-400 bg-blue-500/10"
                            : "border-slate-600 text-slate-400"
                        }
                      >
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card className="border-slate-800">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/institution/interviews">
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <PlayCircle size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Manage Interviews</p>
                    <p className="text-xs text-slate-400">Create custom types</p>
                  </div>
                  <ArrowRight size={14} className="ml-auto text-slate-600 group-hover:text-slate-400" />
                </div>
              </Link>
              <Link href="/institution/question-banks">
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <BookOpen size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Question Banks</p>
                    <p className="text-xs text-slate-400">Add custom questions</p>
                  </div>
                  <ArrowRight size={14} className="ml-auto text-slate-600 group-hover:text-slate-400" />
                </div>
              </Link>
              <Link href="/institution/students">
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Users size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Students</p>
                    <p className="text-xs text-slate-400">View enrolled students</p>
                  </div>
                  <ArrowRight size={14} className="ml-auto text-slate-600 group-hover:text-slate-400" />
                </div>
              </Link>
              <Link href="/institution/analytics">
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <BarChart3 size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Analytics</p>
                    <p className="text-xs text-slate-400">Performance reports</p>
                  </div>
                  <ArrowRight size={14} className="ml-auto text-slate-600 group-hover:text-slate-400" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
