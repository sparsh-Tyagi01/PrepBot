"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Video, Users, Trophy, Play, Clock, Calendar } from "lucide-react";

interface InterviewSession {
  id: string;
  title: string;
  difficulty: string;
  duration: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  score?: number;
  interviewType: {
    name: string;
    icon: string;
  };
  aiInterviewer: {
    name: string;
    personality: string;
  };
}

export default function InterviewPage() {
  const router = useRouter();
  const [recentSessions, setRecentSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentSessions();
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
