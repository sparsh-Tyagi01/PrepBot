"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Search, Mail, Calendar, Trash2, BarChart2, X,
  TrendingUp, Award, Clock, ChevronDown, ChevronUp, BookOpen,
  GitBranch, Layers,
} from "lucide-react";

/* ─── Types ─── */
interface Student {
  id: string;
  name: string;
  email: string;
  department: string | null;
  yearOfStudy: number | null;
  branch: string | null;
  section: string | null;
  createdAt: string;
  _count: { interviewSessions: number };
}

interface ReportSummary {
  id: string;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  createdAt: string;
  skillBreakdown: Record<string, number> | null;
}

interface SessionSummary {
  id: string;
  title: string;
  status: string;
  difficulty: string;
  duration: number;
  completedAt: string | null;
  createdAt: string;
  interviewType: { name: string };
  report: ReportSummary | null;
}

interface StudentAnalytics {
  student: Omit<Student, "_count">;
  stats: {
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number | null;
    scoreHistory: { date: string; score: number; title: string; type: string }[];
  };
  sessions: SessionSummary[];
}

/* ─── helpers ─── */
const fmt = (ds: string) =>
  new Date(ds).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const scoreColor = (s: number) =>
  s >= 80 ? "text-green-400" : s >= 60 ? "text-amber-400" : "text-red-400";
const scoreBg = (s: number) =>
  s >= 80 ? "bg-green-500/15 border-green-500/30" : s >= 60 ? "bg-amber-500/15 border-amber-500/30" : "bg-red-500/15 border-red-500/30";

/* ─── Student Analytics Modal ─── */
function StudentAnalyticsModal({
  studentId,
  onClose,
}: {
  studentId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/institution/students/${studentId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [studentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 py-8">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <BarChart2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">
                {loading ? "Loading…" : data?.student.name}
              </h2>
              <p className="text-slate-400 text-xs">
                {data?.student.email}
                {data?.student.branch ? ` · ${data.student.branch}` : ""}
                {data?.student.section ? ` · Sec ${data.student.section}` : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : !data ? (
            <p className="text-slate-400 text-center py-8">Failed to load student data.</p>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: BookOpen, label: "Total", value: data.stats.totalInterviews, color: "text-blue-400" },
                  { icon: Award, label: "Completed", value: data.stats.completedInterviews, color: "text-emerald-400" },
                  { icon: TrendingUp, label: "Avg Score", value: data.stats.averageScore != null ? `${data.stats.averageScore}%` : "—", color: data.stats.averageScore != null ? scoreColor(data.stats.averageScore) : "text-slate-400" },
                  { icon: Clock, label: "Joined", value: fmt(data.student.createdAt), color: "text-slate-300" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
                    <Icon size={16} className={`mx-auto mb-1 ${color}`} />
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Score history */}
              {data.stats.scoreHistory.length > 0 && (
                <div>
                  <h3 className="text-slate-200 font-semibold text-sm mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full" />
                    Score History
                  </h3>
                  <div className="flex items-end gap-2 h-16 overflow-x-auto pb-1">
                    {data.stats.scoreHistory.map((h, i) => {
                      const pct = h.score;
                      const barH = Math.max(8, (pct / 100) * 56);
                      const bc = h.score >= 80 ? "bg-green-500" : h.score >= 60 ? "bg-amber-500" : "bg-red-500";
                      return (
                        <div key={i} title={`${h.title}: ${h.score}%`} className="flex flex-col items-center gap-1 shrink-0">
                          <span className={`text-[10px] font-bold ${scoreColor(h.score)}`}>{h.score}%</span>
                          <div className={`w-6 rounded-t ${bc}`} style={{ height: barH }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Interview sessions */}
              <div>
                <h3 className="text-slate-200 font-semibold text-sm mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-cyan-500 rounded-full" />
                  Interview Sessions ({data.sessions.length})
                </h3>
                {data.sessions.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No interviews yet.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {data.sessions.map((sess) => {
                      const isOpen = expandedSession === sess.id;
                      return (
                        <div key={sess.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/60 transition-colors"
                            onClick={() => setExpandedSession(isOpen ? null : sess.id)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex flex-col items-start min-w-0">
                                <span className="text-white text-sm font-medium truncate">{sess.title}</span>
                                <span className="text-slate-400 text-xs">{sess.interviewType.name} · {sess.difficulty} · {sess.duration}min</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                              {sess.report ? (
                                <span className={`text-sm font-bold border rounded-full px-2 py-0.5 ${scoreBg(sess.report.overallScore)} ${scoreColor(sess.report.overallScore)}`}>
                                  {sess.report.overallScore}%
                                </span>
                              ) : (
                                <Badge variant="outline" className={`text-xs ${sess.status === "completed" ? "border-slate-600 text-slate-400" : "border-amber-500/30 text-amber-400"}`}>
                                  {sess.status}
                                </Badge>
                              )}
                              {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                            </div>
                          </button>

                          {isOpen && sess.report && (
                            <div className="px-4 pb-4 space-y-3 border-t border-slate-700/40 pt-3">
                              <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                                {(sess.report as { detailedAnalysis?: string }).detailedAnalysis || "No analysis available."}
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-green-400 text-xs font-semibold mb-1">✓ Strengths</p>
                                  {sess.report.strengths.slice(0, 2).map((s, i) => (
                                    <p key={i} className="text-xs text-slate-300">• {s}</p>
                                  ))}
                                </div>
                                <div>
                                  <p className="text-red-400 text-xs font-semibold mb-1">⚠ Weaknesses</p>
                                  {sess.report.weaknesses.slice(0, 2).map((w, i) => (
                                    <p key={i} className="text-xs text-slate-300">• {w}</p>
                                  ))}
                                </div>
                              </div>
                              {sess.report.skillBreakdown && Object.keys(sess.report.skillBreakdown).length > 0 && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                  {Object.entries(sess.report.skillBreakdown).slice(0, 6).map(([skill, score]) => {
                                    const pct = (score as number) * 10;
                                    const bc = (score as number) >= 8 ? "bg-green-500" : (score as number) >= 6 ? "bg-amber-500" : "bg-red-500";
                                    return (
                                      <div key={skill}>
                                        <div className="flex justify-between mb-0.5">
                                          <span className="text-slate-400 text-[10px] capitalize">{skill.replace(/_/g, " ")}</span>
                                          <span className="text-slate-300 text-[10px] font-bold">{score}/10</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                          <div className={`h-full ${bc} rounded-full`} style={{ width: `${pct}%` }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function InstitutionStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [analyticsStudentId, setAnalyticsStudentId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/institution/students")
      .then((r) => r.json())
      .then((d) => { setStudents(d.students ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.branch ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.section ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleRemove = async (studentId: string, name: string) => {
    if (!confirm(`Remove ${name} from your institution? They will lose access to institution resources.`)) return;
    setRemovingId(studentId);
    try {
      const res = await fetch("/api/institution/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
      } else {
        const d = await res.json();
        alert(d.error ?? "Failed to remove student.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Students</h1>
          <p className="text-slate-400 mt-1">
            {loading ? "Loading…" : `${students.length} enrolled · ${filtered.length} shown`}
          </p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <Input
            placeholder="Search name, email, branch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1fr_80px_130px] gap-3 px-5 py-3 border-b border-slate-700/50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Student</span>
          <span>Branch / Section</span>
          <span>Joined</span>
          <span>Interviews</span>
          <span></span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-px">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-none" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">{search ? "No students match your search." : "No students enrolled yet."}</p>
            <p className="text-sm mt-1 text-slate-600">Share your institution code so students can join from their Settings page.</p>
          </div>
        ) : (
          <div>
            {filtered.map((student, idx) => (
              <div
                key={student.id}
                className={`flex flex-col sm:grid sm:grid-cols-[2fr_1.5fr_1fr_1fr_80px_130px] sm:items-center gap-3 px-5 py-4 ${idx < filtered.length - 1 ? "border-b border-slate-700/30" : ""} hover:bg-slate-800/30 transition-colors`}
              >
                {/* Name + email */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{student.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                      <Mail size={10} />{student.email}
                    </p>
                  </div>
                </div>

                {/* Branch / Section */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {student.branch ? (
                    <span className="flex items-center gap-1 text-xs text-slate-300 bg-slate-700/50 border border-slate-600/40 rounded-full px-2 py-0.5">
                      <GitBranch size={10} />{student.branch}
                    </span>
                  ) : null}
                  {student.section ? (
                    <span className="flex items-center gap-1 text-xs text-slate-300 bg-slate-700/50 border border-slate-600/40 rounded-full px-2 py-0.5">
                      <Layers size={10} />Sec {student.section}
                    </span>
                  ) : null}
                  {!student.branch && !student.section && (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </div>

                {/* Joined */}
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar size={11} />
                  {fmt(student.createdAt)}
                </div>

                {/* Interview count */}
                <div className="text-sm font-semibold text-white">
                  {student._count.interviewSessions}
                  <span className="text-xs font-normal text-slate-500 ml-1">sessions</span>
                </div>

                {/* Department badge */}
                <div className="hidden sm:block">
                  {student.department && (
                    <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs whitespace-nowrap">
                      {student.department}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:text-white gap-1.5 h-8 text-xs"
                    onClick={() => setAnalyticsStudentId(student.id)}
                  >
                    <BarChart2 size={13} /> Analysis
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                    onClick={() => handleRemove(student.id, student.name)}
                    disabled={removingId === student.id}
                    title="Remove student"
                  >
                    {removingId === student.id ? "…" : <Trash2 size={13} />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics modal */}
      {analyticsStudentId && (
        <StudentAnalyticsModal
          studentId={analyticsStudentId}
          onClose={() => setAnalyticsStudentId(null)}
        />
      )}
    </div>
  );
}
