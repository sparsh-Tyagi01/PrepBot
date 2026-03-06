"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, PlayCircle, BookOpen, X, ArrowRight, Globe, Building2, Pencil, Trash2, GitBranch, Layers } from "lucide-react";
import Link from "next/link";

interface InterviewType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  isGlobal: boolean;
  duration: number | null;
  difficulty: string | null;
  branchId: string | null;
  sectionId: string | null;
  _count: { questionBanks: number; interviewSessions: number };
}

interface Branch {
  id: string;
  name: string;
  code: string;
  sections: { id: string; name: string; code: string }[];
}

export default function InstitutionInterviewsPage() {
  const [types, setTypes] = useState<InterviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", icon: "📋", duration: "", difficulty: "", branchId: "", sectionId: "" });
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);

  // Edit state
  const [editingType, setEditingType] = useState<InterviewType | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", icon: "📋", duration: "", difficulty: "" });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/institution/interviews").then((r) => r.json()),
      fetch("/api/institution/branches").then((r) => r.json()),
    ]).then(([d, b]) => {
      setTypes(d.interviewTypes ?? []);
      setBranches(b.branches ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
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
    setForm({ name: "", description: "", icon: "📋", duration: "", difficulty: "" });
    setShowForm(false);
    setCreating(false);
  };

  const openEdit = (type: InterviewType) => {
    setEditingType(type);
    setEditForm({ name: type.name, description: type.description ?? "", icon: type.icon ?? "📋", duration: type.duration ? String(type.duration) : "", difficulty: type.difficulty ?? "" });
    setEditError("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    setSaving(true);
    setEditError("");

    const res = await fetch(`/api/institution/interviews/${editingType.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    const data = await res.json();

    if (!res.ok) {
      setEditError(data.error || "Failed to update");
      setSaving(false);
      return;
    }

    setTypes((prev) => prev.map((t) => (t.id === editingType.id ? data.interviewType : t)));
    setEditingType(null);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await fetch(`/api/institution/interviews/${id}`, { method: "DELETE" });

    if (res.ok) {
      setTypes((prev) => prev.filter((t) => t.id !== id));
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
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

      {/* Edit modal */}
      {editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-blue-500/30 bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base text-blue-300">Edit Interview Type</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => setEditingType(null)}>
                <X size={16} />
              </Button>
            </CardHeader>
            <CardContent>
              {editError && (
                <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                  {editError}
                </div>
              )}
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Icon (emoji)</label>
                    <Input
                      value={editForm.icon}
                      onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                      placeholder="📋"
                      className="text-center text-xl h-10"
                      maxLength={4}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs text-slate-400">Name *</label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g. Machine Learning Interview"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Description</label>
                  <Input
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Describe what this interview type covers..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Fixed Duration (minutes)</label>
                  <Input
                    type="number"
                    min={5}
                    max={180}
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                    placeholder="Leave blank to let students choose"
                  />
                  <p className="text-xs text-slate-500">Set a fixed duration — students won&apos;t be able to change it.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Fixed Difficulty</label>
                  <div className="grid grid-cols-4 gap-2">
                    {([["", "Student Choose"], ["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]] as const).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, difficulty: val })}
                        className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                          editForm.difficulty === val
                            ? val === "easy" ? "bg-green-600/20 border-green-500 text-green-300"
                              : val === "medium" ? "bg-amber-600/20 border-amber-500 text-amber-300"
                              : val === "hard" ? "bg-red-600/20 border-red-500 text-red-300"
                              : "bg-blue-600/20 border-blue-500 text-blue-300"
                            : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Fix the difficulty — students won&apos;t be able to change it.</p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingType(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

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
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Fixed Duration (minutes)</label>
                <Input
                  type="number"
                  min={5}
                  max={180}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="Leave blank to let students choose"
                />
                <p className="text-xs text-slate-500">Set a fixed duration — students won&apos;t be able to change it.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Fixed Difficulty</label>
                <div className="grid grid-cols-4 gap-2">
                  {([["", "Student Choose"], ["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm({ ...form, difficulty: val })}
                      className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                        form.difficulty === val
                          ? val === "easy" ? "bg-green-600/20 border-green-500 text-green-300"
                            : val === "medium" ? "bg-amber-600/20 border-amber-500 text-amber-300"
                            : val === "hard" ? "bg-red-600/20 border-red-500 text-red-300"
                            : "bg-blue-600/20 border-blue-500 text-blue-300"
                          : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">Fix the difficulty — students won&apos;t be able to change it.</p>
              </div>
              {/* Targeting: branch / section */}
              {branches.length > 0 && (
                <div className="space-y-3 border border-slate-700 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <GitBranch size={12} /> Audience Targeting <span className="text-slate-500 font-normal">(optional — visible to all if not set)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Branch</label>
                      <select
                        value={form.branchId}
                        onChange={(e) => setForm({ ...form, branchId: e.target.value, sectionId: "" })}
                        className="w-full h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">All branches</option>
                        {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Section</label>
                      <select
                        value={form.sectionId}
                        onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                        disabled={!form.branchId}
                        className="w-full h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40"
                      >
                        <option value="">All sections</option>
                        {branches.find((b) => b.id === form.branchId)?.sections.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
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
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-xs">Custom</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-blue-400"
                        onClick={() => openEdit(type)}
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </Button>
                      {confirmDeleteId === type.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleDelete(type.id)}
                            disabled={deletingId === type.id}
                          >
                            {deletingId === type.id ? "..." : "Confirm"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-slate-400 hover:text-red-400"
                          onClick={() => setConfirmDeleteId(type.id)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{type.name}</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{type.description ?? "No description"}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span>{type._count?.questionBanks ?? 0} question bank{(type._count?.questionBanks ?? 0) !== 1 ? "s" : ""}</span>
                    <span>{type._count?.interviewSessions ?? 0} sessions</span>
                  </div>
                  {type.duration && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs gap-1">
                        ⏱ Fixed: {type.duration} min
                      </Badge>
                    </div>
                  )}
                  {type.difficulty && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Badge variant="outline" className={`text-xs gap-1 ${
                        type.difficulty === 'easy' ? 'border-green-500/40 text-green-400' :
                        type.difficulty === 'hard' ? 'border-red-500/40 text-red-400' :
                        'border-amber-500/40 text-amber-400'
                      }`}>
                        ⚡ Fixed: {type.difficulty.charAt(0).toUpperCase() + type.difficulty.slice(1)}
                      </Badge>
                    </div>
                  )}
                  {(type.branchId || type.sectionId) && (
                    <div className="flex items-center gap-1 flex-wrap mb-3">
                      {type.branchId && (
                        <Badge variant="outline" className="text-xs border-cyan-500/40 text-cyan-400 gap-1">
                          <GitBranch size={10} />
                          {branches.find((b) => b.id === type.branchId)?.name ?? "Branch"}
                        </Badge>
                      )}
                      {type.sectionId && (() => {
                        const branch = branches.find((b) => b.id === type.branchId);
                        const section = branch?.sections.find((s) => s.id === type.sectionId);
                        return section ? (
                          <Badge variant="outline" className="text-xs border-purple-500/40 text-purple-400 gap-1">
                            <Layers size={10} /> {section.name}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                  )}
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
