'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const AVATAR_COLORS: Record<string, { from: string; to: string }> = {
  Jesse:  { from: '#7c3aed', to: '#2563eb' },
  Arjun:  { from: '#0891b2', to: '#7c3aed' },
  Maya:   { from: '#db2777', to: '#7c3aed' },
  Ethan:  { from: '#0f766e', to: '#2563eb' },
  Sophia: { from: '#d97706', to: '#7c3aed' },
};

interface AIAvatarProps {
  name: string;
  personality: string;
  avatar: string;
  isSpeaking: boolean;
  onSpeakingComplete?: () => void;
  text?: string;
}

export default function AIAvatar({ 
  name, 
  personality, 
  isSpeaking,
  onSpeakingComplete,
  text 
}: AIAvatarProps) {
  const [isMuted, setIsMuted]       = useState(false);
  const [mouthOpen, setMouthOpen]   = useState(0);
  const [blinkState, setBlinkState] = useState(false);
  const [headBob, setHeadBob]       = useState(0);
  const [breathe, setBreathe]       = useState(0);
  const [isActive, setIsActive]     = useState(false);
  const speechRef  = useRef<SpeechSynthesisUtterance | null>(null);
  const animRef    = useRef<number | null>(null);
  const blinkTimer = useRef<NodeJS.Timeout | null>(null);
  const breatheTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colors = AVATAR_COLORS[name] ?? { from: '#7c3aed', to: '#2563eb' };

  const startMouthAnim = useCallback(() => {
    let t = 0;
    const tick = () => {
      t += 0.18;
      const val = Math.abs(Math.sin(t) * 0.85 + Math.sin(t * 2.3) * 0.15);
      setMouthOpen(val);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  const stopMouthAnim = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setMouthOpen(0);
  }, []);

  // Natural blink loop
  useEffect(() => {
    const schedule = () => {
      const delay = 2500 + Math.random() * 3500;
      blinkTimer.current = setTimeout(() => {
        setBlinkState(true);
        setTimeout(() => setBlinkState(false), 140);
        schedule();
      }, delay);
    };
    schedule();
    return () => { if (blinkTimer.current) clearTimeout(blinkTimer.current); };
  }, []);

  // Breathing
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame++;
      setBreathe(Math.sin(frame * 0.025) * 4);
      breatheTimer.current = setTimeout(tick, 50);
    };
    tick();
    return () => { if (breatheTimer.current) clearTimeout(breatheTimer.current); };
  }, []);

  // Head bob while speaking
  useEffect(() => {
    let frame = 0;
    let id: ReturnType<typeof setTimeout>;
    if (isSpeaking) {
      const tick = () => { frame++; setHeadBob(Math.sin(frame * 0.12) * 3); id = setTimeout(tick, 50); };
      tick();
    } else { setHeadBob(0); }
    return () => clearTimeout(id);
  }, [isSpeaking]);

  // Generation counter — every new startSpeech() gets a unique id.
  // Callbacks from cancelled/stale utterances check this and bail out early,
  // preventing them from calling onSpeakingComplete and killing the NEW speech.
  const speechGenRef  = useRef(0);
  const keepAliveRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSpeech = () => {
    speechGenRef.current++;                        // invalidate any in-flight utterance
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
    window.speechSynthesis.cancel();
    stopMouthAnim();
  };

  // TTS
  useEffect(() => {
    if (isSpeaking && text && !isMuted) { setIsActive(true); startSpeech(text); }
    else if (isSpeaking && isMuted)     { setIsActive(false); onSpeakingComplete?.(); }
    else if (!isSpeaking)               { stopSpeech(); setIsActive(false); }
    return () => stopSpeech();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking, text, isMuted]);

  const startSpeech = (txt: string) => {
    // Grab a unique generation id for this utterance BEFORE cancel(), so that
    // the onerror/onend of the previous (now-cancelled) utterance sees a stale gen.
    const myGen = ++speechGenRef.current;
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
    window.speechSynthesis.cancel();

    const speak = () => {
      // If stopSpeech() was called between scheduling and now, abort.
      if (speechGenRef.current !== myGen) return;

      const utterance = new SpeechSynthesisUtterance(txt);
      utterance.rate   = 0.95;
      utterance.pitch  = 1.05;
      utterance.volume = 1;

      const voices    = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang === 'en-US' && /Google|natural|Daniel|Samantha/i.test(v.name))
        ?? voices.find(v => v.lang.startsWith('en'))
        ?? voices[0];
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        if (speechGenRef.current !== myGen) { window.speechSynthesis.cancel(); return; }
        startMouthAnim();
        // Chrome cuts off speech after ~15 s — keep it alive with pause/resume
        keepAliveRef.current = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 10000);
      };

      const finish = (isError = false, errEvent?: SpeechSynthesisErrorEvent) => {
        if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
        // Only propagate completion for the currently active generation.
        // Cancelled older utterances must NOT call onSpeakingComplete — that
        // would set isAISpeaking=false in the parent and kill the NEW speech.
        if (speechGenRef.current !== myGen) return;
        if (isError && errEvent && errEvent.error !== 'interrupted' && errEvent.error !== 'canceled') {
          console.error('TTS error:', errEvent.error);
        }
        stopMouthAnim();
        setIsActive(false);
        onSpeakingComplete?.();
      };

      utterance.onend   = ()  => finish();
      utterance.onerror = (e) => finish(true, e);

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    // Chrome sometimes needs a tick after cancel() before speak() works reliably.
    // Also handles the case where voices aren't loaded yet (with event + poll fallback).
    const trySpeak = () => {
      if (speechGenRef.current !== myGen) return;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        speak();
      } else {
        // Voices not ready — wait via event AND poll (event may already have fired)
        let did = false;
        const go = () => {
          if (did || speechGenRef.current !== myGen) return;
          did = true;
          window.speechSynthesis.onvoiceschanged = null;
          speak();
        };
        window.speechSynthesis.onvoiceschanged = go;
        let attempts = 0;
        const poll = () => {
          if (did || speechGenRef.current !== myGen) return;
          if (window.speechSynthesis.getVoices().length > 0) { go(); return; }
          if (++attempts < 50) setTimeout(poll, 80);
        };
        setTimeout(poll, 80);
      }
    };

    // 50 ms delay gives Chrome time to process the pending cancel() before we speak()
    setTimeout(trySpeak, 50);
  };

  /* ── Render ── */
  const eyeH = blinkState ? 1 : 10;

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-slate-950 rounded-2xl">
      {/* Ambient glow */}
      <div className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${colors.from}33 0%, transparent 70%)`,
          opacity: isActive ? 1 : 0.5,
        }}
      />
      {/* Grid */}
      <div className="absolute inset-0 bg-grid opacity-30" />

      {/* Mute */}
      <button onClick={() => setIsMuted(m => !m)}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 hover:border-purple-500 transition-all">
        {isMuted ? <VolumeX size={16} className="text-slate-400" /> : <Volume2 size={16} className="text-purple-400" />}
      </button>

      {/* Live badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-red-600/80 backdrop-blur-sm rounded-full border border-red-500/30">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-xs font-bold text-white tracking-widest">LIVE</span>
      </div>

      {/* Avatar */}
      <div className="relative z-10 flex flex-col items-center select-none"
        style={{ transform: `translateY(${breathe + headBob}px)`, transition: 'transform 0.1s ease-out' }}>

        {isActive && (
          <div className="absolute inset-0 rounded-full speaking-ring pointer-events-none" style={{ margin: '-12px' }} />
        )}

        <svg width="220" height="280" viewBox="0 0 220 280" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id={`ag-${name}`} cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor={colors.from} stopOpacity="0.9" />
              <stop offset="100%" stopColor={colors.to} stopOpacity="0.7" />
            </radialGradient>
            <filter id="ashadow"><feDropShadow dx="0" dy="8" stdDeviation="12" floodColor={colors.from} floodOpacity="0.4" /></filter>
          </defs>
          <rect x="90" y="205" width="40" height="35" rx="8" fill={`url(#ag-${name})`} opacity="0.9" />
          <ellipse cx="110" cy="248" rx="80" ry="32" fill={`url(#ag-${name})`} filter="url(#ashadow)" />
          <ellipse cx="110" cy="120" rx="72" ry="82" fill={`url(#ag-${name})`} filter="url(#ashadow)" />
          <ellipse cx="38" cy="122" rx="10" ry="14" fill={`url(#ag-${name})`} />
          <ellipse cx="182" cy="122" rx="10" ry="14" fill={`url(#ag-${name})`} />
          <ellipse cx="110" cy="110" rx="65" ry="72" fill="white" opacity="0.06" />
          {/* Eyes */}
          <ellipse cx="84" cy="108" rx="10" ry={eyeH} fill="white" />
          <ellipse cx="86" cy="110" rx="6" ry={Math.max(1, eyeH * 0.65)} fill="#1e1b4b" />
          <circle cx="89" cy="107" r="2" fill="white" />
          <ellipse cx="136" cy="108" rx="10" ry={eyeH} fill="white" />
          <ellipse cx="138" cy="110" rx="6" ry={Math.max(1, eyeH * 0.65)} fill="#1e1b4b" />
          <circle cx="141" cy="107" r="2" fill="white" />
          {/* Nose */}
          <path d="M110 115 Q106 130 100 134 Q110 138 120 134 Q114 130 110 115Z" fill="white" opacity="0.2" />
          {/* Mouth */}
          <ellipse cx="110" cy={148 + mouthOpen * 4} rx={16 + mouthOpen * 4} ry={4 + mouthOpen * 10} fill="white" opacity={0.35 + mouthOpen * 0.55} />
          <path d={`M${94} 148 Q110 ${144 - mouthOpen * 4} ${126} 148`} stroke="white" strokeWidth="1.5" fill="none" opacity="0.6" />
        </svg>

        <div className="mt-2 mb-4 flex flex-col items-center gap-1">
          <div className="px-4 py-1.5 rounded-full text-white text-sm font-semibold backdrop-blur-sm border border-white/10"
            style={{ background: `linear-gradient(135deg, ${colors.from}cc, ${colors.to}cc)` }}>
            {name}
          </div>
          <span className="text-xs text-slate-400 capitalize">{personality} Interviewer</span>
        </div>
      </div>

      {/* Wave bars */}
      {isActive && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`w-1 rounded-full wave-bar-${i}`}
              style={{ background: `linear-gradient(to top, ${colors.from}, ${colors.to})`, height: '8px' }} />
          ))}
        </div>
      )}
    </div>
  );
}
