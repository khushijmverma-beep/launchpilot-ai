"use client";

import { Nav } from "@/components/Nav";
import { Mic, MessageCircle, Waves } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StartPage() {
  const router = useRouter();
  const [speechSupported] = useState(
    () => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
  );

  return (
    <main className="shell-bg min-h-screen">
      <Nav />
      <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-4xl flex-col items-center justify-center px-5 pb-10 text-center">
        <p className="max-w-2xl text-xl leading-8 text-stone-600">
          &quot;Big ideas do not fail because they are too ambitious. They fail because the first step is unclear.&quot;
        </p>
        <div className="relative mt-12">
          <motion.div
            className="absolute inset-0 rounded-full border border-stone-300/60"
            animate={{ scale: [1, 1.28], opacity: [0.7, 0] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-violet-200/80"
            animate={{ scale: [1, 1.55], opacity: [0.45, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, delay: 0.35 }}
          />
          <motion.button
            aria-label="Tap to begin your founder interview"
            className="orb relative flex h-56 w-56 items-center justify-center rounded-full hover:scale-[1.02]"
            animate={{ scale: [1, 1.035, 1], rotate: [0, 1.5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            onClick={() => router.push("/interview-voice")}
          >
            <Mic className="h-14 w-14 text-white drop-shadow" />
          </motion.button>
        </div>
        <h1 className="mt-9 text-4xl font-semibold tracking-tight text-stone-950">Tap to begin your founder interview</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
          Voice starts the same focused founder interview as chat. If Gemini Live or browser speech is unavailable,
          LaunchPilot switches to text without losing the flow.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-stone-300/70"
            onClick={() => router.push("/interview-chat")}
          >
            <MessageCircle className="h-4 w-4" /> I prefer to chat
          </button>
          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/75 px-4 py-3 text-sm text-stone-600">
            <Waves className="h-4 w-4" /> Voice fallback: {speechSupported ? "Web Speech available" : "text mode ready"}
          </span>
        </div>
        <p className="mt-8 max-w-xl rounded-2xl bg-white/60 px-5 py-4 text-xs leading-5 text-stone-500 shadow-sm">
          Your voice is used only to create the founder interview transcript. You can clear your saved context anytime.
          Raw audio is not stored by default.
        </p>
      </section>
    </main>
  );
}
