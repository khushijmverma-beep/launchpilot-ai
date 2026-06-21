"use client";

import { ContinueProjectLinks } from "@/components/projects/ContinueProjectLinks";
import type { Project } from "@/lib/projects/types";
import { ListChecks, MessageCircle, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const SUGGESTED_QUESTIONS = [
  "What should I do today?",
  "Biggest risk?",
  "Top competitors?",
];

function buildChecklistItems(project: Project): string[] {
  if (project.blueprint?.length) {
    return project.blueprint.slice(0, 8).map((step) => {
      const split = step.indexOf(": ");
      return split >= 0 ? step.slice(split + 2) : step;
    });
  }

  const goal = project.collectedFields?.thirtyDayGoal?.trim();
  const target = project.collectedFields?.targetUser?.trim();

  return [
    goal ? `Progress on 30-day goal: ${goal}` : "Pick one assumption to test this week",
    target ? `Interview 3 ${target.toLowerCase()} about the problem` : "Run 3 problem interviews",
    "Capture exact quotes — no leading questions",
    "Note who asked to try a prototype",
    "Update your Launch Brief after new evidence",
  ];
}

function checklistStorageKey(projectId: string) {
  return `launchpilot-checklist-${projectId}`;
}

type ProjectCopilotProps = {
  project: Project;
};

export function ProjectCopilot({ project }: ProjectCopilotProps) {
  const checklistItems = useMemo(() => buildChecklistItems(project), [project]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(checklistStorageKey(project.id));
      if (raw) setChecked(JSON.parse(raw) as Record<number, boolean>);
    } catch {
      setChecked({});
    }
  }, [project.id]);

  function toggleItem(index: number) {
    setChecked((prev) => {
      const next = { ...prev, [index]: !prev[index] };
      try {
        localStorage.setItem(checklistStorageKey(project.id), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const doneCount = checklistItems.filter((_, index) => checked[index]).length;

  async function ask(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setQuestion(trimmed);

    try {
      const response = await fetch("/api/projects/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, project }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = (await response.json()) as { answer: string };
      setAnswer(data.answer);
    } catch (askError) {
      console.error("Copilot ask failed:", askError);
      setError(askError instanceof Error ? askError.message : "Could not get an answer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="min-w-0 space-y-2 lg:sticky lg:top-5 lg:max-h-[calc(100vh-5rem)] lg:self-start lg:overflow-y-auto">
      <ContinueProjectLinks projectId={project.id} />

      <section className="terminal-card p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <ListChecks className="h-3 w-3 shrink-0 text-white" />
            <h2 className="text-xs font-semibold text-white">What to do</h2>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-lp-subtle">
            {doneCount}/{checklistItems.length}
          </span>
        </div>

        <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto">
          {checklistItems.map((item, index) => {
            const isDone = Boolean(checked[index]);
            return (
              <li key={`${index}-${item}`}>
                <label className="flex cursor-pointer items-start gap-1.5 rounded px-0.5 py-0.5 hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleItem(index)}
                    className="mt-0.5 h-3 w-3 shrink-0 accent-white"
                  />
                  <span
                    className={`min-w-0 flex-1 break-words text-[11px] leading-snug ${
                      isDone ? "text-lp-subtle line-through" : "text-lp-muted"
                    }`}
                  >
                    {item}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="terminal-card p-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <MessageCircle className="h-3 w-3 shrink-0 text-white" />
          <h2 className="text-xs font-semibold text-white">Copilot</h2>
        </div>

        <div className="mt-1.5 flex flex-col gap-1">
          {SUGGESTED_QUESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="w-full rounded border border-lp-border px-2 py-1 text-left text-[10px] leading-snug break-words text-lp-subtle transition hover:border-white hover:text-white"
              onClick={() => void ask(suggestion)}
              disabled={loading}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-1.5 flex gap-1">
          <textarea
            className="min-h-[2rem] min-w-0 flex-1 resize-none rounded border border-lp-border bg-black/40 p-1.5 text-[11px] leading-snug break-words text-white outline-none placeholder:text-lp-subtle focus:border-white"
            placeholder="Ask about your project…"
            rows={1}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void ask(question);
              }
            }}
          />
          <button
            type="button"
            className="btn-primary flex shrink-0 items-center justify-center gap-1 px-2 py-1.5 text-[10px]"
            onClick={() => void ask(question)}
            disabled={loading || !question.trim()}
          >
            <Send className="h-3 w-3" />
            {loading ? "…" : "Ask"}
          </button>
        </div>

        {error && (
          <p className="mt-1.5 break-words font-mono text-[10px] leading-snug text-red-400">{error}</p>
        )}

        {answer && (
          <div className="mt-1.5 break-words rounded border border-lp-border bg-black/30 p-2 text-[11px] leading-snug text-lp-muted">
            {answer}
          </div>
        )}

        {!answer && !loading && (
          <p className="mt-1.5 break-words text-[10px] leading-snug text-lp-subtle">
            Uses your interview, roadmap, and agent outputs.
          </p>
        )}
      </section>
    </aside>
  );
}
