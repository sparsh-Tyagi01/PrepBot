'use client';

import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, User } from 'lucide-react';

interface UserVideoProps {
  isVideoOn: boolean;
  isAudioOn?: boolean;
  onToggleVideo: () => void;
  onToggleAudio?: () => void;
  userName?: string;
  compact?: boolean; // For PiP mode - hides controls
}

export default function UserVideo({
  isVideoOn,
  isAudioOn = true,
  onToggleVideo,
  onToggleAudio = () => {},
  userName = 'You',
  compact = false
}: UserVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (isVideoOn) {
      startVideo();
    } else {
      stopVideo();
    }

    return () => {
      stopVideo();
    };
  }, [isVideoOn]);

  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isAudioOn;
      });
    }
  }, [isAudioOn, stream]);

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Set audio track state
      mediaStream.getAudioTracks().forEach(track => {
        track.enabled = isAudioOn;
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setHasPermission(false);
    }
  };

  const stopVideo = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  return (
    <div className={`relative w-full h-full bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden ${compact ? 'rounded-xl' : 'rounded-2xl border border-slate-700 shadow-2xl'}`}>
      {/* Video element */}
      {isVideoOn && hasPermission ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
      ) : (
        /* Placeholder when video is off */
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className={`relative ${compact ? 'w-12 h-12' : 'w-32 h-32 mb-4'}`}>
            {/* Avatar placeholder */}
            <div className={`relative w-full h-full rounded-full bg-linear-to-br from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-xl`}>
              <User className="text-slate-400" size={compact ? 20 : 48} />
            </div>
          </div>
          {!compact && <p className="text-slate-400 text-sm">Camera is off</p>}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* User name label - hide in compact mode */}
      {!compact && (
        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700">
          <span className="text-sm font-medium text-white">{userName}</span>
        </div>
      )}

      {/* Controls - hide in compact mode */}
      {!compact && (
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <button
            onClick={onToggleVideo}
            className={`p-3 backdrop-blur-sm hover:bg-opacity-90 rounded-full transition-all border ${
              isVideoOn
                ? 'bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700'
                : 'bg-red-600/90 border-red-500 text-white hover:bg-red-700'
            }`}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        </div>
      )}

      {/* Recording indicator - smaller in compact mode */}
      {isVideoOn && !compact && (
        <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1.5 bg-red-600/90 backdrop-blur-sm rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-white">REC</span>
        </div>
      )}

    </div>
  );
}
