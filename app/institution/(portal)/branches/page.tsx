"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, ChevronDown, ChevronRight, Pencil, Trash2, X, Copy, Check,
  GitBranch, Users, Layers,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Section {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  _count: { users: number };
}

interface Branch {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  _count: { sections: number; users: number };
  sections: Section[];
}

const EMPTY_BRANCH_FORM = { name: "", code: "", description: "" };
const EMPTY_SECTION_FORM = { name: "", code: "", description: "" };

// ─── Helper: copy to clipboard ──────────────────────────────────────────────
function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 font-mono text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 px-2 py-0.5 rounded-md transition-colors"
      title="Copy join code"
    >
      {code}
      {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Branch form state
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchForm, setBranchForm] = useState(EMPTY_BRANCH_FORM);
  const [branchFormError, setBranchFormError] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);

  // Edit branch state
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [editBranchForm, setEditBranchForm] = useState(EMPTY_BRANCH_FORM);
  const [editBranchError, setEditBranchError] = useState("");
  const [savingBranch, setSavingBranch] = useState(false);

  // Delete branch state
  const [confirmDeleteBranch, setConfirmDeleteBranch] = useState<string | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<string | null>(null);

  // Section form state (per branch)
  const [showSectionForm, setShowSectionForm] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState(EMPTY_SECTION_FORM);
  const [sectionFormError, setSectionFormError] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);

  // Edit section state
  const [editSection, setEditSection] = useState<{ branchId: string; section: Section } | null>(null);
  const [editSectionForm, setEditSectionForm] = useState(EMPTY_SECTION_FORM);
  const [editSectionError, setEditSectionError] = useState("");
  const [savingSection, setSavingSection] = useState(false);

  // Delete section state
  const [confirmDeleteSection, setConfirmDeleteSection] = useState<{ branchId: string; sectionId: string } | null>(null);
  const [deletingSection, setDeletingSection] = useState<string | null>(null);

  // ── Fetch branches ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/institution/branches")
      .then((r) => r.json())
      .then((d) => {
        setBranches(d.branches ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Branch CRUD ───────────────────────────────────────────────────────────
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBranchFormError("");
    setCreatingBranch(true);
    const res = await fetch("/api/institution/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(branchForm),
    });
    const data = await res.json();
    if (!res.ok) { setBranchFormError(data.error || "Failed to create"); setCreatingBranch(false); return; }
    setBranches((prev) => [...prev, data.branch]);
    setBranchForm(EMPTY_BRANCH_FORM);
    setShowBranchForm(false);
    setCreatingBranch(false);
  };

  const openEditBranch = (branch: Branch) => {
    setEditBranch(branch);
    setEditBranchForm({ name: branch.name, code: branch.code, description: branch.description ?? "" });
    setEditBranchError("");
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranch) return;
    setEditBranchError("");
    setSavingBranch(true);
    const res = await fetch(`/api/institution/branches/${editBranch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editBranchForm),
    });
    const data = await res.json();
    if (!res.ok) { setEditBranchError(data.error || "Failed to save"); setSavingBranch(false); return; }
    setBranches((prev) => prev.map((b) => b.id === editBranch.id ? { ...data.branch, sections: b.sections } : b));
    setEditBranch(null);
    setSavingBranch(false);
  };

  const handleDeleteBranch = async (branchId: string) => {
    setDeletingBranch(branchId);
    const res = await fetch(`/api/institution/branches/${branchId}`, { method: "DELETE" });
    if (res.ok) setBranches((prev) => prev.filter((b) => b.id !== branchId));
    setDeletingBranch(null);
    setConfirmDeleteBranch(null);
  };

  // ── Section CRUD ──────────────────────────────────────────────────────────
  const openSectionForm = (branchId: string) => {
    setShowSectionForm(branchId);
    setSectionForm(EMPTY_SECTION_FORM);
    setSectionFormError("");
    setExpanded((prev) => ({ ...prev, [branchId]: true }));
  };

  const handleCreateSection = async (e: React.FormEvent, branchId: string) => {
    e.preventDefault();
    setSectionFormError("");
    setCreatingSection(true);
    const res = await fetch(`/api/institution/branches/${branchId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sectionForm),
    });
    const data = await res.json();
    if (!res.ok) { setSectionFormError(data.error || "Failed to create"); setCreatingSection(false); return; }
    setBranches((prev) =>
      prev.map((b) =>
        b.id === branchId
          ? { ...b, sections: [...b.sections, data.section], _count: { ...b._count, sections: b._count.sections + 1 } }
          : b
      )
    );
    setSectionForm(EMPTY_SECTION_FORM);
    setShowSectionForm(null);
    setCreatingSection(false);
  };

  const openEditSection = (branchId: string, section: Section) => {
    setEditSection({ branchId, section });
    setEditSectionForm({ name: section.name, code: section.code, description: section.description ?? "" });
    setEditSectionError("");
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSection) return;
    setEditSectionError("");
    setSavingSection(true);
    const { branchId, section } = editSection;
    const res = await fetch(`/api/institution/branches/${branchId}/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editSectionForm),
    });
    const data = await res.json();
    if (!res.ok) { setEditSectionError(data.error || "Failed to save"); setSavingSection(false); return; }
    setBranches((prev) =>
      prev.map((b) =>
        b.id === branchId
          ? { ...b, sections: b.sections.map((s) => (s.id === section.id ? data.section : s)) }
          : b
      )
    );
    setEditSection(null);
    setSavingSection(false);
  };

  const handleDeleteSection = async (branchId: string, sectionId: string) => {
    setDeletingSection(sectionId);
    const res = await fetch(`/api/institution/branches/${branchId}/sections/${sectionId}`, { method: "DELETE" });
    if (res.ok) {
      setBranches((prev) =>
        prev.map((b) =>
          b.id === branchId
            ? { ...b, sections: b.sections.filter((s) => s.id !== sectionId), _count: { ...b._count, sections: b._count.sections - 1 } }
            : b
        )
      );
    }
    setDeletingSection(null);
    setConfirmDeleteSection(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <GitBranch className="text-cyan-400" size={28} />
            Branches & Sections
          </h1>
          <p className="text-slate-400">
            Create branches (e.g. departments) and sections within them. Each gets a unique join code for students.
          </p>
        </div>
        {!showBranchForm && (
          <Button onClick={() => setShowBranchForm(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2 shrink-0">
            <Plus size={16} /> New Branch
          </Button>
        )}
      </div>

      {/* Create Branch Form */}
      {showBranchForm && (
        <Card className="border-cyan-500/30 bg-slate-900/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center justify-between">
              Create New Branch
              <button onClick={() => setShowBranchForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Branch Name *</label>
                  <Input
                    placeholder="e.g. Computer Science"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Custom Code (optional)</label>
                  <Input
                    placeholder="e.g. CSE (auto-generated if blank)"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm((f) => ({ ...f, code: e.target.value.toUpperCase().slice(0, 8) }))}
                    className="font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Description (optional)</label>
                <Input
                  placeholder="Brief description of this branch"
                  value={branchForm.description}
                  onChange={(e) => setBranchForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              {branchFormError && <p className="text-red-400 text-sm">{branchFormError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={creatingBranch} className="bg-cyan-600 hover:bg-cyan-700">
                  {creatingBranch ? "Creating…" : "Create Branch"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowBranchForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl bg-slate-800" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && branches.length === 0 && (
        <Card className="border-dashed border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <GitBranch size={40} className="text-slate-600" />
            <p className="text-lg font-medium text-slate-300">No branches yet</p>
            <p className="text-sm text-center max-w-sm">
              Create branches for different departments (e.g. CSE, ECE, MBA). Each branch can have multiple sections.
            </p>
            <Button onClick={() => setShowBranchForm(true)} className="bg-cyan-600 hover:bg-cyan-700 mt-2 gap-2">
              <Plus size={16} /> Create First Branch
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Branch list */}
      {!loading && branches.map((branch) => (
        <Card key={branch.id} className="bg-slate-900/60 border-slate-700/50">
          <CardContent className="p-0">
            {/* Branch header row */}
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={() => setExpanded((prev) => ({ ...prev, [branch.id]: !prev[branch.id] }))}
                className="text-slate-400 hover:text-white shrink-0"
              >
                {expanded[branch.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold text-base">{branch.name}</span>
                  <CopyCode code={branch.code} />
                  {branch.description && (
                    <span className="text-slate-400 text-sm truncate">{branch.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Layers size={11} /> {branch._count.sections} section{branch._count.sections !== 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {branch._count.users} student{branch._count.users !== 1 ? "s" : ""}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-cyan-400 h-8 w-8 p-0"
                  onClick={() => openSectionForm(branch.id)}
                  title="Add Section"
                >
                  <Plus size={15} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-yellow-400 h-8 w-8 p-0"
                  onClick={() => openEditBranch(branch)}
                >
                  <Pencil size={14} />
                </Button>
                {confirmDeleteBranch === branch.id ? (
                  <div className="flex items-center gap-1 bg-red-950/60 border border-red-700 rounded-lg px-2 py-1">
                    <span className="text-xs text-red-300">Delete branch?</span>
                    <button
                      onClick={() => handleDeleteBranch(branch.id)}
                      disabled={deletingBranch === branch.id}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold"
                    >
                      {deletingBranch === branch.id ? "…" : "Yes"}
                    </button>
                    <button onClick={() => setConfirmDeleteBranch(null)} className="text-xs text-slate-400 hover:text-white">No</button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-red-400 h-8 w-8 p-0"
                    onClick={() => setConfirmDeleteBranch(branch.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>

            {/* Sections */}
            {expanded[branch.id] && (
              <div className="border-t border-slate-800 px-4 py-3 space-y-2">
                {branch.sections.length === 0 && showSectionForm !== branch.id && (
                  <p className="text-slate-500 text-sm text-center py-2">
                    No sections yet.{" "}
                    <button onClick={() => openSectionForm(branch.id)} className="text-cyan-400 hover:underline">
                      Add first section
                    </button>
                  </p>
                )}

                {branch.sections.map((section) => (
                  <div key={section.id} className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="text-slate-200 text-sm font-medium">{section.name}</span>
                      <CopyCode code={section.code} />
                      {section.description && (
                        <span className="text-slate-500 text-xs">{section.description}</span>
                      )}
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                        <Users size={10} className="mr-1" />{section._count.users}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-yellow-400 h-7 w-7 p-0"
                        onClick={() => openEditSection(branch.id, section)}
                      >
                        <Pencil size={12} />
                      </Button>
                      {confirmDeleteSection?.sectionId === section.id ? (
                        <div className="flex items-center gap-1 bg-red-950/60 border border-red-700 rounded px-2 py-0.5">
                          <span className="text-xs text-red-300">Delete?</span>
                          <button
                            onClick={() => handleDeleteSection(branch.id, section.id)}
                            disabled={deletingSection === section.id}
                            className="text-xs text-red-400 hover:text-red-300 font-semibold"
                          >
                            {deletingSection === section.id ? "…" : "Yes"}
                          </button>
                          <button onClick={() => setConfirmDeleteSection(null)} className="text-xs text-slate-400 hover:text-white">No</button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-400 h-7 w-7 p-0"
                          onClick={() => setConfirmDeleteSection({ branchId: branch.id, sectionId: section.id })}
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add section form */}
                {showSectionForm === branch.id && (
                  <form onSubmit={(e) => handleCreateSection(e, branch.id)} className="mt-2 space-y-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300 font-medium">New Section</span>
                      <button type="button" onClick={() => setShowSectionForm(null)} className="text-slate-500 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Section Name *</label>
                        <Input
                          placeholder="e.g. Section A"
                          value={sectionForm.name}
                          onChange={(e) => setSectionForm((f) => ({ ...f, name: e.target.value }))}
                          className="h-8 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Custom Code (optional)</label>
                        <Input
                          placeholder="e.g. CSEA1 (auto if blank)"
                          value={sectionForm.code}
                          onChange={(e) => setSectionForm((f) => ({ ...f, code: e.target.value.toUpperCase().slice(0, 8) }))}
                          className="h-8 text-sm font-mono"
                        />
                      </div>
                    </div>
                    <Input
                      placeholder="Description (optional)"
                      value={sectionForm.description}
                      onChange={(e) => setSectionForm((f) => ({ ...f, description: e.target.value }))}
                      className="h-8 text-sm"
                    />
                    {sectionFormError && <p className="text-red-400 text-xs">{sectionFormError}</p>}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={creatingSection} className="bg-cyan-600 hover:bg-cyan-700 h-8">
                        {creatingSection ? "Adding…" : "Add Section"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setShowSectionForm(null)}>Cancel</Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Edit Branch Modal */}
      {editBranch && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                Edit Branch
                <button onClick={() => setEditBranch(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBranch} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Branch Name</label>
                  <Input value={editBranchForm.name} onChange={(e) => setEditBranchForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Join Code</label>
                  <Input value={editBranchForm.code} onChange={(e) => setEditBranchForm((f) => ({ ...f, code: e.target.value.toUpperCase().slice(0, 8) }))} className="font-mono" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Description</label>
                  <Input value={editBranchForm.description} onChange={(e) => setEditBranchForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                {editBranchError && <p className="text-red-400 text-sm">{editBranchError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={savingBranch} className="bg-cyan-600 hover:bg-cyan-700">
                    {savingBranch ? "Saving…" : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditBranch(null)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Section Modal */}
      {editSection && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                Edit Section
                <button onClick={() => setEditSection(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSection} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Section Name</label>
                  <Input value={editSectionForm.name} onChange={(e) => setEditSectionForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Join Code</label>
                  <Input value={editSectionForm.code} onChange={(e) => setEditSectionForm((f) => ({ ...f, code: e.target.value.toUpperCase().slice(0, 8) }))} className="font-mono" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Description</label>
                  <Input value={editSectionForm.description} onChange={(e) => setEditSectionForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                {editSectionError && <p className="text-red-400 text-sm">{editSectionError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={savingSection} className="bg-cyan-600 hover:bg-cyan-700">
                    {savingSection ? "Saving…" : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditSection(null)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
