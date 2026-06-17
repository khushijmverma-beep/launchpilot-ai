"use client";

import { Nav } from "@/components/Nav";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function continueDemo() {
    localStorage.setItem("launchpilot-user", JSON.stringify({ name: name || "Demo Founder", email, mode: "demo" }));
    router.push("/start");
  }

  return (
    <main className="shell-bg min-h-screen">
      <Nav />
      <section className="mx-auto flex min-h-[calc(100vh-88px)] max-w-xl items-center px-5 pb-10">
        <div className="glass w-full rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Demo login</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">Continue as a founder.</h1>
          <p className="mt-3 text-slate-600">No production auth is required for the hackathon MVP. Your workspace is saved in this browser.</p>
          <div className="mt-6 space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="mt-6 w-full rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white" onClick={continueDemo}>
            Continue as Demo Founder
          </button>
        </div>
      </section>
    </main>
  );
}
