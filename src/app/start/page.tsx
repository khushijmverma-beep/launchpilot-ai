"use client";

import { Nav } from "@/components/Nav";
import { Mic, MessageCircle } from "lucide-react";
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
      <section className="mx-auto flex min-h-[calc(100vh-88px)] max-w-3xl flex-col items-center justify-center px-5 pb-10 text-center">
        <p className="max-w-2xl text-xl leading-8 text-slate-600">
          “Big ideas do not fail because they are too ambitious. They fail because the first step is unclear.”
        </p>
        <motion.button
          aria-label="Tap to begin your founder interview"
          className="orb mt-10 flex h-48 w-48 items-center justify-center rounded-full hover:scale-[1.02]"
          animate={{ scale: [1, 1.035, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          onClick={() => router.push("/interview?mode=voice")}
        >
          <Mic className="h-12 w-12 text-white" />
        </motion.button>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-950">Tap to begin your founder interview</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
          Gemini Live can be connected with env keys. This demo always works with Web Speech fallback when supported and text chat when voice is unavailable.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white" onClick={() => router.push("/interview?mode=chat")}>
            <MessageCircle className="h-4 w-4" /> I prefer to chat
          </button>
          <span className="rounded-full border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
            Voice fallback: {speechSupported ? "Web Speech available" : "text mode available"}
          </span>
        </div>
        <p className="mt-8 max-w-xl text-xs leading-5 text-slate-500">
          Your voice is used only to create the founder interview transcript. You can clear your saved context anytime. Raw audio is not stored by default.
        </p>
      </section>
    </main>
  );
}
