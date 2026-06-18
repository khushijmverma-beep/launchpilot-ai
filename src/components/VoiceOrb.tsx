"use client";

import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

type VoiceOrbProps = {
  state: OrbState;
  isActive: boolean;
  onToggle: () => void;
  statusText?: string;
};

export function VoiceOrb({ state, isActive, onToggle, statusText }: VoiceOrbProps) {
  return (
    <div className="relative flex flex-col items-center gap-6">
      {/* Status text above orb */}
      {statusText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full bg-stone-900/80 px-5 py-2 text-sm font-medium text-white backdrop-blur-sm"
        >
          {statusText}
        </motion.div>
      )}

      {/* Pulse rings */}
      {isActive && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-violet-400/60"
            style={{ width: 280, height: 280, top: "50%", left: "50%", marginLeft: -140, marginTop: -140 }}
            animate={{
              scale: state === "listening" ? [1, 1.3, 1] : [1, 1.15, 1],
              opacity: state === "listening" ? [0.7, 0, 0.7] : [0.5, 0, 0.5],
            }}
            transition={{
              duration: state === "listening" ? 2 : 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-violet-300/40"
            style={{ width: 320, height: 320, top: "50%", left: "50%", marginLeft: -160, marginTop: -160 }}
            animate={{
              scale: state === "listening" ? [1, 1.4, 1] : [1, 1.25, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: state === "listening" ? 2.5 : 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </>
      )}

      {/* Main orb */}
      <motion.button
        onClick={onToggle}
        className="orb relative z-10 flex h-56 w-56 items-center justify-center rounded-full shadow-2xl"
        animate={{
          scale: isActive
            ? state === "listening"
              ? [1, 1.05, 1]
              : state === "thinking"
                ? [1, 1.02, 1]
                : [1, 1.03, 1]
            : 1,
        }}
        transition={{
          duration: state === "listening" ? 1.5 : state === "thinking" ? 2.5 : 2,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isActive ? "Stop voice" : "Start voice"}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-8 rounded-full bg-violet-400/30 blur-xl" />

        {/* Icon */}
        <div className="relative z-10">
          {isActive ? (
            <Square className="h-12 w-12 fill-white text-white drop-shadow-lg" />
          ) : (
            <Mic className="h-12 w-12 text-white drop-shadow-lg" />
          )}
        </div>
      </motion.button>

      {/* State indicator below orb */}
      <div className="flex items-center gap-2 text-sm text-stone-600">
        <div
          className={`h-2 w-2 rounded-full ${
            state === "listening"
              ? "bg-green-500"
              : state === "thinking"
                ? "bg-amber-500 animate-pulse"
                : state === "speaking"
                  ? "bg-violet-500 animate-pulse"
                  : "bg-stone-400"
          }`}
        />
        <span className="font-medium capitalize">{state}</span>
      </div>
    </div>
  );
}
