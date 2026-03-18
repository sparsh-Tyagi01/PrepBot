'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Vapi from '@vapi-ai/web';

export interface ConversationMessage {
  speaker: 'user' | 'ai';
  message: string;
  type: 'text' | 'code';
  timestamp: string;
}

interface VapiMessage {
  type: string;
  role?: 'user' | 'assistant' | 'system';
  transcript?: string;
  transcriptType?: string;
  functionCall?: unknown;
}

interface UseVapiSessionOptions {
  publicKey: string;
  sessionId: string;
  interviewerName: string;
  interviewType: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onError?: (error: Error) => void;
}

export function useVapiSession({
  publicKey,
  sessionId,
  interviewerName,
  interviewType,
  onCallStart,
  onCallEnd,
  onError,
}: UseVapiSessionOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'assistant' | null>(null);
  const [transcript, setTranscript] = useState<ConversationMessage[]>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const vapiRef = useRef<Vapi | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize Vapi instance
  useEffect(() => {
    if (!publicKey) {
      console.warn('[Vapi] No public key provided. Set NEXT_PUBLIC_VAPI_KEY in your environment.');
      setError(new Error('Vapi API key not configured. Please set NEXT_PUBLIC_VAPI_KEY.'));
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    // Event listeners
    vapi.on('call-start', () => {
      console.log('[Vapi] Call started');
      setIsConnected(true);
      setIsCallActive(true);
      onCallStart?.();
    });

    vapi.on('call-end', () => {
      console.log('[Vapi] Call ended');
      setIsConnected(false);
      setIsCallActive(false);
      setCurrentSpeaker(null);
      onCallEnd?.();
    });

    vapi.on('speech-start', () => {
      setCurrentSpeaker('assistant');
    });

    vapi.on('speech-end', () => {
      setCurrentSpeaker(null);
    });

    vapi.on('volume-level', (volume: number) => {
      setVolumeLevel(volume);
    });

    vapi.on('message', (message: VapiMessage) => {
      console.log('[Vapi] Message:', message);

      if (message.type === 'transcript') {
        const role = message.role;
        const transcriptText = message.transcript;
        const isFinal = message.transcriptType === 'final';

        if (isFinal && transcriptText) {
          setTranscript((prev) => [
            ...prev,
            {
              speaker: role === 'user' ? 'user' : 'ai',
              message: transcriptText,
              type: 'text',
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }
    });

    vapi.on('error', (e: any) => {
      // Extract meaningful error message
      let errorMessage = 'Voice connection error';
      if (typeof e === 'string') {
        errorMessage = e;
      } else if (e?.message) {
        errorMessage = e.message;
      } else if (e?.error) {
        errorMessage = typeof e.error === 'string' ? e.error : JSON.stringify(e.error);
      }
      console.error('[Vapi] Error:', errorMessage, e);
      const err = new Error(errorMessage);
      setError(err);
      onError?.(err);
    });

    return () => {
      vapi.stop();
      vapiRef.current = null;
    };
  }, [publicKey, onCallStart, onCallEnd, onError]);

  // Start the interview call
  const startInterview = useCallback(async () => {
    if (!vapiRef.current || isCallActive) return;

    try {
      setError(null);

      // Start the call with assistant configuration
      await vapiRef.current.start({
        model: {
          provider: 'custom-llm',
          url: `${window.location.origin}/api/vapi/webhook`,
          model: 'gemini',
        },
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en',
        },
        voice: {
          provider: 'playht',
          voiceId: 'jennifer', // Professional female voice
        },
        firstMessage: `Hi, I'm ${interviewerName}, and I'll be conducting your ${interviewType} today. Let's get started. So, tell me a little about yourself and your background.`,
        metadata: {
          sessionId,
        },
      } as any); // Use 'as any' to bypass strict type checking for custom-llm provider
    } catch (e) {
      console.error('[Vapi] Failed to start call:', e);
      setError(e as Error);
      onError?.(e as Error);
    }
  }, [isCallActive, sessionId, interviewerName, interviewType, onError]);

  // End the interview call
  const endInterview = useCallback(async () => {
    if (!vapiRef.current || !isCallActive) return;

    try {
      // Say goodbye and end call
      vapiRef.current.say("Thank you for your time today. The interview has concluded. Best of luck!", true);
    } catch (e) {
      console.error('[Vapi] Failed to end call:', e);
      vapiRef.current.stop();
    }
  }, [isCallActive]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return;

    const newMuted = !isMuted;
    vapiRef.current.setMuted(newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  // Send a message (for code submissions)
  const sendMessage = useCallback((content: string, role: 'user' | 'system' = 'user') => {
    if (!vapiRef.current || !isCallActive) return;

    vapiRef.current.send({
      type: 'add-message',
      message: { role, content },
    });
  }, [isCallActive]);

  // Get assistant audio stream for Simli
  const getAssistantAudioStream = useCallback((): MediaStream | null => {
    return mediaStreamRef.current;
  }, []);

  return {
    isConnected,
    isCallActive,
    isMuted,
    currentSpeaker,
    transcript,
    volumeLevel,
    error,
    startInterview,
    endInterview,
    toggleMute,
    sendMessage,
    getAssistantAudioStream,
    vapiInstance: vapiRef.current,
  };
}
