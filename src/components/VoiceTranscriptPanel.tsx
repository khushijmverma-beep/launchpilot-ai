"use client";

import { useEffect, useRef } from "react";

type TranscriptEntry = {
  role: "assistant" | "user";
  content: string;
};

type VoiceTranscriptPanelProps = {
  entries: TranscriptEntry[];
  liveText: string;
  isListening: boolean;
  sessionEnded?: boolean;
};

export function VoiceTranscriptPanel({
  entries,
  liveText,
  isListening,
  sessionEnded = false,
}: VoiceTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    box.scrollTop = box.scrollHeight;
  }, [entries, liveText, sessionEnded]);

  return (
    <aside className="flex w-full flex-col lg:max-w-[380px]">
      <p className="mono-label">Live transcript</p>
      <p className="mt-2 text-xs leading-5 text-lp-muted">
        {sessionEnded
          ? "Conversation ended. Scroll to review."
          : isListening
            ? "Capturing every word — pause when you're done speaking."
            : "Transcript updates as you talk."}
      </p>

      <div
        ref={scrollRef}
        className="transcript-scroll terminal-card mt-4 h-[min(70vh,560px)] min-h-[400px] w-full overflow-y-auto overflow-x-hidden border border-white/20 bg-black/70 p-4"
      >
        <div className="space-y-3">
          {entries.length === 0 && !liveText && (
            <p className="font-mono text-xs text-lp-subtle">Your words will appear here once you start speaking.</p>
          )}

          {entries.map((entry, index) => (
            <div
              key={`${entry.role}-${index}-${entry.content.slice(0, 12)}`}
              className={`break-words rounded-sm border px-3 py-2.5 text-sm leading-6 ${
                entry.role === "user"
                  ? "border-white/15 bg-white/5 text-white"
                  : entry.content.startsWith("—")
                    ? "border-white/10 bg-transparent text-center font-mono text-xs text-lp-subtle"
                    : "border-white/10 bg-white/[0.03] text-lp-muted"
              }`}
            >
              {!entry.content.startsWith("—") && (
                <span className="mono-label mb-1.5 block text-[0.6rem]">
                  {entry.role === "user" ? "You" : "LaunchPilot"}
                </span>
              )}
              {entry.content}
            </div>
          ))}

          {liveText && (
            <div className="break-words rounded-sm border border-[#A855F7]/40 bg-[#A855F7]/10 px-3 py-2.5 text-sm leading-6 text-white">
              <span className="mono-label mb-1.5 block text-[0.6rem] text-[#C084FC]">
                {isListening ? "You · live" : "You"}
              </span>
              {liveText}
              {isListening && <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-[#A855F7]" />}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
