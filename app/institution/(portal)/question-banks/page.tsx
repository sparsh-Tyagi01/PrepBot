"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, X, ChevronDown, ChevronRight, Pencil, Trash2, GitBranch, Layers } from "lucide-react";

interface Question {
  id: string;
  question: string;
  expectedAnswer?: string | null;
  difficulty: string;
  timeAllocation: number;
  order?: number;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  sections: { id: string; name: string; code: string }[];
}

interface QuestionBank {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
  branchId: string | null;
  sectionId: string | null;
  interviewType: { name: string; icon: string | null };
  _count: { questions: number };
  questions?: Question[];
}

const DIFFICULTIES = ["easy", "medium", "hard"];

function QuestionBanksContent() {
  const searchParams = useSearchParams();
  const filterTypeId = searchParams.get("typeId");

  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBankForm, setShowBankForm] = useState(false);
  const [creatingBank, setCreatingBank] = useState(false);
  const [expandedBank, setExpandedBank] = useState<string | null>(null);
  const [bankQuestions, setBankQuestions] = useState<Record<string, Question[]>>({});
  const [bankForm, setBankForm] = useState({ name: "", description: "", interviewTypeId: filterTypeId ?? "", difficulty: "medium", branchId: "", sectionId: "" });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [qForm, setQForm] = useState({ question: "", expectedAnswer: "", difficulty: "medium", timeAllocation: 5 });
  const [addingQ, setAddingQ] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [questionError, setQuestionError] = useState("");

  // Edit bank state
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [editBankForm, setEditBankForm] = useState({ name: "", description: "", interviewTypeId: "", difficulty: "medium" });
  const [editBankError, setEditBankError] = useState("");
  const [savingBank, setSavingBank] = useState(false);

  // Delete bank state
  const [confirmDeleteBankId, setConfirmDeleteBankId] = useState<string | null>(null);
  const [deletingBankId, setDeletingBankId] = useState<string | null>(null);

  // Edit question state
  const [editingQuestion, setEditingQuestion] = useState<{ bankId: string; question: Question } | null>(null);
  const [editQForm, setEditQForm] = useState({ question: "", expectedAnswer: "", difficulty: "medium", timeAllocation: 5 });
  const [editQError, setEditQError] = useState("");
  const [savingQ, setSavingQ] = useState(false);

  // Delete question state
  const [confirmDeleteQuestion, setConfirmDeleteQuestion] = useState<{ bankId: string; questionId: string } | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  // Fetch interview types for dropdown
  const [interviewTypes, setInterviewTypes] = useState<{ id: string; name: string; icon: string | null }[]>([]);

  useEffect(() => {
    const url = filterTypeId
      ? `/api/institution/question-banks?typeId=${filterTypeId}`
      : "/api/institution/question-banks";

    Promise.all([
      fetch(url).then((r) => r.json()),
      fetch("/api/institution/interviews").then((r) => r.json()),
      fetch("/api/institution/branches").then((r) => r.json()),
    ]).then(([banksData, typesData, branchesData]) => {
      setBanks(banksData.questionBanks ?? []);
      setInterviewTypes(typesData.interviewTypes?.filter((t: { isGlobal: boolean }) => !t.isGlobal) ?? []);
      setBranches(branchesData.branches ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filterTypeId]);

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingBank(true);
    setError("");

    const res = await fetch("/api/institution/question-banks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bankForm),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create");
      setCreatingBank(false);
      return;
    }

    setBanks((prev) => [data.questionBank, ...prev]);
    setBankForm({ name: "", description: "", interviewTypeId: filterTypeId ?? "", difficulty: "medium", branchId: "", sectionId: "" });
    setShowBankForm(false);
    setCreatingBank(false);
  };

  const loadQuestions = async (bankId: string) => {
    if (bankQuestions[bankId]) return;
    const res = await fetch(`/api/institution/question-banks/${bankId}/questions`);
    const data = await res.json();
    setBankQuestions((prev) => ({ ...prev, [bankId]: data.questions ?? [] }));
  };

  const toggleBank = async (bankId: string) => {
    if (expandedBank === bankId) {
      setExpandedBank(null);
    } else {
      setExpandedBank(bankId);
      await loadQuestions(bankId);
    }
  };

  const handleAddQuestion = async (bankId: string, e: React.FormEvent) => {
    e.preventDefault();
    setQuestionError("");

    const res = await fetch(`/api/institution/question-banks/${bankId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(qForm),
    });

    const data = await res.json();

    if (!res.ok) {
      setQuestionError(data.error || "Failed to add question");
      return;
    }

    setBankQuestions((prev) => ({
      ...prev,
      [bankId]: [...(prev[bankId] ?? []), data.question],
    }));
    setBanks((prev) =>
      prev.map((b) =>
        b.id === bankId ? { ...b, _count: { questions: b._count.questions + 1 } } : b
      )
    );
    setQForm({ question: "", expectedAnswer: "", difficulty: "medium", timeAllocation: 5 });
    setAddingQ(null);
  };

  // --- Bank edit/delete ---
  const openEditBank = (bank: QuestionBank) => {
    setEditingBank(bank);
    setEditBankForm({
      name: bank.name,
      description: bank.description ?? "",
      interviewTypeId: "",
      difficulty: bank.difficulty,
    });
    setEditBankError("");
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBank) return;
    setSavingBank(true);
    setEditBankError("");

    const payload = {
      ...editBankForm,
      interviewTypeId: editBankForm.interviewTypeId || interviewTypes.find((t) => t.name === editingBank.interviewType.name)?.id || "",
    };

    const res = await fetch(`/api/institution/question-banks/${editingBank.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setEditBankError(data.error || "Failed to update");
      setSavingBank(false);
      return;
    }

    setBanks((prev) => prev.map((b) => (b.id === editingBank.id ? data.questionBank : b)));
    setEditingBank(null);
    setSavingBank(false);
  };

  const handleDeleteBank = async (bankId: string) => {
    setDeletingBankId(bankId);
    const res = await fetch(`/api/institution/question-banks/${bankId}`, { method: "DELETE" });

    if (res.ok) {
      setBanks((prev) => prev.filter((b) => b.id !== bankId));
      if (expandedBank === bankId) setExpandedBank(null);
    }
    setDeletingBankId(null);
    setConfirmDeleteBankId(null);
  };

  // --- Question edit/delete ---
  const openEditQuestion = (bankId: string, question: Question) => {
    setEditingQuestion({ bankId, question });
    setEditQForm({
      question: question.question,
      expectedAnswer: question.expectedAnswer ?? "",
      difficulty: question.difficulty,
      timeAllocation: question.timeAllocation,
    });
    setEditQError("");
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    setSavingQ(true);
    setEditQError("");

    const res = await fetch(
      `/api/institution/question-banks/${editingQuestion.bankId}/questions/${editingQuestion.question.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editQForm),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setEditQError(data.error || "Failed to update");
      setSavingQ(false);
      return;
    }

    setBankQuestions((prev) => ({
      ...prev,
      [editingQuestion.bankId]: prev[editingQuestion.bankId].map((q) =>
        q.id === editingQuestion.question.id ? data.question : q
      ),
    }));
    setEditingQuestion(null);
    setSavingQ(false);
  };

  const handleDeleteQuestion = async (bankId: string, questionId: string) => {
    setDeletingQuestionId(questionId);
    const res = await fetch(
      `/api/institution/question-banks/${bankId}/questions/${questionId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setBankQuestions((prev) => ({
        ...prev,
        [bankId]: prev[bankId].filter((q) => q.id !== questionId),
      }));
      setBanks((prev) =>
        prev.map((b) =>
          b.id === bankId ? { ...b, _count: { questions: Math.max(0, b._count.questions - 1) } } : b
        )
      );
    }
    setDeletingQuestionId(null);
    setConfirmDeleteQuestion(null);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Question Banks</h1>
          <p className="text-slate-400 mt-1">Manage questions for your custom interview types</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-500 gap-2"
          onClick={() => setShowBankForm(!showBankForm)}
        >
          {showBankForm ? <X size={16} /> : <Plus size={16} />}
          {showBankForm ? "Cancel" : "New Question Bank"}
        </Button>
      </div>

      {/* Create Bank Form */}
      {showBankForm && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-base text-blue-300">Create Question Bank</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateBank} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Bank Name *</label>
                  <Input
                    value={bankForm.name}
                    onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                    placeholder="e.g. React Core Questions"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Interview Type *</label>
                  <select
                    value={bankForm.interviewTypeId}
                    onChange={(e) => setBankForm({ ...bankForm, interviewTypeId: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 text-sm text-white px-3"
                    required
                  >
                    <option value="">Select type...</option>
                    {interviewTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs text-slate-400">Description</label>
                  <Input
                    value={bankForm.description}
                    onChange={(e) => setBankForm({ ...bankForm, description: e.target.value })}
                    placeholder="What does this bank cover?"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Difficulty</label>
                  <select
                    value={bankForm.difficulty}
                    onChange={(e) => setBankForm({ ...bankForm, difficulty: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 text-sm text-white px-3"
                  >
                    {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              {branches.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 flex items-center gap-1"><GitBranch size={11} /> Target Branch (optional)</label>
                    <select
                      value={bankForm.branchId}
                      onChange={(e) => setBankForm({ ...bankForm, branchId: e.target.value, sectionId: "" })}
                      className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 text-sm text-white px-3"
                    >
                      <option value="">All branches (institution-wide)</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  {bankForm.branchId && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 flex items-center gap-1"><Layers size={11} /> Target Section (optional)</label>
                      <select
                        value={bankForm.sectionId}
                        onChange={(e) => setBankForm({ ...bankForm, sectionId: e.target.value })}
                        className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 text-sm text-white px-3"
                      >
                        <option value="">All sections in branch</option>
                        {branches.find((b) => b.id === bankForm.branchId)?.sections.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500" disabled={creatingBank}>
                {creatingBank ? "Creating..." : "Create Bank"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Bank modal */}
      {editingBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg border-blue-500/30 bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base text-blue-300">Edit Question Bank</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => setEditingBank(null)}>
                <X size={16} />
              </Button>
            </CardHeader>
            <CardContent>
              {editBankError && (
                <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                  {editBankError}
                </div>
              )}
              <form onSubmit={handleUpdateBank} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Bank Name *</label>
                    <Input
                      value={editBankForm.name}
                      onChange={(e) => setEditBankForm({ ...editBankForm, name: e.target.value })}
                      placeholder="e.g. React Core Questions"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Interview Type *</label>
                    <select
                      value={editBankForm.interviewTypeId || interviewTypes.find((t) => t.name === editingBank.interviewType.name)?.id || ""}
                      onChange={(e) => setEditBankForm({ ...editBankForm, interviewTypeId: e.target.value })}
                      className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 text-sm text-white px-3"
                      required
                    >
                      <option value="">Select type...</option>
                      {interviewTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs text-slate-400">Description</label>
                    <Input
                      value={editBankForm.description}
                      onChange={(e) => setEditBankForm({ ...editBankForm, description: e.target.value })}
                      placeholder="What does this bank cover?"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Difficulty</label>
                    <select
                      value={editBankForm.difficulty}
                      onChange={(e) => setEditBankForm({ ...editBankForm, difficulty: e.target.value })}
                      className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 text-sm text-white px-3"
                    >
                      {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500" disabled={savingBank}>
                    {savingBank ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingBank(null)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Question modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg border-blue-500/30 bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base text-blue-300">Edit Question</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => setEditingQuestion(null)}>
                <X size={16} />
              </Button>
            </CardHeader>
            <CardContent>
              {editQError && (
                <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                  {editQError}
                </div>
              )}
              <form onSubmit={handleUpdateQuestion} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Question *</label>
                  <Input
                    value={editQForm.question}
                    onChange={(e) => setEditQForm({ ...editQForm, question: e.target.value })}
                    placeholder="e.g. Explain the difference between useEffect and useLayoutEffect"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Expected Answer / Key Points</label>
                  <Input
                    value={editQForm.expectedAnswer}
                    onChange={(e) => setEditQForm({ ...editQForm, expectedAnswer: e.target.value })}
                    placeholder="What should the candidate cover?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Difficulty</label>
                    <select
                      value={editQForm.difficulty}
                      onChange={(e) => setEditQForm({ ...editQForm, difficulty: e.target.value })}
                      className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 text-sm text-white px-3"
                    >
                      {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Time (minutes)</label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={editQForm.timeAllocation}
                      onChange={(e) => setEditQForm({ ...editQForm, timeAllocation: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500" disabled={savingQ}>
                    {savingQ ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingQuestion(null)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Banks list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : banks.length === 0 ? (
        <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>No question banks yet.</p>
          <p className="text-sm mt-1">Create a question bank and start adding interview questions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banks.map((bank) => (
            <Card key={bank.id} className="border-slate-800">
              <div className="flex items-center justify-between p-5">
                <div
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => toggleBank(bank.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <BookOpen size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{bank.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400">{bank.interviewType.icon} {bank.interviewType.name}</span>
                      <span className="text-slate-700">·</span>
                      <Badge variant="outline" className="text-xs border-slate-700 text-slate-400 py-0">
                        {bank.difficulty}
                      </Badge>
                      <span className="text-slate-700">·</span>
                      <span className="text-xs text-slate-400">{bank._count.questions} questions</span>
                      {bank.branchId && (
                        <Badge variant="outline" className="text-xs border-cyan-500/40 text-cyan-400 gap-1 py-0">
                          <GitBranch size={10} />
                          {branches.find((b) => b.id === bank.branchId)?.name ?? "Branch"}
                        </Badge>
                      )}
                      {bank.sectionId && (
                        <Badge variant="outline" className="text-xs border-purple-500/40 text-purple-400 gap-1 py-0">
                          <Layers size={10} />
                          {branches.flatMap((b) => b.sections).find((s) => s.id === bank.sectionId)?.name ?? "Section"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-400 hover:text-blue-400"
                    onClick={(e) => { e.stopPropagation(); openEditBank(bank); }}
                    title="Edit bank"
                  >
                    <Pencil size={14} />
                  </Button>
                  {confirmDeleteBankId === bank.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleDeleteBank(bank.id)}
                        disabled={deletingBankId === bank.id}
                      >
                        {deletingBankId === bank.id ? "..." : "Confirm"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setConfirmDeleteBankId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-400 hover:text-red-400"
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteBankId(bank.id); }}
                      title="Delete bank"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                  <div
                    className="ml-1 cursor-pointer text-slate-400"
                    onClick={() => toggleBank(bank.id)}
                  >
                    {expandedBank === bank.id ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </div>
                </div>
              </div>

              {expandedBank === bank.id && (
                <div className="border-t border-slate-800 p-5 space-y-4">
                  {/* Questions list */}
                  <div className="space-y-2">
                    {(bankQuestions[bank.id] ?? []).map((q, i) => (
                      <div key={q.id} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl group/q">
                        <span className="text-xs text-slate-500 mt-0.5 w-5 shrink-0">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200">{q.question}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className="text-xs border-slate-700 text-slate-500 py-0">
                            {q.difficulty}
                          </Badge>
                          <span className="text-xs text-slate-500 w-7 text-center">{q.timeAllocation}m</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-slate-500 hover:text-blue-400 opacity-0 group-hover/q:opacity-100 transition-opacity"
                            onClick={() => openEditQuestion(bank.id, q)}
                            title="Edit question"
                          >
                            <Pencil size={11} />
                          </Button>
                          {confirmDeleteQuestion?.bankId === bank.id && confirmDeleteQuestion?.questionId === q.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleDeleteQuestion(bank.id, q.id)}
                                disabled={deletingQuestionId === q.id}
                              >
                                {deletingQuestionId === q.id ? "..." : "Del"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-1 text-xs"
                                onClick={() => setConfirmDeleteQuestion(null)}
                              >
                                <X size={10} />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-slate-500 hover:text-red-400 opacity-0 group-hover/q:opacity-100 transition-opacity"
                              onClick={() => setConfirmDeleteQuestion({ bankId: bank.id, questionId: q.id })}
                              title="Delete question"
                            >
                              <Trash2 size={11} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {bankQuestions[bank.id] === undefined && (
                      <div className="space-y-2">
                        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                      </div>
                    )}

                    {bankQuestions[bank.id]?.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">No questions yet. Add your first question below.</p>
                    )}
                  </div>

                  {/* Add question */}
                  {addingQ === bank.id ? (
                    <div className="border border-slate-700 rounded-xl p-4 space-y-3">
                      {questionError && (
                        <div className="text-xs text-red-400">{questionError}</div>
                      )}
                      <form onSubmit={(e) => handleAddQuestion(bank.id, e)} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400">Question *</label>
                          <Input
                            value={qForm.question}
                            onChange={(e) => setQForm({ ...qForm, question: e.target.value })}
                            placeholder="e.g. Explain the difference between useEffect and useLayoutEffect"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400">Expected Answer / Key Points</label>
                          <Input
                            value={qForm.expectedAnswer}
                            onChange={(e) => setQForm({ ...qForm, expectedAnswer: e.target.value })}
                            placeholder="What should the candidate cover?"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400">Difficulty</label>
                            <select
                              value={qForm.difficulty}
                              onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}
                              className="w-full h-9 rounded-lg border border-slate-700 bg-slate-900 text-sm text-white px-3"
                            >
                              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400">Time (minutes)</label>
                            <Input
                              type="number"
                              min={1}
                              max={30}
                              value={qForm.timeAllocation}
                              onChange={(e) => setQForm({ ...qForm, timeAllocation: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-500">Add Question</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingQ(null); setQuestionError(""); }}>Cancel</Button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-slate-700 hover:border-blue-500/50 hover:text-blue-400"
                      onClick={() => setAddingQ(bank.id)}
                    >
                      <Plus size={14} />
                      Add Question
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuestionBanksPage() {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-96 rounded-xl" /></div>}>
      <QuestionBanksContent />
    </Suspense>
  );
}
