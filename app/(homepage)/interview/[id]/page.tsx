'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock, Code, PhoneOff, Video, VideoOff, Volume2, X,
  Send, ChevronDown, Loader2, MessagesSquare, Mic, MicOff,
} from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import { SimliAvatar } from '@/components/VoiceInterview';
import { useVapiSession, ConversationMessage } from '@/components/VoiceInterview/useVapiSession';
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

export default function LiveInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const logEndRef = useRef<HTMLDivElement>(null);

  /* ─── State ─── */
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Video controls
  const [isVideoOn, setIsVideoOn] = useState(true);

  // UI panels
  const [showTranscript, setShowTranscript] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [codeAnswer, setCodeAnswer] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);

  // Interview ending
  const [isEnding, setIsEnding] = useState(false);
  const isEndingRef = useRef(false);
  const hasRedirectedRef = useRef(false);
  const timeRemainingRef = useRef(0);

  // Audio unlock gate
  const [readyToStart, setReadyToStart] = useState(false);
  const pendingInitDataRef = useRef<InterviewSession | null>(null);

  // Vapi session
  const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_KEY || '';
  const {
    isConnected,
    isCallActive,
    isMuted,
    currentSpeaker,
    transcript,
    volumeLevel,
    error: vapiError,
    startInterview,
    endInterview,
    toggleMute,
    sendMessage,
  } = useVapiSession({
    publicKey: vapiPublicKey,
    sessionId,
    interviewerName: session?.aiInterviewer?.name || 'Sarah',
    interviewType: session?.interviewType?.name || 'Interview',
    onCallStart: () => {
      console.log('[Interview] Call started');
    },
    onCallEnd: () => {
      console.log('[Interview] Call ended');
      if (!hasRedirectedRef.current) {
        doRedirect();
      }
    },
    onError: (error) => {
      console.error('[Interview] Vapi error:', error);
      if (error.message?.includes('API key')) {
        showError('Vapi API key not configured. Please add NEXT_PUBLIC_VAPI_KEY to your environment.');
      } else {
        showError(`Voice connection error: ${error.message || 'Please check your microphone.'}`);
      }
    },
  });

  const showError = (msg: string) => {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(null), 8000);
  };

  /* ─── Timer ─── */
  useEffect(() => {
    if (!session || session.status !== 'in-progress') return;
    const t = setInterval(() => {
      setTimeRemaining((p) => {
        const next = p - 1;
        timeRemainingRef.current = next;
        if (next <= 0) {
          clearInterval(t);
          if (!isEndingRef.current) handleEndInterview();
          return 0;
        }
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

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  /* ─── Init ─── */
  useEffect(() => {
    fetchSession();
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
      if (data.status === 'pending') {
        await startSession();
        pendingInitDataRef.current = data;
      } else if (data.status === 'in-progress' && !data.conversationLog?.length) {
        pendingInitDataRef.current = data;
      } else {
        setReadyToStart(true);
      }
    } catch {
      router.push('/interview');
    } finally {
      setLoading(false);
    }
  };

  // Runs once the user clicks "Begin"
  useEffect(() => {
    if (!readyToStart || !session || !pendingInitDataRef.current) return;
    pendingInitDataRef.current = null;
    // Start the Vapi call
    startInterview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToStart, session]);

  const handleBeginInterview = () => {
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

  const handleEndInterview = async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    setIsEnding(true);

    try {
      await endInterview();
      // Give time for Vapi to say goodbye
      setTimeout(doRedirect, 5000);
    } catch {
      doRedirect();
    }
  };

  const doRedirect = async () => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    // Ensure session is marked completed
    await fetch(`/api/interview-session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    // Fire report generation
    fetch(`/api/interview-session/${sessionId}/generate-report`, { method: 'POST' }).catch(() => {});
    router.push(`/reports?sessionId=${sessionId}`);
  };

  /* ─── Submit code answer ─── */
  const submitCode = useCallback(
    (code: string) => {
      if (!code.trim() || !isCallActive) return;
      sendMessage(`Here is my code solution:\n\`\`\`\n${code}\n\`\`\``, 'user');
      setCodeAnswer('');
    },
    [isCallActive, sendMessage]
  );

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const timerColor = (s: number) => {
    if (s <= 60) return 'text-red-400 animate-pulse';
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
  if (loading)
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto animate-pulse">
            <Video size={30} className="text-white" />
          </div>
          <p className="text-slate-400">Initializing interview room...</p>
        </div>
      </div>
    );

  if (!session)
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-400">Session not found</p>
          <Button onClick={() => router.push('/interview')} className="bg-purple-600 hover:bg-purple-700">
            Back
          </Button>
        </div>
      </div>
    );

  // Audio-unlock gate
  if (!readyToStart && pendingInitDataRef.current)
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-8 p-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <Video size={30} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">{session.title}</h2>
          <p className="text-slate-400">Your interviewer is ready — click below to start the call with voice enabled.</p>
          <p className="text-xs text-slate-500 mt-1">
            {session.interviewType.name} · {session.difficulty} · {session.duration} min
          </p>
        </div>
        <button
          onClick={handleBeginInterview}
          className="px-10 py-4 rounded-2xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg shadow-xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95"
        >
          🎙 Begin Interview
        </button>
        <p className="text-xs text-slate-600">Make sure your speakers/headphones and microphone are on.</p>
      </div>
    );

  const isSpeaking = currentSpeaker === 'assistant';
  const isUserSpeaking = currentSpeaker === 'user';

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
      {/* ── Error banner ── */}
      {(errorBanner || vapiError) && (
        <div
          className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
                       px-4 py-2.5 rounded-xl bg-red-900/90 border border-red-500/60 backdrop-blur-sm
                       shadow-xl text-sm text-red-200 max-w-lg w-[90%]"
        >
          <span className="flex-1">{errorBanner || vapiError?.message}</span>
          <button onClick={() => setErrorBanner(null)} className="text-red-300 hover:text-white shrink-0 ml-1">
            ✕
          </button>
        </div>
      )}

      {/* ── Time warning banner ── */}
      {timeWarning && (
        <div
          className="absolute top-18 left-1/2 -translate-x-1/2 z-49 flex items-center gap-2
                       px-4 py-2.5 rounded-xl bg-amber-900/90 border border-amber-500/60 backdrop-blur-sm
                       shadow-xl text-sm text-amber-200 max-w-lg w-[90%]"
        >
          <span className="flex-1">{timeWarning}</span>
          <button onClick={() => setTimeWarning(null)} className="text-amber-300 hover:text-white shrink-0 ml-1">
            ✕
          </button>
        </div>
      )}

      {/* ── Timer progress bar ── */}
      <div className="absolute top-13 left-0 right-0 z-20 h-0.75 bg-slate-800">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            timeRemaining <= 60
              ? 'bg-red-500'
              : timeRemaining <= 300
              ? 'bg-amber-400'
              : 'bg-green-500'
          }`}
          style={{ width: session ? `${(timeRemaining / (session.duration * 60)) * 100}%` : '100%' }}
        />
      </div>

      {/* ── Top bar ── */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3
                     bg-linear-to-b from-black/70 to-transparent pointer-events-none"
      >
        <div className="flex items-center gap-3 pointer-events-auto">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">● LIVE</Badge>
          <span className="text-white font-semibold text-sm">{session.title}</span>
          <span className="text-slate-400 text-xs">· {session.interviewType.name}</span>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          {!isConnected && isCallActive && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
              <Loader2 size={13} className="animate-spin text-yellow-400" />
              <span className="text-yellow-300 text-xs">Connecting...</span>
            </div>
          )}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border transition-colors duration-500 ${timerBg(
              timeRemaining
            )}`}
          >
            <Clock size={13} className={timeRemaining <= 300 ? 'text-amber-400' : 'text-purple-400'} />
            <span className={`text-sm font-mono font-semibold ${timerColor(timeRemaining)}`}>
              {formatTime(timeRemaining)}
            </span>
            <span className="text-slate-400 text-xs ml-1">/ {Math.floor((session.duration * 60) / 60)}m</span>
          </div>
        </div>
      </div>

      {/* ── Main 2-panel video area ── */}
      <div className="flex-1 relative flex">
        {/* AI Avatar - large panel */}
        <div className="flex-1 relative">
          <SimliAvatar
            name={session.aiInterviewer.name}
            personality={session.aiInterviewer.personality}
            isSpeaking={isSpeaking}
            volumeLevel={volumeLevel}
            onReady={() => console.log('[Interview] Avatar ready')}
            onError={(e) => console.error('[Interview] Avatar error:', e)}
          />
        </div>

        {/* User PiP - fixed bottom-right */}
        <div
          className={`absolute bottom-24 right-5 w-48 aspect-video rounded-xl overflow-hidden
                       shadow-2xl border z-20 transition-all duration-300
                       ${isUserSpeaking ? 'border-green-400/70 shadow-green-500/20 shadow-lg' : 'border-white/10'}`}
        >
          <UserVideo
            isVideoOn={isVideoOn}
            isAudioOn={!isMuted}
            onToggleVideo={() => setIsVideoOn((v) => !v)}
            onToggleAudio={toggleMute}
          />
          {/* Speaking indicator badge on user PiP */}
          {isUserSpeaking && (
            <div
              className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full
                           bg-green-500/80 backdrop-blur-sm text-[10px] text-white font-medium"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Speaking
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom control bar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        {/* Connection status */}
        {isCallActive && (
          <div className="px-4 mb-1 pointer-events-none">
            <div
              className="mx-auto max-w-md px-4 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-sm
                           border border-white/10 text-sm text-white flex items-center justify-center gap-3 shadow-lg"
            >
              {isConnected ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-slate-300">
                    {isSpeaking ? 'Interviewer is speaking...' : isUserSpeaking ? 'You are speaking...' : 'Listening...'}
                  </span>
                </>
              ) : (
                <>
                  <Loader2 size={14} className="animate-spin text-purple-400" />
                  <span className="text-slate-400">Connecting to interviewer...</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main control bar */}
        <div
          className="flex items-center justify-between px-6 py-3 bg-slate-950/85 backdrop-blur-xl
                       border-t border-white/5 pointer-events-auto"
        >
          {/* Left: camera + mic controls */}
          <div className="flex items-center gap-3 w-52">
            <button
              onClick={() => setIsVideoOn((v) => !v)}
              className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all
                ${isVideoOn ? 'bg-slate-800 border-slate-600 hover:border-slate-500' : 'bg-red-600/80 border-red-500'}`}
            >
              {isVideoOn ? <Video size={18} className="text-white" /> : <VideoOff size={18} className="text-white" />}
            </button>

            <button
              onClick={toggleMute}
              className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all
                ${!isMuted ? 'bg-slate-800 border-slate-600 hover:border-slate-500' : 'bg-red-600/80 border-red-500'}`}
            >
              {!isMuted ? <Mic size={18} className="text-white" /> : <MicOff size={18} className="text-white" />}
            </button>

            {/* Status pill */}
            {isSpeaking ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                <Volume2 size={11} />
                AI speaking
              </div>
            ) : isUserSpeaking ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400">
                <div className="flex items-end gap-px h-3">
                  {[0, 0.15, 0.05, 0.2].map((delay, i) => (
                    <div
                      key={i}
                      className="w-0.5 rounded-full bg-green-400 animate-pulse"
                      style={{ height: `${50 + i * 15}%`, animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>
                Speaking
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700 text-xs text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Ready
              </div>
            )}
          </div>

          {/* Center: End Call */}
          <button
            onClick={handleEndInterview}
            disabled={isEnding}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 shadow-lg shadow-red-900/40 ${
              isEnding
                ? 'bg-slate-700 border-slate-600 opacity-50 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 border-red-500 hover:scale-105 active:scale-95'
            }`}
          >
            <PhoneOff size={24} className="text-white" />
          </button>

          {/* Right: utility controls */}
          <div className="flex items-center gap-2 w-52 justify-end">
            <button
              onClick={() => setShowCodeEditor((c) => !c)}
              className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all
                ${showCodeEditor ? 'bg-blue-600/80 border-blue-500' : 'bg-slate-800 border-slate-600 hover:border-slate-500'}`}
            >
              <Code size={18} className="text-white" />
            </button>
            <button
              onClick={() => setShowTranscript((t) => !t)}
              className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all
                ${showTranscript ? 'bg-purple-600/80 border-purple-500' : 'bg-slate-800 border-slate-600 hover:border-slate-500'}`}
            >
              <MessagesSquare size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Code Editor Panel ── */}
      {showCodeEditor && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700" style={{ height: '55vh' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <Code size={16} className="text-blue-400" />
              <span className="text-white font-semibold text-sm">Code Editor</span>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
              >
                {['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => submitCode(codeAnswer)}
                disabled={!codeAnswer.trim() || !isCallActive}
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
            onChange={(v) => setCodeAnswer(v || '')}
            onRun={(code) => setCodeAnswer(code)}
            height="calc(55vh - 44px)"
          />
        </div>
      )}

      {/* ── Transcript Side Panel ── */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-40 w-80 bg-slate-900/95 backdrop-blur-xl
                      border-l border-slate-700/50 transition-transform duration-300
                      ${showTranscript ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <span className="text-white font-semibold text-sm">Interview Transcript</span>
          <button onClick={() => setShowTranscript(false)} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 h-[calc(100vh-52px)]">
          {transcript.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Interview not started yet</p>
          ) : (
            transcript.map((msg, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 text-sm ${
                  msg.speaker === 'ai'
                    ? 'bg-purple-500/10 border border-purple-500/20'
                    : 'bg-blue-500/10 border border-blue-500/20'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${msg.speaker === 'ai' ? 'bg-purple-400' : 'bg-blue-400'}`} />
                  <span className="text-xs font-semibold text-slate-300">
                    {msg.speaker === 'ai' ? session.aiInterviewer.name : 'You'}
                  </span>
                  {msg.type === 'code' && (
                    <Badge variant="outline" className="text-xs py-0 px-1 h-4 border-blue-500/30 text-blue-400">
                      code
                    </Badge>
                  )}
                </div>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* ── Wrap-up overlay ── */}
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
