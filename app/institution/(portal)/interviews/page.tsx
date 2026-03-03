"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, PlayCircle, BookOpen, X, ArrowRight, Globe, Building2, Trash2 } from "lucide-react";
import Link from "next/link";

interface InterviewType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  isGlobal: boolean;
  _count: { questionBanks: number; interviewSessions: number };
}

export default function InstitutionInterviewsPage() {
  const [types, setTypes] = useState<InterviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", icon: "📋" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/institution/interviews")
      .then((r) => r.json())
      .then((d) => {
        setTypes(d.interviewTypes ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    const res = await fetch("/api/institution/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create");
      setCreating(false);
      return;
    }

    setTypes((prev) => [data.interviewType, ...prev]);
    setForm({ name: "", description: "", icon: "📋" });
    setShowForm(false);
    setCreating(false);
  };

  const customTypes = types.filter((t) => !t.isGlobal);
  const globalTypes = types.filter((t) => t.isGlobal);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Interview Types</h1>
          <p className="text-slate-400 mt-1">Create and manage custom interview types for your students</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-500 gap-2"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "New Interview Type"}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-base text-blue-300">Create Custom Interview Type</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Icon (emoji)</label>
                  <Input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="📋"
                    className="text-center text-xl h-10"
                    maxLength={4}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs text-slate-400">Name *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Machine Learning Interview"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what this interview type covers..."
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500" disabled={creating}>
                {creating ? "Creating..." : "Create Interview Type"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Your custom types */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Your Custom Types</h2>
          <Badge variant="outline" className="border-blue-500/40 text-blue-400">{customTypes.length}</Badge>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : customTypes.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
            <PlayCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p>No custom interview types yet.</p>
            <p className="text-sm mt-1">Click &quot;New Interview Type&quot; to create your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customTypes.map((type) => (
              <Card key={type.id} className="border-slate-800 hover:border-blue-500/40 transition-colors group">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{type.icon ?? "📋"}</span>
                    <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-xs">Custom</Badge>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{type.name}</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{type.description ?? "No description"}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span>{type._count.questionBanks} question bank{type._count.questionBanks !== 1 ? "s" : ""}</span>
                    <span>{type._count.interviewSessions} sessions</span>
                  </div>
                  <Link href={`/institution/question-banks?typeId=${type.id}`}>
                    <Button size="sm" variant="outline" className="w-full gap-2 border-slate-700 hover:border-blue-500/50 group-hover:text-blue-400">
                      <BookOpen size={14} />
                      Manage Questions
                      <ArrowRight size={12} className="ml-auto" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Global types */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Global Types</h2>
          <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">{globalTypes.length}</Badge>
        </div>
        <p className="text-sm text-slate-500">These default interview types are available to all institutions. You can add custom questions to them.</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalTypes.map((type) => (
              <Card key={type.id} className="border-slate-800 hover:border-slate-600 transition-colors group opacity-80 hover:opacity-100">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{type.icon ?? "🌐"}</span>
                    <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">Global</Badge>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{type.name}</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{type.description ?? "No description"}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span>{type._count.questionBanks} banks</span>
                    <span>{type._count.interviewSessions} sessions</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
