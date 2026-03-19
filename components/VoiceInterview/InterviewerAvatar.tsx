'use client';

import { useEffect, useRef, useState } from 'react';

interface InterviewerAvatarProps {
  name: string;
  personality: string;
  isSpeaking: boolean;
  volumeLevel?: number;
}

export default function InterviewerAvatar({
  name,
  personality,
  isSpeaking,
}: InterviewerAvatarProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <AnimatedAvatar
        name={name}
        personality={personality}
        isSpeaking={isSpeaking}
      />
    </div>
  );
}

// Animated SVG avatar
function AnimatedAvatar({
  name,
  personality,
  isSpeaking,
}: {
  name: string;
  personality: string;
  isSpeaking: boolean;
}) {
  const [mouthOpen, setMouthOpen] = useState(0);
  const [blinkState, setBlinkState] = useState(false);
  const animRef = useRef<number | null>(null);

  // Mouth animation when speaking
  useEffect(() => {
    if (isSpeaking) {
      let t = 0;
      const tick = () => {
        t += 0.18;
        setMouthOpen(Math.abs(Math.sin(t) * 0.85 + Math.sin(t * 2.3) * 0.15));
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
      return () => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        setMouthOpen(0);
      };
    }
    setMouthOpen(0);
  }, [isSpeaking]);

  // Blinking animation
  useEffect(() => {
    const blink = () => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 140);
    };
    const interval = setInterval(blink, 2500 + Math.random() * 3500);
    return () => clearInterval(interval);
  }, []);

  const eyeH = blinkState ? 1 : 10;
  const speakingScale = isSpeaking ? 1.02 : 1;

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Live badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-red-600/80 backdrop-blur-sm rounded-full border border-red-500/30">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-xs font-bold text-white tracking-widest">LIVE</span>
      </div>

      {/* Avatar with speaking animation */}
      <div
        className="relative transition-transform duration-150"
        style={{ transform: `scale(${speakingScale})` }}
      >
        {/* Speaking glow */}
        {isSpeaking && (
          <div
            className="absolute -inset-8 rounded-full blur-3xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(124,58,237,0.6) 0%, transparent 70%)',
            }}
          />
        )}

        <svg
          width="300"
          height="380"
          viewBox="0 0 220 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-2xl"
        >
          <defs>
            <radialGradient id="avatar-gradient" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
            </radialGradient>
            <filter id="avatar-shadow">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#7c3aed" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Neck */}
          <rect x="90" y="205" width="40" height="35" rx="8" fill="url(#avatar-gradient)" opacity="0.9" />

          {/* Shoulders */}
          <ellipse cx="110" cy="248" rx="80" ry="32" fill="url(#avatar-gradient)" filter="url(#avatar-shadow)" />

          {/* Head */}
          <ellipse cx="110" cy="120" rx="72" ry="82" fill="url(#avatar-gradient)" filter="url(#avatar-shadow)" />

          {/* Ears */}
          <ellipse cx="38" cy="122" rx="10" ry="14" fill="url(#avatar-gradient)" />
          <ellipse cx="182" cy="122" rx="10" ry="14" fill="url(#avatar-gradient)" />

          {/* Face highlight */}
          <ellipse cx="110" cy="110" rx="65" ry="72" fill="white" opacity="0.08" />

          {/* Left eye */}
          <ellipse cx="84" cy="108" rx="12" ry={eyeH} fill="white" />
          <ellipse cx="86" cy="110" rx="7" ry={Math.max(1, eyeH * 0.65)} fill="#1e1b4b" />
          <circle cx="89" cy="106" r="2.5" fill="white" />

          {/* Right eye */}
          <ellipse cx="136" cy="108" rx="12" ry={eyeH} fill="white" />
          <ellipse cx="138" cy="110" rx="7" ry={Math.max(1, eyeH * 0.65)} fill="#1e1b4b" />
          <circle cx="141" cy="106" r="2.5" fill="white" />

          {/* Eyebrows */}
          <path d="M70 95 Q84 90 98 95" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />
          <path d="M122 95 Q136 90 150 95" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />

          {/* Nose */}
          <path d="M110 118 Q106 132 100 136 Q110 140 120 136 Q114 132 110 118Z" fill="white" opacity="0.15" />

          {/* Mouth */}
          <ellipse
            cx="110"
            cy={150 + mouthOpen * 5}
            rx={18 + mouthOpen * 5}
            ry={5 + mouthOpen * 12}
            fill="white"
            opacity={0.4 + mouthOpen * 0.5}
          />
          {!isSpeaking && (
            <path d="M95 150 Q110 156 125 150" stroke="white" strokeWidth="2" fill="none" opacity="0.5" />
          )}
        </svg>
      </div>

      {/* Name badge */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <div
          className="px-6 py-2.5 rounded-full text-white text-lg font-semibold shadow-lg border border-white/20"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
        >
          {name}
        </div>
        <span className="text-sm text-slate-400 capitalize">{personality} Interviewer</span>
      </div>
    </div>
  );
}
