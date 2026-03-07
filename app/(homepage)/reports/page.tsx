"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText, Calendar, Award, Clock,
  Download, Search, TrendingUp, Code2, MessageSquare,
  Briefcase, Network, X, Loader2,
} from "lucide-react";

interface Report {
  id: string;
  interviewSessionId: string;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailedAnalysis: string;
  skillBreakdown: Record<string, number>;
  createdAt: string;
  interviewSession: {
    title: string;
    difficulty: string;
    duration: number;
    interviewType: { name: string; icon: string };
    completedAt: string;
  };
}

const getIconForType = (n: string) => {
  if (n.toLowerCase().includes('technical')) return Code2;
  if (n.toLowerCase().includes('behavioral')) return MessageSquare;
  if (n.toLowerCase().includes('system')) return Network;
  if (n.toLowerCase().includes('hr')) return Briefcase;
  return FileText;
};

const getGradient = (n: string) => {
  if (n.toLowerCase().includes('technical')) return 'from-violet-600 to-blue-600';
  if (n.toLowerCase().includes('behavioral')) return 'from-cyan-600 to-blue-600';
  if (n.toLowerCase().includes('system')) return 'from-purple-600 to-indigo-600';
  if (n.toLowerCase().includes('hr')) return 'from-teal-600 to-cyan-600';
  return 'from-slate-600 to-slate-500';
};

const scoreColor = (s: number) =>
  s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber-400' : 'text-red-400';
const scoreBg = (s: number) =>
  s >= 80 ? 'bg-green-500/15 border-green-500/30' : s >= 60 ? 'bg-amber-500/15 border-amber-500/30' : 'bg-red-500/15 border-red-500/30';
const diffBadge = (d: string) => {
  if (d === 'easy') return 'bg-green-500/20 text-green-300 border-green-500/30';
  if (d === 'hard') return 'bg-red-500/20 text-red-300 border-red-500/30';
  return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
};

const fmt = (ds: string) =>
  new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/* ─── PDF generator (jsPDF) ─── */
type RGB = [number, number, number];

async function generatePDF(reports: Report[], filename: string) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pW = pdf.internal.pageSize.getWidth();
  const pH = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const cW = pW - margin * 2;
  let y = margin;

  const newPage = () => { pdf.addPage(); y = margin; };
  const guard = (h: number) => { if (y + h > pH - margin) newPage(); };

  const WHITE: RGB   = [255, 255, 255];
  const SLATE8: RGB  = [30, 41, 59];
  const SLATE7: RGB  = [51, 65, 85];
  const SLATE4: RGB  = [148, 163, 184];  // used only on dark header band
  const DARK: RGB    = [15, 23, 42];     // high-contrast body text
  const BODY: RGB    = [51, 65, 85];     // secondary body text
  const GREEN: RGB   = [34, 197, 94];
  const AMBER: RGB   = [245, 158, 11];
  const RED: RGB     = [239, 68, 68];
  const VIOLET: RGB  = [139, 92, 246];
  const CYAN: RGB    = [6, 182, 212];
  // Dark variants for use on white PDF background
  const DGREEN: RGB  = [21, 128, 61];
  const DRED: RGB    = [185, 28, 28];
  const DAMBER: RGB  = [161, 98, 7];
  const DBLUE: RGB   = [29, 78, 216];
  const DHEAD: RGB   = [15, 23, 42];     // section heading text

  const sc = (s: number): RGB => s >= 80 ? GREEN : s >= 60 ? AMBER : RED;

  for (let ri = 0; ri < reports.length; ri++) {
    if (ri > 0) newPage();
    const report = reports[ri];
    if (!report.interviewSession) continue;
    const sess = report.interviewSession;

    // ── Header band ──
    pdf.setFillColor(...SLATE8);
    pdf.rect(0, 0, pW, 40, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(...WHITE);
    const titleLines = pdf.splitTextToSize(sess.title || 'Interview Report', cW - 28);
    pdf.text(titleLines, margin, y + 8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...SLATE4);
    const sub = `${sess.interviewType?.name || ''} · ${sess.difficulty || 'medium'} · ${sess.duration || 0} min · ${fmt(sess.completedAt || report.createdAt)}`;
    pdf.text(sub, margin, y + 17);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(...sc(report.overallScore));
    pdf.text(`${report.overallScore}%`, pW - margin, y + 11, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...SLATE4);
    pdf.text('Overall Score', pW - margin, y + 18, { align: 'right' });

    y += 48;

    // ── Detailed Analysis ──
    guard(14);
    pdf.setFillColor(...VIOLET);
    pdf.rect(margin, y - 1, 2.5, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...DHEAD);
    pdf.text('Detailed Analysis', margin + 5, y + 4);
    y += 9;

    const anaLines = pdf.splitTextToSize(report.detailedAnalysis || '', cW);
    for (const line of anaLines) {
      guard(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...BODY);
      pdf.text(line, margin, y);
      y += 5;
    }
    y += 5;

    // ── Strengths & Weaknesses ──
    const half = (cW - 6) / 2;
    guard(8);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
    pdf.setTextColor(...DGREEN);  pdf.text('Strengths',        margin,            y);
    pdf.setTextColor(...DRED);    pdf.text('Areas to Improve', margin + half + 6, y);
    y += 5;

    const maxSW = Math.max(report.strengths?.length || 0, report.weaknesses?.length || 0);
    for (let i = 0; i < maxSW; i++) {
      const sl = report.strengths?.[i] ? pdf.splitTextToSize(`• ${report.strengths[i]}`, half) : [];
      const wl = report.weaknesses?.[i] ? pdf.splitTextToSize(`• ${report.weaknesses[i]}`, half) : [];
      const rH = Math.max(sl.length, wl.length) * 4.5 + 1;
      guard(rH);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
      if (sl.length) { pdf.setTextColor(...DGREEN); pdf.text(sl, margin, y); }
      if (wl.length) { pdf.setTextColor(...DRED); pdf.text(wl, margin + half + 6, y); }
      y += rH;
    }
    y += 5;

    // ── Recommendations ──
    if (report.recommendations?.length) {
      guard(14);
      pdf.setFillColor(37, 99, 235);
      pdf.rect(margin, y - 1, 2.5, 6, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
      pdf.setTextColor(...DHEAD);
      pdf.text('Recommendations', margin + 5, y + 4);
      y += 9;
      for (let i = 0; i < report.recommendations.length; i++) {
        const rl = pdf.splitTextToSize(`${i + 1}. ${report.recommendations[i]}`, cW);
        const rH = rl.length * 4.5;
        guard(rH + 2);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
        pdf.setTextColor(...DBLUE);
        pdf.text(rl, margin, y);
        y += rH + 1.5;
      }
      y += 4;
    }

    // ── Skill Breakdown ──
    const skills = Object.entries(report.skillBreakdown || {});
    if (skills.length) {
      guard(14);
      pdf.setFillColor(...CYAN);
      pdf.rect(margin, y - 1, 2.5, 6, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
      pdf.setTextColor(...DHEAD);
      pdf.text('Skill Breakdown', margin + 5, y + 4);
      y += 9;

      const labelW = cW * 0.32;
      const barW   = cW * 0.52;
      const barH   = 3;

      for (const [skill, score] of skills) {
        guard(9);
        const pct = Math.min((score as number) / 10, 1);
        const bc: RGB = (score as number) >= 8 ? DGREEN : (score as number) >= 6 ? DAMBER : DRED;

        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
        pdf.setTextColor(...DARK);
        pdf.text(skill.replace(/_/g, ' '), margin, y + 2.5);

        pdf.setFillColor(...SLATE7);
        pdf.roundedRect(margin + labelW, y, barW, barH, 1, 1, 'F');
        if (pct > 0) { pdf.setFillColor(...bc); pdf.roundedRect(margin + labelW, y, barW * pct, barH, 1, 1, 'F'); }

        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
        pdf.setTextColor(...bc);
        pdf.text(`${score}/10`, pW - margin, y + 2.5, { align: 'right' });
        y += 7;
      }
    }
  }

  pdf.save(filename);
}

function exportSinglePDF(report: Report) {
  const name = (report.interviewSession?.title || 'Report').replace(/[^a-z0-9]/gi, '_');
  generatePDF([report], `${name}.pdf`);
}

function exportAllPDF(reports: Report[]) {
  generatePDF(reports, 'Interview_Reports.pdf');
}

/* ─── Detail modal ─── */
function ReportModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const session = report.interviewSession;
  const Icon = getIconForType(session?.interviewType?.name || '');

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 py-8">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${getGradient(session?.interviewType?.name || '')} flex items-center justify-center`}>
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">{session?.title || 'Interview Report'}</h2>
              <p className="text-slate-400 text-xs">{fmt(session?.completedAt || report.createdAt)} · {session?.duration || 0} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:text-white gap-1.5 h-8 text-xs"
              onClick={() => exportSinglePDF(report)}
            >
              <Download size={13} /> Export PDF
            </Button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Score row */}
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-black ${scoreColor(report.overallScore)}`}>{report.overallScore}%</div>
            <div className="h-12 w-px bg-slate-700" />
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className={diffBadge(session?.difficulty || 'medium')}>
                {(session?.difficulty || 'medium').charAt(0).toUpperCase() + (session?.difficulty || 'medium').slice(1)}
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                {session?.interviewType?.name}
              </Badge>
            </div>
          </div>

          {/* Analysis */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
              <span className="w-1 h-4 bg-violet-500 rounded-full inline-block" />
              Detailed Analysis
            </h3>
            <p className="text-slate-300 leading-relaxed text-sm">{report.detailedAnalysis}</p>
          </div>

          {/* Strengths + Weaknesses */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
              <h4 className="text-green-400 font-semibold text-sm mb-3 flex items-center gap-1.5">
                <TrendingUp size={14} /> Strengths
              </h4>
              <ul className="space-y-2">
                {(report.strengths || []).map((s, i) => (
                  <li key={i} className="text-slate-200 text-sm flex items-start gap-2">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <h4 className="text-red-400 font-semibold text-sm mb-3 flex items-center gap-1.5">
                <Award size={14} /> Areas to Improve
              </h4>
              <ul className="space-y-2">
                {(report.weaknesses || []).map((w, i) => (
                  <li key={i} className="text-slate-200 text-sm flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 shrink-0">•</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <h4 className="text-blue-400 font-semibold text-sm mb-3">💡 Recommendations</h4>
            <ul className="space-y-2">
              {(report.recommendations || []).map((r, i) => (
                <li key={i} className="text-slate-200 text-sm flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 shrink-0">{i + 1}.</span>{r}
                </li>
              ))}
            </ul>
          </div>

          {/* Skill breakdown */}
          {Object.keys(report.skillBreakdown || {}).length > 0 && (
            <div>
              <h3 className="text-slate-200 font-semibold mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <span className="w-1 h-4 bg-cyan-500 rounded-full inline-block" />
                Skill Breakdown
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(report.skillBreakdown).map(([skill, score]) => {
                  const pct = (score as number) * 10;
                  const barColor = (score as number) >= 8 ? 'bg-green-500' : (score as number) >= 6 ? 'bg-amber-500' : 'bg-red-500';
                  const textColor = (score as number) >= 8 ? 'text-green-400' : (score as number) >= 6 ? 'text-amber-400' : 'text-red-400';
                  return (
                    <div key={skill}>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300 text-xs capitalize">{skill.replace(/_/g, ' ')}</span>
                        <span className={`text-xs font-bold ${textColor}`}>{score}/10</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
function ReportsPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('sessionId');

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(!!sessionId);
  const [reportError, setReportError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => { fetchReports(); }, []);
  useEffect(() => { if (sessionId) generateReportForSession(sessionId); }, [sessionId]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) { const data = await res.json(); setReports(data); }
    } catch {}
    finally { setLoading(false); }
  };

  const generateReportForSession = async (sid: string) => {
    setGeneratingReport(true);
    setReportError(null);
    // Retry up to 4 times with increasing delay to handle DB propagation lag
    const MAX_RETRIES = 4;
    const RETRY_DELAYS = [0, 2000, 4000, 6000];
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (RETRY_DELAYS[attempt] > 0) {
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
      }
      try {
        const res = await fetch(`/api/interview-session/${sid}/generate-report`, { method: 'POST' });
        if (res.ok) {
          const report = await res.json();
          setReports(prev => {
            const without = prev.filter(r => r.interviewSessionId !== sid);
            return [report, ...without];
          });
          setSelectedReport(report);
          setGeneratingReport(false);
          return;
        }
        let msg = '';
        try { const t = await res.text(); msg = JSON.parse(t)?.error ?? t; } catch {}
        // If session not completed yet, retry; otherwise surface the error
        const notReady = res.status === 400 && msg.toLowerCase().includes('not completed');
        if (notReady && attempt < MAX_RETRIES - 1) continue;
        setReportError(msg || (res.status === 429 ? 'AI quota exceeded — please wait and try again.' : 'Failed to generate report. Please try again.'));
        break;
      } catch {
        if (attempt === MAX_RETRIES - 1) setReportError('Network error — could not reach the server.');
      }
    }
    setGeneratingReport(false);
  };

  const filtered = reports.filter(r => {
    if (!r.interviewSession) return false;
    const term = searchTerm.toLowerCase();
    return (r.interviewSession.title || '').toLowerCase().includes(term) ||
      (r.interviewSession.interviewType?.name || '').toLowerCase().includes(term);
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-purple-400" size={36} />
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Generating banner */}
      {generatingReport && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-900/40 border border-blue-500/40 text-blue-200 text-sm">
          <Loader2 size={16} className="animate-spin shrink-0" />
          Generating your interview report — this may take a few seconds…
        </div>
      )}
      {reportError && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-900/40 border border-red-500/40 text-red-200 text-sm">
          <span>{reportError}</span>
          <button onClick={() => setReportError(null)} className="text-red-300 hover:text-white shrink-0"><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Interview Reports</h1>
          <p className="text-slate-400">Review your past interviews and track your progress</p>
        </div>
        {filtered.length > 0 && (
          <Button
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white gap-2 self-start sm:self-auto"
            onClick={() => exportAllPDF(filtered)}
          >
            <Download size={16} /> Export All PDF
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <Input
          placeholder="Search reports by title or type…"
          className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl">
          <FileText className="mx-auto mb-4 text-slate-600" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No reports yet</h3>
          <p className="text-slate-400 mb-6">Complete an interview to see your performance report here</p>
          <Button onClick={() => window.location.href = '/interview/start'} className="bg-purple-600 hover:bg-purple-700">
            Start New Interview
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => {
            if (!report.interviewSession) return null;
            const Icon = getIconForType(report.interviewSession.interviewType?.name || '');
            const grad = getGradient(report.interviewSession.interviewType?.name || '');
            return (
              <div
                key={report.id}
                className="group bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-5 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Icon + info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${grad} flex items-center justify-center shadow-lg shrink-0`}>
                      <Icon className="text-white" size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                          {report.interviewSession.interviewType?.name}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${diffBadge(report.interviewSession.difficulty || 'medium')}`}>
                          {(report.interviewSession.difficulty || 'medium')}
                        </Badge>
                        <span className={`text-sm font-bold border rounded-full px-2 py-0.5 ${scoreBg(report.overallScore)} ${scoreColor(report.overallScore)}`}>
                          {report.overallScore}%
                        </span>
                      </div>
                      <h3 className="text-white font-semibold text-base leading-snug mb-1 truncate">
                        {report.interviewSession.title || 'Interview'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Calendar size={12} />{fmt(report.interviewSession.completedAt || report.createdAt)}</span>
                        <span className="flex items-center gap-1"><Clock size={12} />{report.interviewSession.duration} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths + Weaknesses preview */}
                  <div className="hidden md:grid grid-cols-2 gap-3 lg:w-80 shrink-0">
                    <div>
                      <p className="text-green-400 text-xs font-semibold mb-1 flex items-center gap-1"><TrendingUp size={11} />Strengths</p>
                      <div className="flex flex-col gap-1">
                        {report.strengths.slice(0, 2).map((s, i) => (
                          <span key={i} className="text-xs text-green-300 bg-green-500/10 border border-green-500/20 rounded px-1.5 py-0.5 line-clamp-1">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-amber-400 text-xs font-semibold mb-1 flex items-center gap-1"><Award size={11} />To Improve</p>
                      <div className="flex flex-col gap-1">
                        {report.weaknesses.slice(0, 2).map((w, i) => (
                          <span key={i} className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 line-clamp-1">{w}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:text-white gap-1.5 h-8 text-xs"
                      onClick={e => { e.stopPropagation(); exportSinglePDF(report); }}
                    >
                      <Download size={13} /> PDF
                    </Button>
                    <Button
                      size="sm"
                      className="bg-purple-600/80 hover:bg-purple-600 text-white h-8 text-xs"
                      onClick={() => setSelectedReport(report)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedReport && selectedReport.interviewSession && (
        <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-purple-400" size={36} /></div>}>
      <ReportsPageContent />
    </Suspense>
  );
}

