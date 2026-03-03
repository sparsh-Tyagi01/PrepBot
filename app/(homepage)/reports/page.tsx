"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, Calendar, Award, Clock, Filter, 
  Download, Search, TrendingUp, Code2, MessageSquare,
  Briefcase, Network
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
    interviewType: {
      name: string;
      icon: string;
    };
    completedAt: string;
  };
}

const getIconForType = (typeName: string) => {
  if (typeName.toLowerCase().includes('technical')) return Code2;
  if (typeName.toLowerCase().includes('behavioral')) return MessageSquare;
  if (typeName.toLowerCase().includes('system')) return Network;
  if (typeName.toLowerCase().includes('hr')) return Briefcase;
  return FileText;
};

const getColorForType = (typeName: string) => {
  if (typeName.toLowerCase().includes('technical')) return 'purple';
  if (typeName.toLowerCase().includes('behavioral')) return 'blue';
  if (typeName.toLowerCase().includes('system')) return 'cyan';
  if (typeName.toLowerCase().includes('hr')) return 'teal';
  return 'slate';
};

function ReportsPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('sessionId');
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(!!sessionId);
  const [reportError, setReportError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (sessionId) {
      generateReportForSession(sessionId);
    }
  }, [sessionId]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReportForSession = async (sessionId: string) => {
    setGeneratingReport(true);
    setReportError(null);
    try {
      const res = await fetch(`/api/interview-session/${sessionId}/generate-report`, {
        method: 'POST',
      });
      if (res.ok) {
        const report = await res.json();
        setReports((prev) => [report, ...prev]);
        setSelectedReport(report);
      } else {
        let errMsg = '';
        try { const t = await res.text(); errMsg = JSON.parse(t)?.error ?? t; } catch {}
        setReportError(
          errMsg ||
          (res.status === 429
            ? 'AI quota exceeded — please wait a moment and try again, or generate a new API key.'
            : 'Failed to generate report. Please try again.')
        );
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setReportError('Network error — could not reach the server.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    if (!report.interviewSession) return false;
    const title = report.interviewSession.title?.toLowerCase() || '';
    const typeName = report.interviewSession.interviewType?.name?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    return title.includes(term) || typeName.includes(term);
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Generating report banner */}
      {generatingReport && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-900/40 border border-blue-500/40 text-blue-200 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent shrink-0" />
          Generating your interview report… this may take a few seconds.
        </div>
      )}
      {/* Report error banner */}
      {reportError && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-900/40 border border-red-500/40 text-red-200 text-sm">
          <span>{reportError}</span>
          <button onClick={() => setReportError(null)} className="text-red-300 hover:text-white shrink-0">✕</button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Interview Reports</h1>
          <p className="text-slate-400 text-lg">
            Review your past interviews and track your progress
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2" size={18} />
          Export All
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <Input
                placeholder="Search reports..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-slate-500" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">No reports yet</h3>
            <p className="text-slate-400 mb-6">
              Complete an interview to see your performance reports here
            </p>
            <Button onClick={() => window.location.href = '/interview/start'}>
              Start New Interview
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            if (!report.interviewSession) return null;
            
            const Icon = getIconForType(report.interviewSession.interviewType?.name || '');
            const color = getColorForType(report.interviewSession.interviewType?.name || '');
            
            return (
              <Card key={report.id} className="group hover:scale-[1.01] transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Icon & Basic Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-14 h-14 rounded-2xl bg-linear-to-br from-${color}-600 to-${color}-500 flex items-center justify-center shadow-lg shrink-0`}>
                        <Icon className="text-white" size={28} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{report.interviewSession.interviewType?.name || 'Interview'}</Badge>
                          <Badge 
                            className={`text-sm ${
                              report.overallScore >= 90
                                ? 'bg-green-500/20 text-green-400'
                                : report.overallScore >= 75
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            <Award className="mr-1" size={14} />
                            {report.overallScore}%
                          </Badge>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                          {report.interviewSession.title || 'Untitled Interview'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(report.interviewSession.completedAt || report.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {report.interviewSession.duration || 0} min
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {report.interviewSession.difficulty || 'medium'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Improvements */}
                    <div className="grid md:grid-cols-2 gap-4 lg:w-1/2">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                          <TrendingUp size={14} />
                          Strengths
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {report.strengths.slice(0, 2).map((strength, i) => (
                            <Badge key={i} className="text-xs bg-green-500/20 text-green-400">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-amber-400">
                          <Award size={14} />
                          To Improve
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {report.weaknesses.slice(0, 2).map((weakness, i) => (
                            <Badge key={i} className="text-xs bg-yellow-500/20 text-yellow-400">
                              {weakness}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      <Button 
                        variant="outline"
                        onClick={() => setSelectedReport(report)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal - you can expand this into a separate component */}
      {selectedReport && selectedReport.interviewSession && (
        <Card className="fixed inset-8 z-50 overflow-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedReport.interviewSession.title || 'Interview Report'}</CardTitle>
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Detailed Analysis</h3>
                <p className="text-slate-400">{selectedReport.detailedAnalysis}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Recommendations</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  {selectedReport.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              {selectedReport.skillBreakdown && (
                <div>
                  <h3 className="font-semibold mb-4">Skill Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedReport.skillBreakdown).map(([skill, score]) => (
                      <div key={skill}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm capitalize">{skill.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-semibold">{score}/10</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500"
                            style={{ width: `${(score as number) * 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-white">Loading reports...</div>}>
      <ReportsPageContent />
    </Suspense>
  );
}
