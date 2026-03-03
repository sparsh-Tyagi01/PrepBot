'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code2, MessageSquare, Briefcase, Network, BarChart2, ChevronRight, Loader2, Clock, Zap } from 'lucide-react';
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
    setStep('details');
    // Slight delay so AIAvatar mounts before speaking starts
    setTimeout(() => setIsSpeaking(true), 600);
    // isSpeaking is turned off by onSpeakingComplete callback — no hard timeout
  };

  const handleStartInterview = async () => {
    if (!selectedType || !assignedInterviewer) return;
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
        <h1 className="text-4xl font-bold text-white mb-2">Start Interview</h1>
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
          >
            <div className="grid sm:grid-cols-2 gap-5">
              {interviewTypes.length === 0
                ? [1, 2, 3, 4].map(i => (
                    <div key={i} className="h-40 rounded-2xl bg-slate-800/40 animate-pulse" />
                  ))
                : interviewTypes.map(type => {
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
                        <div
                          className={`absolute inset-0 bg-linear-to-br ${meta?.from ?? 'from-purple-600'} ${meta?.to ?? 'to-blue-600'} opacity-0 group-hover:opacity-5 transition-opacity`}
                        />
                        <div
                          className={`w-12 h-12 rounded-2xl bg-linear-to-br ${meta?.from ?? 'from-purple-600'} ${meta?.to ?? 'to-blue-600'} flex items-center justify-center mb-4 shadow-lg`}
                        >
                          <Icon size={24} className="text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">{type.name}</h3>
                        <p className="text-sm text-slate-400 mb-4">
                          {meta?.description ?? type.description}
                        </p>
                        <div className="flex items-center gap-1 text-purple-400 text-sm font-medium">
                          Select
                          <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.button>
                    );
                  })}
            </div>
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
                </div>

                {/* Start */}
                <Button
                  onClick={handleStartInterview}
                  disabled={loading}
                  className="w-full h-12 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl text-base"
                >
                  {loading ? 'Starting...' : 'Start Interview ->'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
