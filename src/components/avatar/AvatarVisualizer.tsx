'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, Loader2, Sparkles, UserCheck } from 'lucide-react';

export type AvatarState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'LOADING' | 'ERROR';

interface AvatarVisualizerProps {
  state: AvatarState;
  personaName?: string;
  isSpeaking?: boolean;
  currentSpeechText?: string;
  onSpeechEnd?: () => void;
  className?: string;
}

export const personas = [
  {
    name: 'Sarah',
    role: 'Senior Technical Recruiter',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=360',
    voicePitch: 1.05,
    voiceRate: 1.0,
  },
  {
    name: 'David',
    role: 'Engineering Director',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=360',
    voicePitch: 0.95,
    voiceRate: 0.98,
  },
  {
    name: 'Priya',
    role: 'Lead Systems Architect',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=360',
    voicePitch: 1.1,
    voiceRate: 1.02,
  },
  {
    name: 'Michael',
    role: 'Staff Software Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=360',
    voicePitch: 0.9,
    voiceRate: 1.05,
  },
];

export default function AvatarVisualizer({
  state,
  personaName = 'Sarah',
  isSpeaking = false,
  currentSpeechText,
  onSpeechEnd,
  className = '',
}: AvatarVisualizerProps) {
  const [mouthOpen, setMouthOpen] = useState(0); // 0 to 1
  const [blink, setBlink] = useState(false);
  const [headTilt, setHeadTilt] = useState({ x: 0, y: 0 });
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const persona = personas.find(p => p.name === personaName) || personas[0];

  // Initialize SpeechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Text-to-Speech speaking hook
  useEffect(() => {
    if (!currentSpeechText || isAudioMuted || typeof window === 'undefined') return;

    if (synthRef.current) {
      synthRef.current.cancel(); // Stop any previous utterance

      const utterance = new SpeechSynthesisUtterance(currentSpeechText);
      utterance.pitch = persona.voicePitch;
      utterance.rate = persona.voiceRate;

      // Select natural sounding voice if available
      const voices = synthRef.current.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Zira') || v.name.includes('Samantha')));
      if (preferred) utterance.voice = preferred;

      utterance.onend = () => {
        setMouthOpen(0);
        if (onSpeechEnd) onSpeechEnd();
      };

      utterance.onerror = () => {
        setMouthOpen(0);
        if (onSpeechEnd) onSpeechEnd();
      };

      currentUtteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    }
  }, [currentSpeechText, isAudioMuted, persona]);

  // Lip sync animation simulation when speaking
  useEffect(() => {
    if (state !== 'SPEAKING' && !isSpeaking) {
      setMouthOpen(0);
      return;
    }

    const interval = setInterval(() => {
      // Simulate mouth articulation amplitude
      setMouthOpen(Math.random() > 0.3 ? 0.3 + Math.random() * 0.7 : 0);
    }, 110);

    return () => clearInterval(interval);
  }, [state, isSpeaking]);

  // Natural Blinking simulation (every 3.5 - 5 seconds)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3800 + Math.random() * 1200);

    return () => clearInterval(blinkInterval);
  }, []);

  // Subtle Head sway / saccades
  useEffect(() => {
    const tiltInterval = setInterval(() => {
      setHeadTilt({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 3,
      });
    }, 2400);

    return () => clearInterval(tiltInterval);
  }, []);

  const toggleMute = () => {
    if (synthRef.current) {
      if (!isAudioMuted) {
        synthRef.current.cancel();
      }
    }
    setIsAudioMuted(!isAudioMuted);
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Outer Studio Frame */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 to-indigo-950 border-4 border-slate-800/80 shadow-2xl flex items-center justify-center group">
        
        {/* Atmospheric Studio Lighting */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-indigo-900/20" />
        <div
          className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl transition-opacity duration-700 ${
            state === 'SPEAKING'
              ? 'bg-rose-500/30'
              : state === 'LISTENING'
              ? 'bg-blue-500/30'
              : state === 'THINKING'
              ? 'bg-purple-500/30'
              : 'bg-indigo-500/20'
          }`}
        />

        {/* Realistic Avatar Image & Transform Rig */}
        <div
          className="relative w-full h-full transition-transform duration-700 ease-out flex items-center justify-center overflow-hidden"
          style={{
            transform: `translate(${headTilt.x}px, ${headTilt.y}px) scale(${state === 'SPEAKING' ? 1.02 : 1})`,
          }}
        >
          <img
            src={persona.avatarUrl}
            alt={persona.name}
            className={`w-full h-full object-cover object-top transition-all duration-300 ${
              blink ? 'filter brightness-95' : ''
            }`}
          />

          {/* Lip-Sync Mouth Mesh Overlay for Voice Dynamics */}
          {mouthOpen > 0 && (
            <div
              className="absolute w-6 bg-slate-900/90 rounded-full transition-all duration-75 border border-slate-700/60 shadow-inner"
              style={{
                bottom: '31%',
                left: '49%',
                transform: 'translateX(-50%)',
                height: `${mouthOpen * 14}px`,
                opacity: 0.85,
              }}
            />
          )}

          {/* Thinking Scanline / Glow Effect */}
          {state === 'THINKING' && (
            <div className="absolute inset-0 bg-purple-500/10 backdrop-blur-[1px] flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-purple-500/40 text-purple-300 text-xs font-semibold shadow-lg">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>AI is analyzing response...</span>
              </div>
            </div>
          )}
        </div>

        {/* State Pill (Top Center) */}
        <div className="absolute top-3 left-3 z-10">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border ${
              state === 'SPEAKING'
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                : state === 'LISTENING'
                ? 'bg-blue-950/80 text-blue-300 border-blue-500/40 animate-pulse'
                : state === 'THINKING'
                ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/50'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                state === 'SPEAKING'
                  ? 'bg-rose-500 animate-ping'
                  : state === 'LISTENING'
                  ? 'bg-blue-400'
                  : state === 'THINKING'
                  ? 'bg-purple-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span>
              {state === 'SPEAKING'
                ? 'Interviewer Speaking'
                : state === 'LISTENING'
                ? 'Listening to Candidate...'
                : state === 'THINKING'
                ? 'Evaluating Answer...'
                : 'Ready / Listening'}
            </span>
          </div>
        </div>

        {/* Audio Mute Button (Top Right) */}
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-slate-300 border border-slate-700/50 shadow-md backdrop-blur-md transition-colors"
          title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Live Audio Waveform (Bottom) */}
        {(state === 'SPEAKING' || state === 'LISTENING') && (
          <div className="absolute bottom-3 left-4 right-4 py-2 px-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-1.5 h-4">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-100 ${
                    state === 'SPEAKING' ? 'bg-rose-500' : 'bg-blue-400'
                  }`}
                  style={{
                    height: `${4 + Math.random() * 12}px`,
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono font-medium text-slate-400">
              {state === 'SPEAKING' ? 'TTS ACTIVE' : 'VOICE STREAM'}
            </span>
          </div>
        )}
      </div>

      {/* Persona Tag Details */}
      <div className="mt-3 text-center">
        <h4 className="font-bold text-slate-800 text-base flex items-center justify-center gap-1.5">
          <span>{persona.name}</span>
          <UserCheck className="w-4 h-4 text-indigo-600" />
        </h4>
        <p className="text-xs text-slate-500">{persona.role}</p>
      </div>
    </div>
  );
}
