'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SimliClient, generateSimliSessionToken, generateIceServers } from 'simli-client';
import { Volume2, VolumeX } from 'lucide-react';

interface SimliAvatarProps {
  name: string;
  personality: string;
  faceId?: string;
  isSpeaking: boolean;
  volumeLevel?: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

// Default female interviewer face - can be customized via environment variable
const DEFAULT_FACE_ID = process.env.NEXT_PUBLIC_SIMLI_FACE_ID || 'tmp9i8bbq7c';

export default function SimliAvatar({
  name,
  personality,
  faceId = DEFAULT_FACE_ID,
  isSpeaking,
  volumeLevel = 0,
  onReady,
  onError,
}: SimliAvatarProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const simliClientRef = useRef<SimliClient | null>(null);
  const initializingRef = useRef(false);

  // Initialize Simli client
  const initializeSimli = useCallback(async () => {
    if (initializingRef.current || !videoRef.current || !audioRef.current) return;
    initializingRef.current = true;

    const apiKey = process.env.NEXT_PUBLIC_SIMLI_API_KEY;
    if (!apiKey) {
      console.warn('[SimliAvatar] No Simli API key configured, using fallback avatar');
      setIsLoading(false);
      setError('Simli API key not configured');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Generate session token
      const tokenResponse = await generateSimliSessionToken({
        apiKey,
        config: {
          faceId,
          handleSilence: true,
          maxSessionLength: 3600, // 1 hour
          maxIdleTime: 300, // 5 minutes
        },
      });

      if (!tokenResponse.session_token) {
        throw new Error('Failed to get Simli session token');
      }

      // Generate ICE servers (required for P2P mode)
      const iceServers = await generateIceServers(apiKey);

      // Create Simli client
      const client = new SimliClient(
        tokenResponse.session_token,
        videoRef.current,
        audioRef.current,
        iceServers,
      );

      // Event handlers
      client.on('start', () => {
        console.log('[SimliAvatar] Started');
        setIsConnected(true);
        setIsLoading(false);
        onReady?.();
      });

      client.on('stop', () => {
        console.log('[SimliAvatar] Stopped');
        setIsConnected(false);
      });

      client.on('error', (detail: string) => {
        console.error('[SimliAvatar] Error:', detail);
        setError('Avatar connection error');
        setIsLoading(false);
        onError?.(new Error(detail));
      });

      client.on('startup_error', (message: string) => {
        console.error('[SimliAvatar] Startup error:', message);
        setError('Failed to start avatar');
        setIsLoading(false);
        onError?.(new Error(message));
      });

      simliClientRef.current = client;

      // Start the connection
      await client.start();
    } catch (e) {
      console.error('[SimliAvatar] Initialization error:', e);
      setError('Failed to initialize avatar');
      setIsLoading(false);
      onError?.(e as Error);
    } finally {
      initializingRef.current = false;
    }
  }, [faceId, onReady, onError]);

  // Initialize on mount
  useEffect(() => {
    initializeSimli();

    return () => {
      if (simliClientRef.current) {
        simliClientRef.current.stop();
        simliClientRef.current = null;
      }
    };
  }, [initializeSimli]);

  // Handle mute toggle
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Send audio data to Simli for lip-sync (called externally)
  const sendAudioData = useCallback((audioData: Uint8Array) => {
    if (simliClientRef.current && isConnected) {
      simliClientRef.current.sendAudioData(audioData);
    }
  }, [isConnected]);

  // Clear audio buffer (when interrupted)
  const clearBuffer = useCallback(() => {
    if (simliClientRef.current) {
      simliClientRef.current.ClearBuffer();
    }
  }, []);

  // Calculate speaking indicator scale based on volume
  const speakingScale = isSpeaking ? 1 + (volumeLevel * 0.3) : 1;

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-slate-950 rounded-2xl">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 100%, #7c3aed33 0%, transparent 70%)`,
          opacity: isSpeaking ? 1 : 0.5,
        }}
      />

      {/* Grid background */}
      <div className="absolute inset-0 bg-grid opacity-30" />

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 hover:border-purple-500 transition-all"
      >
        {isMuted ? (
          <VolumeX size={16} className="text-slate-400" />
        ) : (
          <Volume2 size={16} className="text-purple-400" />
        )}
      </button>

      {/* Live badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-red-600/80 backdrop-blur-sm rounded-full border border-red-500/30">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-xs font-bold text-white tracking-widest">LIVE</span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin mx-auto" />
            <p className="text-slate-400 text-sm">Connecting to interviewer...</p>
          </div>
        </div>
      )}

      {/* Error state - fallback to simple avatar */}
      {error && !isLoading && (
        <FallbackAvatar
          name={name}
          personality={personality}
          isSpeaking={isSpeaking}
          volumeLevel={volumeLevel}
        />
      )}

      {/* Video element for Simli avatar */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        className={`w-full h-full object-cover transition-transform duration-200 ${
          isConnected && !error ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: `scale(${speakingScale})`,
        }}
      />

      {/* Audio element for Simli */}
      <audio ref={audioRef} autoPlay muted={isMuted} className="hidden" />

      {/* Speaking indicator ring */}
      {isSpeaking && isConnected && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-4 rounded-2xl border-2 border-purple-500/50 animate-pulse"
            style={{
              boxShadow: `0 0 ${20 + volumeLevel * 30}px ${volumeLevel * 10}px rgba(124, 58, 237, ${
                0.3 + volumeLevel * 0.3
              })`,
            }}
          />
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
        <div
          className="px-4 py-1.5 rounded-full text-white text-sm font-semibold backdrop-blur-sm border border-white/10"
          style={{
            background: 'linear-gradient(135deg, #7c3aedcc, #2563ebcc)',
          }}
        >
          {name}
        </div>
        <span className="text-xs text-slate-400 capitalize">{personality} Interviewer</span>
      </div>

      {/* Speaking wave visualization */}
      {isSpeaking && isConnected && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8 z-10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-1 rounded-full animate-pulse"
              style={{
                background: 'linear-gradient(to top, #7c3aed, #2563eb)',
                height: `${8 + volumeLevel * 20 + Math.sin(Date.now() / 200 + i) * 5}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Fallback avatar when Simli is not available
function FallbackAvatar({
  name,
  personality,
  isSpeaking,
  volumeLevel = 0,
}: {
  name: string;
  personality: string;
  isSpeaking: boolean;
  volumeLevel?: number;
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
        const val = Math.abs(Math.sin(t) * 0.85 + Math.sin(t * 2.3) * 0.15);
        setMouthOpen(val);
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
      return () => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        setMouthOpen(0);
      };
    } else {
      setMouthOpen(0);
    }
  }, [isSpeaking]);

  // Blinking
  useEffect(() => {
    const blink = () => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 140);
    };
    const interval = setInterval(blink, 2500 + Math.random() * 3500);
    return () => clearInterval(interval);
  }, []);

  const eyeH = blinkState ? 1 : 10;

  return (
    <div className="flex flex-col items-center">
      <svg
        width="220"
        height="280"
        viewBox="0 0 220 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="avatar-gradient" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.7" />
          </radialGradient>
          <filter id="avatar-shadow">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#7c3aed" floodOpacity="0.4" />
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
        <ellipse
          cx="110"
          cy={148 + mouthOpen * 4}
          rx={16 + mouthOpen * 4}
          ry={4 + mouthOpen * 10}
          fill="white"
          opacity={0.35 + mouthOpen * 0.55}
        />
        <path
          d={`M94 148 Q110 ${144 - mouthOpen * 4} 126 148`}
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
      </svg>

      {/* Name badge */}
      <div className="mt-2 flex flex-col items-center gap-1">
        <div
          className="px-4 py-1.5 rounded-full text-white text-sm font-semibold backdrop-blur-sm border border-white/10"
          style={{
            background: 'linear-gradient(135deg, #7c3aedcc, #2563ebcc)',
          }}
        >
          {name}
        </div>
        <span className="text-xs text-slate-400 capitalize">{personality} Interviewer</span>
      </div>
    </div>
  );
}

// Export for external use
export { SimliAvatar };
