"use client";

import DotField from "@/components/animations/DotField";

type DotFieldBackgroundProps = {
  /** Calm = ~30, responsive = ~55, default = ~50, landing = subtle full-page */
  bulgeStrength?: number;
  /** Lighter dots for login/form pages; landing = full-page scroll backdrop */
  variant?: "hero" | "calm" | "landing";
};

export function DotFieldBackground({ bulgeStrength, variant = "hero" }: DotFieldBackgroundProps) {
  const isCalm = variant === "calm";
  const isLanding = variant === "landing";

  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}>
      <DotField
        dotRadius={isLanding ? 1.15 : isCalm ? 1.25 : 1.5}
        dotSpacing={isLanding ? 18 : isCalm ? 16 : 14}
        cursorRadius={isLanding ? 360 : isCalm ? 420 : 500}
        bulgeStrength={bulgeStrength ?? (isLanding ? 22 : isCalm ? 32 : 48)}
        dotColor={
          isLanding ? "rgba(255, 255, 255, 0.07)" : isCalm ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.18)"
        }
        accentColor={isLanding ? "rgba(255, 255, 255, 0.1)" : "rgba(192, 132, 252, 0.5)"}
        showGlow={!isLanding}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
