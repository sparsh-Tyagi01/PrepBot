'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock, Code, PhoneOff, Video, VideoOff, Mic, X,
  Send, ChevronUp, ChevronDown, Loader2, MessagesSquare,
} from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import AIAvatar from '@/components/AIAvatar';
import UserVideo from '@/components/UserVideo';

interface InterviewSession {
  id: string;
  title: string;
  difficulty: string;
  duration: number;
  status: string;
  conversationLog?: ConversationMessage[];
  aiInterviewer: {
    id: string;
    name: string;
    personality: string;
    avatar: string;
    greetingMessage: string;
  };
  interviewType: { name: string; icon: string };
}

interface ConversationMessage {
  speaker: 'user' | 'ai';
  message: string;
  type: 'text' | 'code';
  timestamp: string;
}

export default function LiveInterviewPage() {
  const params    = useParams();
  const router    = useRouter();
  const sessionId = params.id as string;
  const logEndRef = useRef<HTMLDivElement>(null);

  /* ─── state ─── */
  const [session,          setSession]          = useState<InterviewSession | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [timeRemaining,    setTimeRemaining]    = useState(0);
  const [isWaitingForAI,   setIsWaitingForAI]   = useState(false);
  const [conversationLog,  setConversationLog]  = useState<ConversationMessage[]>([]);
  const [isAISpeaking,     setIsAISpeaking]     = useState(false);
  const [currentAIMessage, setCurrentAIMessage] = useState('');

  // Video controls
  const [isVideoOn,  setIsVideoOn]  = useState(true);

  // Speech recognition
  const [isRecording,       setIsRecording]       = useState(false);
  const [finalTranscript,   setFinalTranscript]   = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef     = useRef<any>(null);
  const isRecordingRef     = useRef(false);
  const autoListenRef      = useRef(true);   // auto-start mic after AI finishes
  const speechSilenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef     = useRef('');     // running final transcript for auto-submit
  const isAISpeakingRef    = useRef(false);  // stable ref for async callbacks
  const isWaitingForAIRef  = useRef(false);  // stable ref for async callbacks
  const timeWarningsSentRef = useRef(new Set<number>()); // tracks which thresholds already notified AI

  // Interview ending & silence detection
  const [isEnding,       setIsEnding]       = useState(false);
  const isEndingRef      = useRef(false);
  const hasRedirectedRef = useRef(false);
  const silenceTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeRemainingRef = useRef(0);

  // Audio unlock gate — browser blocks TTS unless called from a direct user gesture
  const [readyToStart, setReadyToStart] = useState(false);
  const pendingInitDataRef = useRef<InterviewSession | null>(null);

  // UI panels
  const [showTranscript, setShowTranscript] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [selectedLang,   setSelectedLang]   = useState('javascript');
  const [codeAnswer,     setCodeAnswer]     = useState('');
  const [errorBanner,    setErrorBanner]    = useState<string | null>(null);
  const [timeWarning,    setTimeWarning]    = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(null), 8000);
  };

  // Read error body safely — res.json() silently fails on 4xx in Turbopack
  const readErrorBody = async (res: Response): Promise<string> => {
    try {
      const text = await res.text();
      if (!text) return '';
      const json = JSON.parse(text);
      return json?.error ?? text;
    } catch {
      return '';
    }
  };

  /* ─── Timer ─── */
  useEffect(() => {
    if (!session || session.status !== 'in-progress') return;
    const t = setInterval(() => {
      setTimeRemaining(p => {
        const next = p - 1;
        timeRemainingRef.current = next;
        if (next <= 0) { clearInterval(t); if (!isEndingRef.current) handleEndInterview(); return 0; }
        if (isEndingRef.current) return next;
        // Show progressive warnings
        if (next === 120) setTimeWarning('⏰ 2 minutes remaining — wrap up your answer.');
        else if (next === 60) setTimeWarning('⚠️ 1 minute left! Interview ending soon.');
        else if (next === 300) setTimeWarning('🕐 5 minutes remaining.');
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Auto-dismiss time warnings
  useEffect(() => {
    if (!timeWarning) return;
    const t = setTimeout(() => setTimeWarning(null), 5000);
    return () => clearTimeout(t);
  }, [timeWarning]);

  /* ─── Silence detection ───
     After AI finishes a response, if the user stays silent for 45 s,
     the AI prompts them to continue or rephrase the question. */
  useEffect(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    // Only start silence timer when AI has finished, we're not waiting/recording/ending
    if (isAISpeaking || isWaitingForAI || isRecording || isEndingRef.current || conversationLog.length === 0) return;

    silenceTimerRef.current = setTimeout(async () => {
      if (isRecordingRef.current || isEndingRef.current) return;
      setIsWaitingForAI(true);
      try {
        const res = await fetch(`/api/interview-session/${sessionId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: '[SYSTEM_SILENCE]', type: 'text', timeRemainingSeconds: timeRemainingRef.current }),
        });
        if (res.ok) {
          const data = await res.json();
          setConversationLog(data.conversationLog);
          const last = data.conversationLog.at(-1);
          if (last?.speaker === 'ai') { setCurrentAIMessage(last.message); setIsAISpeaking(true); }
        }
      } finally { setIsWaitingForAI(false); }
    }, 45000);

    return () => { if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAISpeaking, isWaitingForAI, isRecording]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationLog]);

  /* ─── Init ─── */
  useEffect(() => {
    fetchSession();
    initSpeechRecognition();
    return () => { recognitionRef.current?.abort?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/interview-session/${sessionId}`);
      if (!res.ok) return router.push('/interview');
      const data: InterviewSession = await res.json();
      setSession(data);
      setTimeRemaining(data.duration * 60);
      timeRemainingRef.current = data.duration * 60;
      setConversationLog(data.conversationLog || []);
      if (data.status === 'pending') {
        await startSession();
        // Store session for init — need user click first to unlock TTS
        if (!data.conversationLog?.length) pendingInitDataRef.current = data;
      } else if (data.status === 'in-progress' && !data.conversationLog?.length) {
        pendingInitDataRef.current = data;
      } else {
        // Already has conversation — no init needed, mark ready immediately
        setReadyToStart(true);
      }
    } catch { router.push('/interview'); }
    finally  { setLoading(false); }
  };

  // Runs once the user clicks "Begin" — speech synthesis is now unlocked
  useEffect(() => {
    if (!readyToStart || !pendingInitDataRef.current) return;
    const data = pendingInitDataRef.current;
    pendingInitDataRef.current = null;
    initializeInterview(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToStart]);

  const handleBeginInterview = () => {
    // Speak a zero-volume inaudible utterance to unlock audio AND pre-load voices.
    // Do NOT call cancel() — that consumes the onvoiceschanged event, which breaks AIAvatar's
    // voice-selection fallback (it registers onvoiceschanged but it never fires again).
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const unlock = new SpeechSynthesisUtterance('\u00A0'); // non-breaking space
      unlock.volume = 0;
      unlock.rate = 10; // ultra-fast, inaudible
      window.speechSynthesis.speak(unlock);
    }
    setReadyToStart(true);
  };

  const startSession = async () => {
    const res = await fetch(`/api/interview-session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in-progress' }),
    });
    if (res.ok) setSession(await res.json());
  };

  const initializeInterview = async (data: InterviewSession) => {
    const greeting: ConversationMessage = {
      speaker: 'ai',
      message: data.aiInterviewer.greetingMessage,
      type: 'text',
      timestamp: new Date().toISOString(),
    };
    setConversationLog([greeting]);
    setCurrentAIMessage(greeting.message);
    setIsAISpeaking(true);
    await fetch(`/api/interview-session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationLog: [greeting] }),
    });
    setTimeout(sendInitialQuestion, 5000);
  };

  const sendInitialQuestion = async () => {
    setIsWaitingForAI(true);
    try {
      const res = await fetch(`/api/interview-session/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '[SYSTEM_INIT] Please ask your first interview question now.', type: 'text', timeRemainingSeconds: timeRemainingRef.current }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversationLog(data.conversationLog);
        const last = data.conversationLog.at(-1);
        if (last?.speaker === 'ai') { setCurrentAIMessage(last.message); setIsAISpeaking(true); }
      } else {
        const errMsg = (await readErrorBody(res)) || (res.status === 429
          ? 'AI quota exceeded — please wait a moment or use a new API key.'
          : 'The AI interviewer failed to start. Please refresh.');
        showError(errMsg);
      }
    } finally { setIsWaitingForAI(false); }
  };

  const handleEndInterview = async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    setIsEnding(true);
    recognitionRef.current?.stop?.();
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }

    // Ask AI to close the interview naturally
    try {
      setIsWaitingForAI(true);
      const res = await fetch(`/api/interview-session/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '[SYSTEM_END]', type: 'text', timeRemainingSeconds: timeRemainingRef.current }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversationLog(data.conversationLog);
        const last = data.conversationLog.at(-1);
        if (last?.speaker === 'ai') {
          setCurrentAIMessage(last.message);
          setIsAISpeaking(true);
          // onSpeakingComplete will call doRedirect; fallback after 8 s if TTS doesn't fire
          setTimeout(doRedirect, 8000);
          return;
        }
      }
    } catch {}
    finally { setIsWaitingForAI(false); }

    doRedirect();
  };

  const doRedirect = async () => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    // Ensure session is marked completed before proceeding
    await fetch(`/api/interview-session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    // Fire report generation now (non-blocking) so it starts before the page load
    fetch(`/api/interview-session/${sessionId}/generate-report`, { method: 'POST' }).catch(() => {});
    router.push(`/reports?sessionId=${sessionId}`);
  };

  /* ─── Submit verbal / code answer ─── */
  const submitAnswer = useCallback(async (msg: string, type: 'text' | 'code') => {
    if (!msg.trim() || isWaitingForAI) return;
    // Stop listening and clear all timers
    stopListening();
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    accumulatedRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');
    setIsWaitingForAI(true);
    try {
      const res = await fetch(`/api/interview-session/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, type, timeRemainingSeconds: timeRemainingRef.current }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversationLog(data.conversationLog);
        const last = data.conversationLog.at(-1);
        if (last?.speaker === 'ai') {
          setCurrentAIMessage(last.message);
          setIsAISpeaking(true);
          // Auto-open code editor when AI asks for code in a Technical Interview
          if (session?.interviewType?.name === 'Technical Interview') {
            const codeKeywords = ['code', 'write', 'implement', 'function', 'algorithm', 'solve', 'editor', 'program'];
            if (codeKeywords.some(kw => last.message.toLowerCase().includes(kw))) {
              setShowCodeEditor(true);
            }
          }
        }
        // If the AI terminated due to misbehavior, let the AI finish speaking then end
        if (data.misbehaviorAction === 'end') {
          autoListenRef.current = false;
          isEndingRef.current = true;
          setIsEnding(true);
          recognitionRef.current?.stop?.();
          setTimeout(doRedirect, 10000); // fallback redirect if TTS doesn't fire
        } else {
          // Auto-start listening right after state settles
          if (autoListenRef.current && !isEndingRef.current) {
            setTimeout(() => {
              if (!isEndingRef.current) startListening();
            }, 200);
          }
        }
        setCodeAnswer('');
      } else {
        const errMsg = (await readErrorBody(res)) || (res.status === 429
          ? 'AI quota exceeded — please wait a moment or use a new API key.'
          : 'The AI interviewer failed to respond. Please try again.');
        console.error('AI chat error:', res.status, errMsg);
        showError(errMsg);
      }
    } finally { setIsWaitingForAI(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWaitingForAI, sessionId, session]);

  // Keep submitAnswerRef in sync
  useEffect(() => { submitAnswerRef.current = submitAnswer; }, [submitAnswer]);

  // Sync boolean states to refs so async closures always read latest value
  useEffect(() => { isAISpeakingRef.current = isAISpeaking; }, [isAISpeaking]);
  useEffect(() => { isWaitingForAIRef.current = isWaitingForAI; }, [isWaitingForAI]);

  // Proactively notify the AI when time crosses 5 min / 2 min / 1 min thresholds
  useEffect(() => {
    const THRESHOLDS = [300, 120, 60];
    const hit = THRESHOLDS.find(t => timeRemaining === t);
    if (!hit || !session || isEndingRef.current) return;
    if (timeWarningsSentRef.current.has(hit)) return;
    timeWarningsSentRef.current.add(hit);
    // If AI is already mid-response the system prompt timePacing will cover it next turn
    if (isAISpeakingRef.current || isWaitingForAIRef.current) return;
    const minsLeft = Math.round(hit / 60);
    stopListening();
    setIsWaitingForAI(true);
    fetch(`/api/interview-session/${sessionId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `[SYSTEM_TIME_WARNING_${minsLeft}]`, type: 'text', timeRemainingSeconds: hit }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || isEndingRef.current) return;
        setConversationLog(data.conversationLog);
        const last = data.conversationLog.at(-1);
        if (last?.speaker === 'ai') { setCurrentAIMessage(last.message); setIsAISpeaking(true); }
      })
      .finally(() => setIsWaitingForAI(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  /* ─── Speech Recognition ─── */
  const initSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + ' ';
        else interim += t;
      }
      if (final) {
        accumulatedRef.current += final;
        setFinalTranscript(accumulatedRef.current);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }

      // Auto-submit: reset the silence timer on every speech event.
      // If the user stops speaking for 3 s after saying something, submit automatically.
      if (speechSilenceTimer.current) clearTimeout(speechSilenceTimer.current);
      if (accumulatedRef.current.trim()) {
        speechSilenceTimer.current = setTimeout(() => {
          const answer = accumulatedRef.current.trim();
          if (answer && isRecordingRef.current && !isEndingRef.current) {
            submitAnswerRef.current?.(answer, 'text');
          }
        }, 3000);
      }
    };
    r.onerror = (e: any) => {
      if (e.error !== 'no-speech') { setIsRecording(false); isRecordingRef.current = false; }
    };
    r.onend = () => {
      if (isRecordingRef.current) {
        try { r.start(); } catch {}
      }
    };
    recognitionRef.current = r;
  };

  // Keep a stable ref to submitAnswer so onresult closure can call it
  const submitAnswerRef = useRef<((msg: string, type: 'text' | 'code') => void) | null>(null);

  const startListening = () => {
    if (!recognitionRef.current || isRecordingRef.current || isEndingRef.current) return;
    accumulatedRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      isRecordingRef.current = true;
    } catch {}
  };

  const stopListening = () => {
    if (speechSilenceTimer.current) { clearTimeout(speechSilenceTimer.current); speechSilenceTimer.current = null; }
    if (!isRecordingRef.current) return;
    recognitionRef.current?.stop?.();
    setIsRecording(false);
    isRecordingRef.current = false;
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition requires Chrome or Edge browser.');
      return;
    }
    if (isRecordingRef.current) {
      stopListening();
    } else {
      if (isAISpeaking) return;
      startListening();
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const timerColor = (s: number) => {
    if (s <= 60)  return 'text-red-400 animate-pulse';
    if (s <= 120) return 'text-red-300';
    if (s <= 300) return 'text-amber-400';
    return 'text-white';
  };

  const timerBg = (s: number) => {
    if (s <= 120) return 'bg-red-900/60 border-red-500/50';
    if (s <= 300) return 'bg-amber-900/60 border-amber-500/50';
    return 'bg-black/50 border-slate-700';
  };

  /* ─── Loading / Error ─── */
  if (loading) return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto animate-pulse">
          <Video size={30} className="text-white" />
        </div>
        <p className="text-slate-400">Initializing interview room...</p>
      </div>
    </div>
  );

  if (!session) return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-slate-400">Session not found</p>
        <Button onClick={() => router.push('/interview')} className="bg-purple-600 hover:bg-purple-700">Back</Button>
      </div>
    </div>
  );

  // Audio-unlock gate — show before TTS is attempted
  if (!readyToStart && pendingInitDataRef.current) return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
          <Video size={30} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">{session.title}</h2>
        <p className="text-slate-400">Your interviewer is ready — click below to start the call with voice enabled.</p>
        <p className="text-xs text-slate-500 mt-1">{session.interviewType.name} · {session.difficulty} · {session.duration} min</p>
      </div>
      <button
        onClick={handleBeginInterview}
        className="px-10 py-4 rounded-2xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg shadow-xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95"
      >
        🎙 Begin Interview
      </button>
      <p className="text-xs text-slate-600">Make sure your speakers/headphones are on.</p>
    </div>
  );

  const hasAnswer = finalTranscript.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
      {/* ── Error banner ── */}
      {errorBanner && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
                         px-4 py-2.5 rounded-xl bg-red-900/90 border border-red-500/60 backdrop-blur-sm
                         shadow-xl text-sm text-red-200 max-w-lg w-[90%]">
          <span className="flex-1">{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} className="text-red-300 hover:text-white shrink-0 ml-1">✕</button>
        </div>
      )}
      {/* ── Time warning banner ── */}
      {timeWarning && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-49 flex items-center gap-2
                         px-4 py-2.5 rounded-xl bg-amber-900/90 border border-amber-500/60 backdrop-blur-sm
                         shadow-xl text-sm text-amber-200 max-w-lg w-[90%]">
          <span className="flex-1">{timeWarning}</span>
          <button onClick={() => setTimeWarning(null)} className="text-amber-300 hover:text-white shrink-0 ml-1">✕</button>
        </div>
      )}
      {/* ── Timer progress bar ── */}
      <div className="absolute top-13 left-0 right-0 z-20 h-0.75 bg-slate-800">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            timeRemaining <= 60  ? 'bg-red-500' :
            timeRemaining <= 300 ? 'bg-amber-400' :
            'bg-green-500'
          }`}
          style={{ width: session ? `${(timeRemaining / (session.duration * 60)) * 100}%` : '100%' }}
        />
      </div>
      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3
                       bg-linear-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">● LIVE</Badge>
          <span className="text-white font-semibold text-sm">{session.title}</span>
          <span className="text-slate-400 text-xs">· {session.interviewType.name}</span>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          {isWaitingForAI && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
              <Loader2 size={13} className="animate-spin text-purple-400" />
              <span className="text-purple-300 text-xs">AI thinking...</span>
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border transition-colors duration-500 ${timerBg(timeRemaining)}`}>
            <Clock size={13} className={timeRemaining <= 300 ? 'text-amber-400' : 'text-purple-400'} />
            <span className={`text-sm font-mono font-semibold ${timerColor(timeRemaining)}`}>{formatTime(timeRemaining)}</span>
            <span className="text-slate-400 text-xs ml-1">/ {Math.floor((session.duration * 60) / 60)}m</span>
          </div>
        </div>
      </div>

      {/* ── Main 2-panel video area ── */}
      <div className="flex-1 relative flex">
        {/* AI Avatar - large panel */}
        <div className="flex-1 relative">
          <AIAvatar
            name={session.aiInterviewer.name}
            personality={session.aiInterviewer.personality}
            avatar={session.aiInterviewer.avatar}
            isSpeaking={isAISpeaking}
            text={currentAIMessage}
            onSpeakingComplete={() => {
              setIsAISpeaking(false);
              if (isEndingRef.current) { doRedirect(); return; }
              // Auto-start mic once AI finishes speaking
              if (autoListenRef.current) setTimeout(() => startListening(), 300);
            }}
          />

        </div>

        {/* User PiP - fixed bottom-right */}
        <div className="absolute bottom-28 right-5 w-52 aspect-video rounded-xl overflow-hidden
                         shadow-2xl border border-white/10 z-20">
          <UserVideo
            isVideoOn={isVideoOn}
            isAudioOn={true}
            onToggleVideo={() => setIsVideoOn(v => !v)}
            onToggleAudio={() => {}}
          />
        </div>
      </div>

      {/* ── Mic area (center-bottom) — main interaction ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center pb-6 pt-2
                       bg-linear-to-t from-black/90 via-black/60 to-transparent pointer-events-none">

        {/* Transcript bubble */}
        {(finalTranscript || interimTranscript) && (
          <div className="mb-3 max-w-xl w-[90%] pointer-events-auto">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-800/90 backdrop-blur-sm border border-slate-600 text-sm text-white">
              {finalTranscript}
              <span className="text-slate-400 italic">{interimTranscript}</span>
            </div>
          </div>
        )}

        {/* Controls row */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Camera */}
          <button
            onClick={() => setIsVideoOn(v => !v)}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all
              ${isVideoOn ? 'bg-slate-800/80 border-slate-600 hover:border-slate-500' : 'bg-red-600/80 border-red-500'}`}
          >
            {isVideoOn ? <Video size={20} className="text-white" /> : <VideoOff size={20} className="text-white" />}
          </button>

          {/* ★ Main MIC button — tap to manually stop/start */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleRecording}
              disabled={isAISpeaking || isWaitingForAI}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl
                ${isRecording
                  ? 'bg-red-600 border-2 border-red-400 record-pulse scale-110'
                  : isAISpeaking || isWaitingForAI
                    ? 'bg-slate-700/50 border border-slate-600 opacity-50 cursor-not-allowed'
                    : 'bg-linear-to-br from-purple-600 to-blue-600 border-2 border-purple-400/50 hover:scale-105 glow-purple'
                }`}
            >
              <Mic size={32} className="text-white" />
            </button>
            <span className="text-xs text-slate-400">
              {isRecording
                ? finalTranscript ? 'Submitting soon…' : 'Listening…'
                : isAISpeaking ? 'AI speaking…'
                : isWaitingForAI ? 'Processing…'
                : 'Auto-listening'}
            </span>
          </div>

          {/* Manual send — only visible when there's text (fallback) */}
          {finalTranscript.trim() && !isWaitingForAI && (
            <button
              onClick={() => submitAnswer(finalTranscript, 'text')}
              className="w-12 h-12 rounded-full flex items-center justify-center border transition-all bg-green-600/80 border-green-500 hover:bg-green-600"
            >
              <Send size={20} className="text-white" />
            </button>
          )}

          {/* Code editor toggle */}
          <button
            onClick={() => setShowCodeEditor(c => !c)}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all
              ${showCodeEditor
                ? 'bg-blue-600/80 border-blue-500'
                : 'bg-slate-800/80 border-slate-600 hover:border-slate-500'}`}
          >
            <Code size={20} className="text-white" />
          </button>

          {/* Transcript panel toggle */}
          <button
            onClick={() => setShowTranscript(t => !t)}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all
              ${showTranscript
                ? 'bg-purple-600/80 border-purple-500'
                : 'bg-slate-800/80 border-slate-600 hover:border-slate-500'}`}
          >
            <MessagesSquare size={20} className="text-white" />
          </button>

          {/* End call */}
          <button
            onClick={handleEndInterview}
            disabled={isEnding}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 shadow-lg ${
              isEnding ? 'bg-slate-700 border-slate-600 opacity-50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 border-red-500'
            }`}
          >
            <PhoneOff size={22} className="text-white" />
          </button>
        </div>
      </div>

      {/* ── Code Editor Panel (conditional mount so Monaco initializes correctly) ── */}
      {showCodeEditor && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700"
             style={{ height: '55vh' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <Code size={16} className="text-blue-400" />
              <span className="text-white font-semibold text-sm">Code Editor</span>
              <select
                value={selectedLang}
                onChange={e => setSelectedLang(e.target.value)}
                className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
              >
                {['javascript','typescript','python','java','cpp','go','rust'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => submitAnswer(codeAnswer, 'code')}
                disabled={!codeAnswer.trim() || isWaitingForAI}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs h-7 px-3"
              >
                <Send size={12} className="mr-1" /> Submit Code
              </Button>
              <button onClick={() => setShowCodeEditor(false)} className="text-slate-400 hover:text-white p-1">
                <ChevronDown size={18} />
              </button>
            </div>
          </div>
          <CodeEditor
            key="live-code-editor"
            language={selectedLang}
            onChange={v => setCodeAnswer(v || '')}
            onRun={(code) => setCodeAnswer(code)}
            height="calc(55vh - 44px)"
          />
        </div>
      )}

      {/* ── Transcript Side Panel ── */}
      <div className={`fixed top-0 right-0 bottom-0 z-40 w-80 bg-slate-900/95 backdrop-blur-xl
                        border-l border-slate-700/50 transition-transform duration-300
                        ${showTranscript ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <span className="text-white font-semibold text-sm">Interview Transcript</span>
          <button onClick={() => setShowTranscript(false)} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 h-[calc(100vh-52px)]">
          {conversationLog.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Interview not started yet</p>
          ) : conversationLog.map((msg, i) => (
            <div key={i}
              className={`rounded-xl p-3 text-sm ${
                msg.speaker === 'ai'
                  ? 'bg-purple-500/10 border border-purple-500/20'
                  : 'bg-blue-500/10 border border-blue-500/20'
              }`}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${msg.speaker === 'ai' ? 'bg-purple-400' : 'bg-blue-400'}`} />
                <span className="text-xs font-semibold text-slate-300">
                  {msg.speaker === 'ai' ? session.aiInterviewer.name : 'You'}
                </span>
                {msg.type === 'code' && (
                  <Badge variant="outline" className="text-xs py-0 px-1 h-4 border-blue-500/30 text-blue-400">code</Badge>
                )}
              </div>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* ── Wrap-up overlay — shown while AI says goodbye ── */}
      {isEnding && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center space-y-3">
            <Loader2 size={36} className="animate-spin text-purple-400 mx-auto" />
            <p className="text-white font-semibold text-lg">Wrapping up your interview...</p>
            <p className="text-slate-400 text-sm">Your interviewer is closing the session. Please wait.</p>
          </div>
        </div>
      )}
    </div>
  );
}
