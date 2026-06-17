"use client";

import { Badge } from "@/components/Badge";
import { Nav } from "@/components/Nav";
import { generateLaunchBrief, problemDiscoveryCards } from "@/lib/agents";
import { isIrrelevantFounderQuestion, redirectMessage } from "@/lib/guardrails";
import { demoProfile, emptyProfile } from "@/lib/seed";
import type { FounderProfile } from "@/lib/types";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const questions = [
  "What should I call you?",
  "Where are you building from?",
  "How many hours per week can you realistically spend?",
  "What is your rough idea, or say 'no idea yet'?",
  "Who do you think has this problem?",
  "What evidence do you already have?",
  "What would make the next 30 days successful?",
];

function InterviewInner() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode") || "chat";
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([
    "Hey, ready to turn your idea into something real? I'll ask a few focused questions about your idea, skills, time, budget, and current stage. Then LaunchPilot will research, map risks, and build your execution plan.",
  ]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const noIdea = useMemo(() => Object.values(answers).join(" ").toLowerCase().includes("no idea"), [answers]);

  function submitAnswer() {
    if (isIrrelevantFounderQuestion(input)) {
      setMessages((prev) => [...prev, `You: ${input}`, redirectMessage]);
      setInput("");
      return;
    }
    const key = questions[step] || "extra";
    setAnswers((prev) => ({ ...prev, [key]: input }));
    const nextStep = Math.min(step + 1, questions.length);
    setStep(nextStep);
    setMessages((prev) => [
      ...prev,
      `You: ${input}`,
      nextStep < questions.length
        ? questions[nextStep]
        : "Good. I have enough context to create your Launch Brief. You can approve research or use fallback analysis.",
    ]);
    setInput("");
  }

  function buildProfile(useDemo = false): FounderProfile {
    if (useDemo) return demoProfile;
    if (noIdea) return { ...emptyProfile, name: answers[questions[0]] || emptyProfile.name, location: answers[questions[1]] || emptyProfile.location };
    return {
      ...demoProfile,
      name: answers[questions[0]] || demoProfile.name,
      location: answers[questions[1]] || demoProfile.location,
      hoursPerWeek: Number.parseInt(answers[questions[2]] || "10", 10) || 10,
      rawIdea: answers[questions[3]] || demoProfile.rawIdea,
      ideaStage: (answers[questions[3]] || "").toLowerCase().includes("no idea") ? "no idea yet" : "rough idea",
      targetUser: answers[questions[4]] || demoProfile.targetUser,
      evidence: [answers[questions[5]] || "no formal user validation yet"],
      success30Days: answers[questions[6]] || demoProfile.success30Days,
    };
  }

  function finish(useDemo = false) {
    const profile = buildProfile(useDemo);
    const brief = generateLaunchBrief(profile);
    localStorage.setItem("launchpilot-profile", JSON.stringify(profile));
    localStorage.setItem("launchpilot-brief", JSON.stringify(brief));
    router.push("/dashboard");
  }

  return (
    <main className="shell-bg min-h-screen">
      <Nav />
      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 lg:grid-cols-[1fr_380px]">
        <div className="glass rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Founder interview</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Warm, short, focused.</h1>
            </div>
            <Badge label={mode === "voice" ? "Voice fallback ready" : "Text mode"} />
          </div>
          <div className="mt-6 min-h-[420px] space-y-3 rounded-[26px] bg-white p-4">
            {messages.map((message, index) => (
              <div key={`${message}-${index}`} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.startsWith("You:") ? "ml-auto bg-slate-950 text-white" : "bg-slate-50 text-slate-700"}`}>
                {message}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" value={input} onChange={(e) => setInput(e.target.value)} placeholder={step < questions.length ? questions[step] : "Ask or finish"} onKeyDown={(e) => e.key === "Enter" && submitAnswer()} />
            <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={submitAnswer}>Send</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900" onClick={() => finish(false)}>
              Start research <ArrowRight className="h-4 w-4" />
            </button>
            <button className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900" onClick={() => finish(true)}>
              Use strong demo profile
            </button>
            <button className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900" onClick={() => finish(false)}>
              Skip and use fallback analysis
            </button>
          </div>
        </div>
        <aside className="space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">Research approval</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">LaunchPilot wants to research competitors, user pain signals, and relevant opportunities. This may use live search/API credits when configured.</p>
          </section>
          {noIdea && (
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-950">Problem Discovery Mode</h2>
              <div className="mt-4 space-y-3">
                {problemDiscoveryCards(emptyProfile).map((card) => (
                  <div key={card.problem} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <strong>{card.problem}</strong>
                      <Badge label={card.label} />
                    </div>
                    <p className="mt-2">{card.howToValidate}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h2 className="font-semibold text-slate-950">Guardrails active</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Irrelevant questions are redirected. Voice transcripts go through the same checks as text answers.</p>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default function InterviewPage() {
  return (
    <Suspense>
      <InterviewInner />
    </Suspense>
  );
}
