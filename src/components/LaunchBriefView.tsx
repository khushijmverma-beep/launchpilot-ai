"use client";

import { Badge } from "@/components/Badge";
import { copilotReply } from "@/lib/agents";
import type { LaunchBrief } from "@/lib/types";
import { Download, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function briefToMarkdown(brief: LaunchBrief) {
  return `# Launch Brief

## Founder Snapshot
${brief.profile.name} in ${brief.profile.location}. ${brief.profile.status}. ${brief.profile.hoursPerWeek} hours/week. Budget: ${brief.profile.budget}.

## Refined Idea
${brief.refinedIdea}

## Problem
${brief.problem}

## Target User
${brief.targetUser}

## Market Reality
Alternatives: ${brief.competitors.join("; ")}

## Opportunities
${brief.opportunities.map((item) => `- ${item}`).join("\n")}

## Assumptions
${brief.assumptions.map((item) => `- ${item}`).join("\n")}

## Risks
${brief.risks.map((item) => `- ${item}`).join("\n")}

## MVP Scope
${brief.mvpScope.map((item) => `- ${item}`).join("\n")}

## Current Bottleneck
${brief.currentBottleneck}

## Founder Reality Check
Readiness: ${brief.readinessLabel}
Strongest point: ${brief.strongestPoint}
Weakest point: ${brief.weakestPoint}
Next validation task: ${brief.nextValidationTask}

## Roadmap
${brief.roadmap.map((stage) => `### ${stage.horizon}\n${stage.actions.map((item) => `- ${item}`).join("\n")}`).join("\n\n")}

## Skill Gaps
${brief.skillGaps.map((item) => `- ${item}`).join("\n")}

## Pitch Assets
One-line pitch: ${brief.pitchAssets.oneLinePitch}
Elevator pitch: ${brief.pitchAssets.elevatorPitch}

## Responsible AI Notes
${brief.responsibleAINotes.map((item) => `- ${item}`).join("\n")}

## Sources
${brief.sources.map((source) => `- ${source.title}: ${source.url} (${source.label})`).join("\n")}
`;
}

export function LaunchBriefView({ brief }: { brief: LaunchBrief }) {
  const [question, setQuestion] = useState("Should I drop out?");
  const [answer, setAnswer] = useState(copilotReply("What should I do next?", brief));
  const markdown = useMemo(() => briefToMarkdown(brief), [brief]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <main className="space-y-5">
        <section className="glass rounded-[28px] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Launch Brief Workspace</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                {brief.currentBottleneck}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{brief.nextValidationTask}</p>
            </div>
            <Badge label={brief.readinessLabel} />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="text-xs text-slate-500">Strongest point</p>
              <p className="mt-2 font-medium text-slate-900">{brief.strongestPoint}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="text-xs text-slate-500">Weakest point</p>
              <p className="mt-2 font-medium text-slate-900">{brief.weakestPoint}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="text-xs text-slate-500">What not to do yet</p>
              <p className="mt-2 font-medium text-slate-900">Do not chase VC outreach or dropout decisions before validation.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {brief.agents.map((agent) => (
            <article key={agent.name} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-950">{agent.name}</h2>
                  <p className="text-sm text-slate-500">{agent.role}</p>
                </div>
                <Badge label={agent.label} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">{agent.finding}</p>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Recommendation: {agent.reasoning.recommendation}</p>
                <p className="mt-2">Why: {agent.reasoning.why}</p>
                <p className="mt-2">How to validate: {agent.reasoning.howToValidate}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {brief.workspace.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.type}</p>
                  <h3 className="mt-2 font-semibold text-slate-950">{item.title}</h3>
                </div>
                <Badge label={item.label} />
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{item.content}</p>
            </article>
          ))}
        </section>
      </main>

      <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
        <section className="glass rounded-[28px] p-5">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-slate-950">Context Copilot</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            I use your saved profile, bottleneck, roadmap, opportunities, and reality check. I will push back when the plan is skipping validation.
          </p>
          <textarea
            className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button
            className="mt-3 w-full rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={() => setAnswer(copilotReply(question, brief))}
          >
            Ask with context
          </button>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{answer}</div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-slate-950">Export</h2>
          </div>
          <div className="mt-4 grid gap-2">
            <button className="rounded-full border border-slate-200 px-4 py-3 text-sm font-medium hover:bg-slate-50" onClick={() => navigator.clipboard.writeText(markdown)}>
              Copy Launch Brief
            </button>
            <button className="rounded-full border border-slate-200 px-4 py-3 text-sm font-medium hover:bg-slate-50" onClick={() => downloadFile("launch-brief.md", markdown, "text/markdown")}>
              Download Markdown
            </button>
            <button className="rounded-full border border-slate-200 px-4 py-3 text-sm font-medium hover:bg-slate-50" onClick={() => downloadFile("launch-brief.json", JSON.stringify(brief, null, 2), "application/json")}>
              Download JSON
            </button>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h2 className="font-semibold text-slate-950">Responsible AI</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            {brief.responsibleAINotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <h2 className="font-semibold text-slate-950">Pitch Assets</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{brief.pitchAssets.oneLinePitch}</p>
          <ol className="mt-4 space-y-2 text-sm text-slate-600">
            {brief.pitchAssets.deckOutline.map((slide, index) => (
              <li key={slide}>{index + 1}. {slide}</li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
