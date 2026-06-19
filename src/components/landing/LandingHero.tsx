"use client";

import TextType from "@/components/animations/TextType";
import { StartBuildingLink } from "@/components/landing/StartBuildingLink";

const typewriterPhrases = [
  "an MVP roadmap",
  "a market analysis",
  "a pitch-ready plan",
  "a validation sprint",
];

export function LandingHero() {
  return (
    <section className="relative min-h-[70vh]">
      <div className="page-content relative z-10 mx-auto flex max-w-5xl flex-col items-center justify-center px-5 py-24 text-center">
        <p className="font-mono text-sm font-medium tracking-[0.18em] text-white uppercase md:text-base">
          LaunchPilot AI
        </p>
        <p className="mono-label mt-3 text-lp-subtle">Founder execution navigator</p>

        <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl">
          Turn your idea into{" "}
          <TextType
            text={typewriterPhrases}
            className="font-mono text-white"
            typingSpeed={55}
            deletingSpeed={35}
            pauseDuration={2200}
            showCursor
            cursorCharacter="|"
            cursorClassName="text-white/70"
          />
        </h1>

        <p className="mt-6 max-w-xl text-base leading-7 text-lp-muted">
          LaunchPilot AI interviews you, runs grounded research agents, and outputs a practical roadmap — with evidence labels and human approval at every step.
        </p>

        <StartBuildingLink />
      </div>
    </section>
  );
}
