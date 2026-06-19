"use client";

import { DotFieldBackground } from "@/components/animations/DotFieldBackground";

export function LandingPageBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <DotFieldBackground variant="landing" bulgeStrength={22} />
    </div>
  );
}
