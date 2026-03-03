"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, X, ChevronDown, ChevronRight } from "lucide-react";

interface Question {
  id: string;
  question: string;
  difficulty: string;
  timeAllocation: number;
}

interface QuestionBank {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
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
  const [bankForm, setBankForm] = useState({ name: "", description: "", interviewTypeId: filterTypeId ?? "", difficulty: "medium" });
  const [qForm, setQForm] = useState({ question: "", expectedAnswer: "", difficulty: "medium", timeAllocation: 5 });
  const [addingQ, setAddingQ] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [questionError, setQuestionError] = useState("");

  // Fetch interview types for dropdown
  const [interviewTypes, setInterviewTypes] = useState<{ id: string; name: string; icon: string | null }[]>([]);

  useEffect(() => {
    const url = filterTypeId
      ? `/api/institution/question-banks?typeId=${filterTypeId}`
      : "/api/institution/question-banks";

    Promise.all([
      fetch(url).then((r) => r.json()),
      fetch("/api/institution/interviews").then((r) => r.json()),
    ]).then(([banksData, typesData]) => {
      setBanks(banksData.questionBanks ?? []);
      setInterviewTypes(typesData.interviewTypes?.filter((t: { isGlobal: boolean }) => !t.isGlobal) ?? []);
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
    setBankForm({ name: "", description: "", interviewTypeId: filterTypeId ?? "", difficulty: "medium" });
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
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500" disabled={creatingBank}>
                {creatingBank ? "Creating..." : "Create Bank"}
              </Button>
            </form>
          </CardContent>
        </Card>
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
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => toggleBank(bank.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <BookOpen size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{bank.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{bank.interviewType.icon} {bank.interviewType.name}</span>
                      <span className="text-slate-700">·</span>
                      <Badge variant="outline" className="text-xs border-slate-700 text-slate-400 py-0">
                        {bank.difficulty}
                      </Badge>
                      <span className="text-slate-700">·</span>
                      <span className="text-xs text-slate-400">{bank._count.questions} questions</span>
                    </div>
                  </div>
                </div>
                {expandedBank === bank.id ? (
                  <ChevronDown size={18} className="text-slate-400" />
                ) : (
                  <ChevronRight size={18} className="text-slate-400" />
                )}
              </div>

              {expandedBank === bank.id && (
                <div className="border-t border-slate-800 p-5 space-y-4">
                  {/* Questions list */}
                  <div className="space-y-2">
                    {(bankQuestions[bank.id] ?? []).map((q, i) => (
                      <div key={q.id} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl">
                        <span className="text-xs text-slate-500 mt-0.5 w-5 shrink-0">{i + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm text-slate-200">{q.question}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs border-slate-700 text-slate-500 py-0">
                            {q.difficulty}
                          </Badge>
                          <span className="text-xs text-slate-500">{q.timeAllocation}m</span>
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
