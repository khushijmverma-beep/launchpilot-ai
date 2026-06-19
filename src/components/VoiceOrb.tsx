"use client";

import { Mic, PhoneOff } from "lucide-react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

type VoiceOrbProps = {
  state: OrbState;
  isActive: boolean;
  onToggle: () => void;
  onEndConversation?: () => void;
  statusText?: string;
};

export function VoiceOrb({ state, isActive, onToggle, onEndConversation, statusText }: VoiceOrbProps) {
  const isListening = state === "listening";

  return (
    <div className="relative flex flex-col items-center gap-6">
      {statusText && (
        <div className="rounded-sm border border-white/20 bg-black/80 px-4 py-2 font-mono text-xs text-white">
          {statusText}
        </div>
      )}

      <button
        onClick={onToggle}
        disabled={isActive}
        className={`orb relative z-10 flex h-56 w-56 items-center justify-center rounded-full disabled:cursor-default ${isListening ? "voice-orb--listening" : ""}`}
        aria-label={isActive ? "Voice session active" : "Start voice"}
      >
        <div className="absolute inset-12 rounded-full border border-white/10" />
        {isActive ? (
          <Mic className="relative z-10 h-10 w-10 text-white" />
        ) : (
          <Mic className="relative z-10 h-10 w-10 text-white" />
        )}
      </button>

      {isActive && onEndConversation && (
        <button
          type="button"
          onClick={onEndConversation}
          className="btn-secondary flex items-center gap-2 px-5 py-2.5 font-mono text-xs uppercase tracking-wider"
        >
          <PhoneOff className="h-3.5 w-3.5" />
          End conversation
        </button>
      )}

      <div className="flex items-center gap-2 font-mono text-xs text-lp-muted">
        <div
          className={`h-1.5 w-1.5 rounded-full ${isListening ? "bg-[#A855F7]" : isActive ? "bg-white" : "bg-white/30"}`}
        />
        <span className="uppercase tracking-wide">{state}</span>
      </div>
    </div>
  );
}
