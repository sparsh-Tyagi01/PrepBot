'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code2, MessageSquare, Briefcase, Network, BarChart2, ChevronRight, Loader2, Clock, Zap, Globe, Building2, Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import AIAvatar from '@/components/AIAvatar';

// Fixed interviewer per interview type — names match prisma/seed.ts exactly
const TYPE_INTERVIEWER_MAP: Record<string, string> = {
  'Technical Interview':    'Alex Rodriguez',
  'Behavioral Interview':   'Maya Patel',
  'HR Interview':           'Sarah Chen',
  'System Design':          'Dr. James Mitchell',
  'Case Study':             'Dr. Emily Watson',
};

const TYPE_META: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  from: string; to: string; description: string;
}> = {
  'Technical Interview':  { icon: Code2,        from: 'from-violet-600', to: 'to-blue-600',   description: 'Algorithms, data structures & coding problems' },
  'Behavioral Interview': { icon: MessageSquare, from: 'from-cyan-600',   to: 'to-blue-600',   description: 'STAR method, leadership & soft skills' },
  'HR Interview':         { icon: Briefcase,    from: 'from-teal-600',   to: 'to-cyan-600',   description: 'Culture fit, values & career goals' },
  'System Design':        { icon: Network,      from: 'from-purple-600', to: 'to-indigo-600', description: 'Scalable architectures & distributed systems' },
  'Case Study':           { icon: BarChart2,    from: 'from-rose-600',   to: 'to-pink-600',   description: 'Business analysis & strategic thinking' },
};

interface AIInterviewer {
  id: string;
  name: string;
  personality: string;
  description: string;
  avatar: string;
  expertise: string[];
  greetingMessage: string;
}

interface InterviewType {
  id: string;
  name: string;
  description: string;
  icon: string;
  isGlobal: boolean;
  duration: number | null;
  difficulty: string | null;
  requireResume: boolean;
}

export default function StartInterviewPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step,                setStep]                = useState<'type' | 'details'>('type');
  const [interviewTypes,      setInterviewTypes]      = useState<InterviewType[]>([]);
  const [aiInterviewers,      setAIInterviewers]      = useState<AIInterviewer[]>([]);
  const [selectedType,        setSelectedType]        = useState<InterviewType | null>(null);
  const [assignedInterviewer, setAssignedInterviewer] = useState<AIInterviewer | null>(null);
  const [difficulty,          setDifficulty]          = useState<'easy' | 'medium' | 'hard'>('medium');
  const [duration,            setDuration]            = useState<number>(30);
  const [loading,             setLoading]             = useState(false);
  const [isSpeaking,          setIsSpeaking]          = useState(false);
  const [dataReady,           setDataReady]           = useState(false);

  // Resume state
  const [resumeFile,          setResumeFile]          = useState<File | null>(null);
  const [resumeText,          setResumeText]          = useState<string | null>(null);
  const [resumeParsing,       setResumeParsing]       = useState(false);
  const [resumeError,         setResumeError]         = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/interview/start');
      return;
    }
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/interview-types').then(r => r.json()),
        fetch('/api/ai-interviewers').then(r => r.json()),
      ]).then(([types, interviewers]) => {
        setInterviewTypes(Array.isArray(types) ? types : []);
        setAIInterviewers(Array.isArray(interviewers) ? interviewers : []);
        setDataReady(true);
      }).catch(console.error);
    }
  }, [status, router]);

  const handleSelectType = (type: InterviewType) => {
    const targetName = TYPE_INTERVIEWER_MAP[type.name];
    const matched = aiInterviewers.find(i => i.name === targetName)
      ?? aiInterviewers.find(i => i.expertise?.includes('Technical'))
      ?? aiInterviewers[0]
      ?? null;
    setSelectedType(type);
    setAssignedInterviewer(matched);
    // Reset resume when switching type
    setResumeFile(null);
    setResumeText(null);
    setResumeError(null);
    // If the type has a fixed duration, lock in that value
    if (type.duration) setDuration(type.duration);
    // If the type has a fixed difficulty, lock in that value
    if (type.difficulty) setDifficulty(type.difficulty as 'easy' | 'medium' | 'hard');
    setStep('details');
    // Slight delay so AIAvatar mounts before speaking starts
    setTimeout(() => setIsSpeaking(true), 600);
    // isSpeaking is turned off by onSpeakingComplete callback — no hard timeout
  };

  const handleResumeUpload = async (file: File) => {
    setResumeFile(file);
    setResumeError(null);
    setResumeText(null);
    setResumeParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/resume/parse', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setResumeError(data.error ?? 'Failed to parse resume');
        setResumeFile(null);
      } else {
        setResumeText(data.text);
      }
    } catch {
      setResumeError('Failed to read resume. Please try a different file.');
      setResumeFile(null);
    } finally {
      setResumeParsing(false);
    }
  };

  const clearResume = () => {
    setResumeFile(null);
    setResumeText(null);
    setResumeError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartInterview = async () => {
    if (!selectedType || !assignedInterviewer) return;

    // Enforce resume requirement
    const needsResume = selectedType.isGlobal || selectedType.requireResume;
    if (needsResume && !resumeText) {
      setResumeError('Please upload your resume before starting.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/interview-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewTypeId: selectedType.id,
          aiInterviewerId: assignedInterviewer.id,
          title: `${selectedType.name} Interview`,
          difficulty,
          duration,
          resumeText: resumeText ?? undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/interview/${data.id}`);
      } else if (res.status === 401) {
        router.push('/login?callbackUrl=/interview/start');
      } else {
        alert('Failed to create session. Please try again.');
      }
    } catch {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && !dataReady)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Start Interview</h1>
        <p className="text-slate-400">
          {step === 'type'
            ? 'Select the type of interview you want to practice.'
            : `You will be interviewed by ${assignedInterviewer?.name}. Configure your session below.`}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Step 1: Choose type */}
        {step === 'type' && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-10"
          >
            {/* Loading skeletons */}
            {interviewTypes.length === 0 && (
              <div className="grid sm:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-40 rounded-2xl bg-slate-800/40 animate-pulse" />
                ))}
              </div>
            )}

            {/* ── General Interviews ───────────────────────────── */}
            {interviewTypes.some(t => t.isGlobal) && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Globe size={15} className="text-purple-400" />
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">General Interviews</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  {interviewTypes.filter(t => t.isGlobal).map(type => {
                    const meta = TYPE_META[type.name];
                    const Icon = meta?.icon ?? Code2;
                    return (
                      <motion.button
                        key={type.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectType(type)}
                        className="group relative text-left p-6 rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-purple-500/50 transition-all overflow-hidden"
                      >
                        <div className={`absolute inset-0 bg-linear-to-br ${meta?.from ?? 'from-purple-600'} ${meta?.to ?? 'to-blue-600'} opacity-0 group-hover:opacity-5 transition-opacity`} />
                        <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${meta?.from ?? 'from-purple-600'} ${meta?.to ?? 'to-blue-600'} flex items-center justify-center mb-4 shadow-lg`}>
                          <Icon size={24} className="text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">{type.name}</h3>
                        <p className="text-sm text-slate-400 mb-4">{meta?.description ?? type.description}</p>
                        <div className="flex items-center gap-1 text-purple-400 text-sm font-medium">
                          Select <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Institution Interviews ───────────────────────── */}
            {interviewTypes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Building2 size={15} className="text-amber-400" />
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Your Institution</h2>
                </div>
                {interviewTypes.some(t => !t.isGlobal) ? (
                  <div className="grid sm:grid-cols-2 gap-5">
                    {interviewTypes.filter(t => !t.isGlobal).map(type => (
                      <motion.button
                        key={type.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectType(type)}
                        className="group relative text-left p-6 rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-amber-500/50 transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-linear-to-br from-amber-600 to-orange-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-amber-500/30 flex items-center justify-center mb-4 shadow-lg text-2xl">
                          {type.icon ?? '📋'}
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">{type.name}</h3>
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{type.description ?? 'Custom interview from your institution'}</p>
                        <div className="flex items-center gap-2">
                          {type.difficulty && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                              type.difficulty === 'easy' ? 'border-green-500/40 text-green-400 bg-green-500/10' :
                              type.difficulty === 'hard' ? 'border-red-500/40 text-red-400 bg-red-500/10' :
                              'border-amber-500/40 text-amber-400 bg-amber-500/10'
                            }`}>{type.difficulty}</span>
                          )}
                          {type.duration && (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-blue-500/40 text-blue-400 bg-blue-500/10 font-medium">{type.duration}m</span>
                          )}
                          <span className="ml-auto flex items-center gap-1 text-amber-400 text-sm font-medium">
                            Select <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700/60 p-8 text-center">
                    <Building2 size={28} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">No custom interviews yet</p>
                    <p className="text-slate-600 text-xs mt-1">Join an institution or ask your admin to create custom interview types for your branch.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Avatar preview + session config */}
        {step === 'details' && selectedType && assignedInterviewer && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Left: Interviewer avatar */}
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden" style={{ height: 380 }}>
                  <AIAvatar
                    name={assignedInterviewer.name}
                    personality={assignedInterviewer.personality}
                    avatar={assignedInterviewer.avatar}
                    isSpeaking={isSpeaking}
                    text={assignedInterviewer.greetingMessage}
                    onSpeakingComplete={() => setIsSpeaking(false)}
                  />
                </div>
                <div className="glass-card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold text-white">{assignedInterviewer.name}</p>
                    <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/25 text-xs">
                      {assignedInterviewer.personality}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 italic">
                    &ldquo;{assignedInterviewer.greetingMessage.slice(0, 130)}&hellip;&rdquo;
                  </p>
                </div>
              </div>

              {/* Right: Settings */}
              <div className="space-y-5">
                {/* Selected type */}
                <div className="glass-card p-5">
                  {(() => {
                    const meta = TYPE_META[selectedType.name];
                    const Icon = meta?.icon ?? Code2;
                    return (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl bg-linear-to-br ${meta?.from ?? 'from-purple-600'} ${meta?.to ?? 'to-blue-600'} flex items-center justify-center shrink-0`}
                        >
                          <Icon size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white">{selectedType.name}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {meta?.description ?? selectedType.description}
                          </p>
                        </div>
                        <button
                          onClick={() => { setStep('type'); setAssignedInterviewer(null); }}
                          className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 shrink-0"
                        >
                          Change
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Difficulty */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={16} className="text-amber-400" />
                    <p className="font-semibold text-white text-sm">Difficulty</p>
                  </div>
                  {selectedType.difficulty ? (
                    <div className="flex items-center gap-2 py-2">
                      <span className={`text-sm font-medium ${
                        selectedType.difficulty === 'easy' ? 'text-green-400' :
                        selectedType.difficulty === 'hard' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        ⚡ Fixed by your institution: {selectedType.difficulty.charAt(0).toUpperCase() + selectedType.difficulty.slice(1)}
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {(['easy', 'medium', 'hard'] as const).map(level => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                            difficulty === level
                              ? level === 'easy'
                                ? 'bg-green-600/20 border-green-500 text-green-300'
                                : level === 'medium'
                                ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                                : 'bg-red-600/20 border-red-500 text-red-300'
                              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-400" />
                      <p className="font-semibold text-white text-sm">Duration</p>
                    </div>
                    <span className="text-purple-300 font-bold">{duration} min</span>
                  </div>
                  {selectedType.duration ? (
                    <div className="flex items-center gap-2 py-2">
                      <span className="text-sm text-amber-400 font-medium">⏱ Fixed by your institution: {selectedType.duration} min</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {[15, 30, 45, 60].map(mins => (
                        <button
                          key={mins}
                          onClick={() => setDuration(mins)}
                          className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                            duration === mins
                              ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resume Upload — mandatory for global types, optional but visible for institution types that require it */}
                {(selectedType.isGlobal || selectedType.requireResume) && (
                  <div className={`glass-card p-5 ${resumeError && !resumeText ? 'border border-red-500/50' : ''}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-green-400" />
                      <p className="font-semibold text-white text-sm">Resume Upload</p>
                      <span className="ml-auto text-xs text-red-400 font-medium">Required</span>
                    </div>

                    {resumeText ? (
                      /* Uploaded successfully */
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-green-600/10 border border-green-500/30">
                        <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-green-300 font-medium truncate">{resumeFile?.name}</p>
                          <p className="text-xs text-slate-400">{Math.ceil(resumeText.length / 4)} tokens extracted</p>
                        </div>
                        <button onClick={clearResume} className="text-slate-500 hover:text-slate-300 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      /* Upload area */
                      <label
                        className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                          resumeParsing
                            ? 'border-purple-500/50 bg-purple-500/5'
                            : 'border-slate-600 hover:border-purple-500/60 hover:bg-purple-500/5'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.txt"
                          className="hidden"
                          disabled={resumeParsing}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleResumeUpload(f);
                          }}
                        />
                        {resumeParsing ? (
                          <Loader2 size={24} className="animate-spin text-purple-400" />
                        ) : (
                          <Upload size={24} className="text-slate-400" />
                        )}
                        <p className="text-sm text-slate-300 font-medium">
                          {resumeParsing ? 'Reading resume…' : 'Click to upload resume'}
                        </p>
                        <p className="text-xs text-slate-500">PDF or TXT · Max 5 MB</p>
                      </label>
                    )}

                    {resumeError && !resumeText && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
                        <AlertCircle size={13} />
                        {resumeError}
                      </div>
                    )}

                    <p className="text-xs text-slate-500 mt-2">
                      Your resume helps the interviewer ask personalised, relevant questions about your actual experience.
                    </p>
                  </div>
                )}

                {/* Start */}
                <Button
                  onClick={handleStartInterview}
                  disabled={loading || resumeParsing || ((selectedType.isGlobal || selectedType.requireResume) && !resumeText)}
                  className="w-full h-12 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Starting...' : (selectedType.isGlobal || selectedType.requireResume) && !resumeText ? 'Upload Resume to Continue' : 'Start Interview ->'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
