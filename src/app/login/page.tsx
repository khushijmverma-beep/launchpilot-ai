"use client";

import { DotFieldBackground } from "@/components/animations/DotFieldBackground";
import { Logo } from "@/components/Logo";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function continueDemo() {
    const user = { email: email || "founder@demo.local", mode: "demo" };
    localStorage.setItem("launchpilot-user", JSON.stringify(user));
    window.dispatchEvent(new Event("launchpilot-auth-change"));
    router.push("/start");
  }

  return (
    <main className="relative min-h-screen bg-black">
      <DotFieldBackground variant="calm" bulgeStrength={32} />

      <div className="page-content relative z-10 flex min-h-screen flex-col items-center justify-center px-5">
        <div className="mb-8 flex items-center gap-3 text-white">
          <Logo size={32} />
          <span className="font-mono text-sm tracking-wide">LaunchPilot AI</span>
        </div>

        <div className="w-full max-w-sm border border-white/15 bg-black/80 p-8">
          <p className="mono-label">Sign in</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Continue to your workspace</h1>

          <div className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mono-label mb-2 block">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="mono-label mb-2 block">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button className="btn-primary mt-8 w-full" onClick={continueDemo}>
            Continue
          </button>

          <p className="mt-6 text-center font-mono text-xs text-lp-subtle">
            Demo mode — no production auth required
          </p>
        </div>
      </div>
    </main>
  );
}
