"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target, TrendingUp, TrendingDown, BookOpen, Video,
  FileText, ExternalLink, CheckCircle2, AlertTriangle,
} from "lucide-react";

interface SkillAverages {
  communication: number;
  technical_knowledge: number;
  problem_solving: number;
  clarity: number;
  confidence: number;
}

const SKILL_DISPLAY: Record<string, string> = {
  communication: "Communication",
  technical_knowledge: "Technical Knowledge",
  problem_solving: "Problem Solving",
  clarity: "Clarity",
  confidence: "Confidence",
};

const RESOURCES = [
  {
    title: "System Design Interview",
    type: "Book",
    author: "Alex Xu",
    icon: BookOpen,
    link: "https://www.amazon.com/System-Design-Interview-insiders-Second/dp/B08CMF2CQF",
  },
  {
    title: "Grokking the System Design Interview",
    type: "Course",
    author: "Educative.io",
    icon: Video,
    link: "https://www.educative.io/courses/grokking-the-system-design-interview",
  },
  {
    title: "Dynamic Programming Patterns",
    type: "Article",
    author: "LeetCode",
    icon: FileText,
    link: "https://leetcode.com/discuss/general-discussion/458695/dynamic-programming-patterns",
  },
  {
    title: "Cracking the Coding Interview",
    type: "Book",
    author: "Gayle Laakmann McDowell",
    icon: BookOpen,
    link: "https://www.amazon.com/Cracking-Coding-Interview-Programming-Questions/dp/0984782850",
  },
];

function radarPolygonPoints(scores: number[], cx = 200, cy = 200, maxR = 160): string {
  const n = scores.length;
  return scores
    .map((score, i) => {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      const r = (score / 100) * maxR;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(" ");
}

function axisEnd(i: number, n: number, cx = 200, cy = 200, r = 160) {
  const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function labelPos(i: number, n: number, cx = 200, cy = 200, r = 188) {
  const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export default function SkillGapPage() {
  const [skillAverages, setSkillAverages] = useState<SkillAverages | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setSkillAverages(d.skillAverages ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const skillEntries = Object.entries(skillAverages ?? {}).map(([key, val]) => ({
    key,
    label: SKILL_DISPLAY[key] ?? key,
    score: Math.round(val as number),
  }));

  const strengths = skillEntries.filter((s) => s.score >= 70);
  const weaknesses = skillEntries.filter((s) => s.score < 70);

  const radarScores = skillEntries.map((s) => s.score);
  const polyPoints = radarPolygonPoints(radarScores);
  const n = skillEntries.length || 5;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Skill Gap Analysis</h1>
        <p className="text-slate-400 text-lg">
          Identify your strengths and weaknesses to create a targeted learning plan
        </p>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="text-green-400" size={24} />
              Your Strengths
            </CardTitle>
            <CardDescription>Areas where you excel (&ge; 70%)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            ) : strengths.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">
                Complete more interviews to identify your strengths.
              </p>
            ) : (
              strengths.map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{item.label}</span>
                    <Badge variant="success" className="text-sm">{item.score}%</Badge>
                  </div>
                  <Progress value={item.score} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingDown className="text-amber-400" size={24} />
              Areas for Improvement
            </CardTitle>
            <CardDescription>Skills that need attention (&lt; 70%)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            ) : weaknesses.length === 0 && skillEntries.length > 0 ? (
              <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-center gap-3">
                <CheckCircle2 className="text-green-400" size={20} />
                <p className="text-slate-300 text-sm">All skills are above 70% — excellent work!</p>
              </div>
            ) : weaknesses.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">
                Complete more interviews to identify areas for improvement.
              </p>
            ) : (
              weaknesses.map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning" className="text-xs">
                        <AlertTriangle size={12} className="mr-1" />
                        focus
                      </Badge>
                      <Badge variant="warning" className="text-sm">{item.score}%</Badge>
                    </div>
                  </div>
                  <Progress value={item.score} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Target className="text-purple-400" size={24} />
            Skills Radar
          </CardTitle>
          <CardDescription>Visual representation of your skill distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            {loading ? (
              <Skeleton className="w-64 h-64 rounded-full" />
            ) : skillEntries.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">
                No data yet. Complete interviews to populate the radar.
              </p>
            ) : (
              <div className="relative w-full max-w-lg aspect-square">
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  {[160, 120, 80, 40].map((r) => (
                    <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-700/30" />
                  ))}
                  {skillEntries.map((_, i) => {
                    const end = axisEnd(i, n);
                    return (
                      <line key={i} x1="200" y1="200" x2={end.x} y2={end.y} stroke="currentColor" strokeWidth="1" className="text-slate-700/30" />
                    );
                  })}
                  {radarScores.length > 0 && (
                    <polygon
                      points={polyPoints}
                      fill="url(#radarGradient)"
                      fillOpacity="0.3"
                      stroke="url(#radarStroke)"
                      strokeWidth="2"
                    />
                  )}
                  <defs>
                    <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9333ea" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9333ea" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  {skillEntries.map((item, i) => {
                    const pos = labelPos(i, n);
                    return (
                      <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-400" fontSize="11">
                        {item.label.split(" ").map((word, wi) => (
                          <tspan key={wi} x={pos.x} dy={wi === 0 ? "0" : "1.2em"}>
                            {word}
                          </tspan>
                        ))}
                      </text>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="text-blue-400" size={24} />
            Recommended Resources
          </CardTitle>
          <CardDescription>Curated materials to help you improve</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {RESOURCES.map((resource, i) => (
              <a
                key={i}
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700 hover:border-slate-600 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <resource.icon className="text-white" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm truncate">{resource.title}</span>
                    <ExternalLink size={12} className="text-slate-500 group-hover:text-purple-400 flex-shrink-0 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-400">{resource.author}</p>
                  <Badge variant="secondary" className="text-xs mt-2">{resource.type}</Badge>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {weaknesses.length > 0 && (
        <Card className="bg-gradient-to-br from-amber-600/10 via-orange-600/10 to-transparent">
          <CardContent className="p-6 flex items-start gap-4">
            <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-white mb-1">Improvement Plan</p>
              <p className="text-slate-300 text-sm">
                Focus on <strong className="text-amber-400">{weaknesses[0]?.label}</strong> first — it has the most room to grow.
                Aim for at least 2 practice sessions per week targeting weak areas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
