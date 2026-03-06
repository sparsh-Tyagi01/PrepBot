"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Video, Users, Trophy, Play, Clock,
  Building2, GitBranch, Layers, CheckCircle, Check, AlertCircle,
} from "lucide-react";

interface InterviewSession {
  id: string;
  title: string;
  difficulty: string;
  duration: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  score?: number;
  interviewType: { name: string; icon: string };
  aiInterviewer: { name: string; personality: string };
}

interface UserProfile {
  institution?: { id: string; name: string; joinCode: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  section?: { id: string; name: string; code: string } | null;
}

export default function InterviewPage() {
  const router = useRouter();
  const [recentSessions, setRecentSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Institute membership state
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Branch join state
  const [branchCode, setBranchCode] = useState("");
  const [branchPreview, setBranchPreview] = useState<{ name: string } | null>(null);
  const [branchCodeError, setBranchCodeError] = useState("");
  const [branchCodeChecking, setBranchCodeChecking] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchMsg, setBranchMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const branchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Section join state
  const [sectionCode, setSectionCode] = useState("");
  const [sectionPreview, setSectionPreview] = useState<{ name: string } | null>(null);
  const [sectionCodeError, setSectionCodeError] = useState("");
  const [sectionCodeChecking, setSectionCodeChecking] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionMsg, setSectionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const sectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchRecentSessions();
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => setProfile(d.user ?? d))
      .catch(() => {});
  }, []);

  const fetchRecentSessions = async () => {
    try {
      const res = await fetch('/api/interview-session?limit=5');
      if (res.ok) {
        const data = await res.json();
        setRecentSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 8);
    setBranchCode(val);
    setBranchPreview(null);
    setBranchCodeError("");
    if (branchTimerRef.current) clearTimeout(branchTimerRef.current);
    if (val.length >= 4) {
      setBranchCodeChecking(true);
      branchTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/institution/branch/join?code=${val}`);
          const data = await res.json();
          if (res.ok && data.branch) setBranchPreview(data.branch);
          else setBranchCodeError(data.error ?? "Invalid branch code.");
        } catch {
          setBranchCodeError("Could not verify code.");
        } finally {
          setBranchCodeChecking(false);
        }
      }, 500);
    }
  };

  const handleJoinBranch = async () => {
    if (!branchPreview) return;
    setBranchLoading(true);
    setBranchMsg(null);
    try {
      const res = await fetch("/api/institution/branch/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: branchCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join branch");
      setProfile((p) => p ? { ...p, branch: data.branch, section: null } : p);
      setBranchCode("");
      setBranchPreview(null);
      setSectionCode("");
      setSectionPreview(null);
      setBranchMsg({ type: "success", text: `Joined branch: ${data.branch.name}!` });
    } catch (err: unknown) {
      setBranchMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to join branch." });
    } finally {
      setBranchLoading(false);
    }
  };

  const handleSectionCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 8);
    setSectionCode(val);
    setSectionPreview(null);
    setSectionCodeError("");
    if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
    if (val.length >= 4) {
      setSectionCodeChecking(true);
      sectionTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/institution/section/join?code=${val}`);
          const data = await res.json();
          if (res.ok && data.section) setSectionPreview(data.section);
          else setSectionCodeError(data.error ?? "Invalid section code.");
        } catch {
          setSectionCodeError("Could not verify code.");
        } finally {
          setSectionCodeChecking(false);
        }
      }, 500);
    }
  };

  const handleJoinSection = async () => {
    if (!sectionPreview) return;
    setSectionLoading(true);
    setSectionMsg(null);
    try {
      const res = await fetch("/api/institution/section/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sectionCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join section");
      setProfile((p) => p ? { ...p, section: data.section } : p);
      setSectionCode("");
      setSectionPreview(null);
      setSectionMsg({ type: "success", text: `Joined section: ${data.section.name}!` });
    } catch (err: unknown) {
      setSectionMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to join section." });
    } finally {
      setSectionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-500/20 text-green-400',
      'in-progress': 'bg-blue-500/20 text-blue-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      cancelled: 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Interview Practice</h1>
          <p className="text-slate-400">Choose your AI interviewer and start practicing</p>
        </div>
        <Button
          onClick={() => router.push('/interview/start')}
          size="lg"
          className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Play className="mr-2" size={20} />
          Start New Interview
        </Button>
      </div>

      {/* Institute Membership Card — only shown when user is in an institution */}
      {profile?.institution && (
        <Card className="border-slate-700/60 bg-slate-900/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-200">
              <Building2 size={18} className="text-blue-400" />
              Institute Membership
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Institution badge */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <Building2 size={15} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{profile.institution.name}</p>
                <p className="text-xs text-slate-400 font-mono">{profile.institution.joinCode}</p>
              </div>
              <CheckCircle size={15} className="text-emerald-400 shrink-0" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {/* Branch */}
              {profile.branch ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <GitBranch size={14} className="text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{profile.branch.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{profile.branch.code}</p>
                  </div>
                  <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                </div>
              ) : (
                <div className="space-y-2 border border-dashed border-slate-700 rounded-xl p-3">
                  <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <GitBranch size={12} className="text-cyan-400" />
                    Join a Branch
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Branch code"
                      value={branchCode}
                      onChange={handleBranchCodeChange}
                      maxLength={8}
                      className="w-full pl-3 pr-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-xs"
                    />
                  </div>
                  {branchCodeChecking && <p className="text-xs text-slate-400">Verifying…</p>}
                  {branchPreview && <p className="text-xs text-emerald-400 flex items-center gap-1"><Check size={10} /> {branchPreview.name}</p>}
                  {branchCodeError && <p className="text-xs text-red-400">{branchCodeError}</p>}
                  {branchMsg && (
                    <p className={`text-xs flex items-center gap-1 ${branchMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
                      {branchMsg.type === "success" ? <Check size={10} /> : <AlertCircle size={10} />} {branchMsg.text}
                    </p>
                  )}
                  <Button size="sm" onClick={handleJoinBranch} disabled={branchLoading || !branchPreview} className="bg-cyan-600 hover:bg-cyan-700 h-7 text-xs w-full">
                    {branchLoading ? "Joining…" : "Join Branch"}
                  </Button>
                </div>
              )}

              {/* Section */}
              {profile.branch && (
                profile.section ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Layers size={14} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{profile.section.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{profile.section.code}</p>
                    </div>
                    <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                  </div>
                ) : (
                  <div className="space-y-2 border border-dashed border-slate-700 rounded-xl p-3">
                    <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Layers size={12} className="text-purple-400" />
                      Join a Section
                      <span className="text-xs text-slate-500 font-normal">(optional)</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Section code"
                        value={sectionCode}
                        onChange={handleSectionCodeChange}
                        maxLength={8}
                        className="w-full pl-3 pr-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-xs"
                      />
                    </div>
                    {sectionCodeChecking && <p className="text-xs text-slate-400">Verifying…</p>}
                    {sectionPreview && <p className="text-xs text-emerald-400 flex items-center gap-1"><Check size={10} /> {sectionPreview.name}</p>}
                    {sectionCodeError && <p className="text-xs text-red-400">{sectionCodeError}</p>}
                    {sectionMsg && (
                      <p className={`text-xs flex items-center gap-1 ${sectionMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
                        {sectionMsg.type === "success" ? <Check size={10} /> : <AlertCircle size={10} />} {sectionMsg.text}
                      </p>
                    )}
                    <Button size="sm" onClick={handleJoinSection} disabled={sectionLoading || !sectionPreview} className="bg-purple-600 hover:bg-purple-700 h-7 text-xs w-full">
                      {sectionLoading ? "Joining…" : "Join Section"}
                    </Button>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
              <Video className="text-purple-400" size={24} />
            </div>
            <CardTitle>Real Face-to-Face Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400">
              Practice with AI interviewers that provide a realistic interview experience with video and audio.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
              <Users className="text-blue-400" size={24} />
            </div>
            <CardTitle>Multiple Interviewer Personalities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400">
              Choose from friendly, professional, strict, or casual interviewers to match your preparation needs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
              <Trophy className="text-green-400" size={24} />
            </div>
            <CardTitle>Instant Feedback & Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400">
              Get detailed reports on your performance with actionable recommendations for improvement.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Interviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Interview Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : recentSessions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No interviews yet. Click "Start New Interview" to begin!
            </p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                  onClick={() => {
                    if (session.status === 'completed') {
                      router.push(`/reports?sessionId=${session.id}`);
                    } else if (session.status === 'in-progress') {
                      router.push(`/interview/${session.id}`);
                    }
                  }}
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">{session.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>{session.interviewType.icon} {session.interviewType.name}</span>
                      <span>•</span>
                      <span>{session.aiInterviewer.name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {session.duration} min
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.score !== null && session.score !== undefined && (
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {session.score}%
                      </Badge>
                    )}
                    <Badge className={getStatusBadge(session.status)}>
                      {session.status}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {formatDate(session.completedAt || session.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
