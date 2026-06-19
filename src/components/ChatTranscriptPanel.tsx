"use client";

import { useEffect, useRef } from "react";

type TranscriptMessage = {
  role: "assistant" | "user";
  content: string;
  status?: string;
};

type ChatTranscriptPanelProps = {
  messages: TranscriptMessage[];
  subtitle?: string;
};

export function ChatTranscriptPanel({ messages, subtitle = "Transcript updates as you type." }: ChatTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    box.scrollTop = box.scrollHeight;
  }, [messages]);

  return (
    <div className="mt-4 flex flex-col">
      <p className="mono-label">Live transcript</p>
      <p className="mt-2 text-xs leading-5 text-lp-muted">{subtitle}</p>

      <div
        ref={scrollRef}
        className="transcript-scroll terminal-card mt-4 h-[min(70vh,560px)] min-h-[400px] w-full shrink-0 overflow-y-auto overflow-x-hidden border border-white/20 bg-black/70 p-4"
      >
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="font-mono text-xs text-lp-subtle">Your words will appear here once you start typing.</p>
          )}

          {messages.map((entry, index) => (
            <div
              key={`${entry.role}-${index}-${entry.content.slice(0, 12)}`}
              className={`break-words rounded-sm border px-3 py-2.5 text-sm leading-6 ${
                entry.role === "user"
                  ? "border-white/15 bg-white/5 text-white"
                  : entry.status === "thinking"
                    ? "border-white/10 bg-white/[0.02] text-lp-subtle italic"
                    : "border-white/10 bg-white/[0.03] text-lp-muted"
              }`}
            >
              {entry.status !== "thinking" && (
                <span className="mono-label mb-1.5 block text-[0.6rem]">
                  {entry.role === "user" ? "You" : "LaunchPilot"}
                </span>
              )}
              {entry.status === "thinking" ? "Thinking…" : entry.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
