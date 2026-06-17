import { Nav } from "@/components/Nav";
import { ArrowRight, CheckCircle2, Search, Sparkles } from "lucide-react";
import Link from "next/link";

const cards = [
  { title: "Clarify your idea", body: "A warm interview turns scattered context into a founder snapshot, assumptions, and a sharper problem.", icon: Sparkles },
  { title: "Research market reality", body: "Visible agents label competitors, opportunities, confidence, and what still needs human validation.", icon: Search },
  { title: "Create your first real step", body: "LaunchPilot finds the current bottleneck and writes a practical 24-hour and 7-day validation plan.", icon: CheckCircle2 },
];

export default function Home() {
  return (
    <main className="shell-bg min-h-screen">
      <Nav />
      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-10 px-5 pb-10 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Built for student founders who need clarity before they build.</p>
          <h1 className="mt-5 max-w-4xl text-balance text-5xl font-semibold tracking-tight text-slate-950 md:text-7xl">
            Turn your vague idea into a real execution plan.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            LaunchPilot AI interviews you, researches your market, maps risks, finds opportunities, and builds a practical MVP roadmap with evidence and human control.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300 hover:-translate-y-0.5" href="/login">
              Start Founder Interview <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="rounded-full border border-slate-200 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-white" href="/dashboard?demo=1">
              Try Demo User
            </Link>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {cards.map(({ title, body, icon: Icon }) => (
              <div key={title} className="rounded-3xl border border-white/70 bg-white/68 p-4 shadow-sm">
                <Icon className="h-5 w-5 text-blue-600" />
                <h2 className="mt-4 font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-[32px] p-5">
          <div className="rounded-[26px] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">What LaunchPilot produces</p>
            <div className="mt-5 space-y-3">
              {["Founder Snapshot", "Current Bottleneck", "Reality Check", "Validation Roadmap", "Pitch Assets", "Sources"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">{item}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-500">saved</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-[26px] border border-blue-100 bg-blue-50/70 p-5 text-sm leading-6 text-slate-700">
            LaunchPilot can make mistakes. Treat market data as guidance, not proof. Validate important decisions with real users and trusted advisors.
          </div>
        </div>
      </section>
    </main>
  );
}
