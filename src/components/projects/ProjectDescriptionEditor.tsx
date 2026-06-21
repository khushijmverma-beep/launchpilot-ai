"use client";

import type { Project } from "@/lib/projects/types";
import { getProjectDisplayDescription } from "@/lib/projects/description";
import { Check, Pencil, RefreshCw, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

type ProjectDescriptionEditorProps = {
  project: Pick<Project, "description" | "collectedFields" | "transcript" | "name">;
  onSave: (description: string) => void | Promise<void>;
};

export function ProjectDescriptionEditor({ project, onSave }: ProjectDescriptionEditorProps) {
  const displayDescription = getProjectDisplayDescription(project);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayDescription);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(displayDescription);
    }
  }, [displayDescription, editing]);

  function startEditing() {
    setDraft(displayDescription);
    setEditing(true);
    setError(null);
  }

  function cancel() {
    setDraft(displayDescription);
    setEditing(false);
    setError(null);
  }

  async function commit() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save description");
    } finally {
      setSaving(false);
    }
  }

  async function generateSuggestions() {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/projects/suggest-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectedFields: project.collectedFields,
          transcript: project.transcript,
          name: project.name,
          count: 4,
          exclude: suggestions,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = (await response.json()) as { descriptions: string[] };
      const next = data.descriptions.filter(Boolean);

      if (!next.length) {
        throw new Error("No descriptions returned");
      }

      setSuggestions(next);
      setSuggestionIndex(0);
      setDraft(next[0]);
      if (!editing) setEditing(true);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Could not generate descriptions");
    } finally {
      setGenerating(false);
    }
  }

  function rotateSuggestion() {
    if (suggestions.length < 2) return;
    const nextIndex = (suggestionIndex + 1) % suggestions.length;
    setSuggestionIndex(nextIndex);
    setDraft(suggestions[nextIndex]);
  }

  if (!editing) {
    return (
      <div className="mt-3 max-w-2xl">
        <p className="text-sm leading-6 text-lp-muted">{displayDescription}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={startEditing} className="btn-secondary px-2.5 py-1.5 text-xs">
            <Pencil className="mr-1.5 inline h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => void generateSuggestions()}
            disabled={generating}
            className="btn-secondary px-2.5 py-1.5 text-xs"
          >
            <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
            {generating ? "Generating…" : "Generate with AI"}
          </button>
        </div>
        {error && <p className="mt-2 font-mono text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-3 max-w-2xl space-y-2">
      <textarea
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={3}
        className="input-field w-full resize-y text-sm leading-6"
        placeholder="Describe your project…"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void generateSuggestions()}
          disabled={generating}
          className="btn-secondary px-2.5 py-1.5 text-xs"
        >
          <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
          {generating ? "Generating…" : "Generate"}
        </button>
        <button
          type="button"
          onClick={rotateSuggestion}
          disabled={generating || suggestions.length < 2}
          className="btn-secondary px-2.5 py-1.5 text-xs"
          title="Next AI suggestion"
        >
          <RefreshCw className="mr-1.5 inline h-3.5 w-3.5" />
          Rotate
        </button>
        {suggestions.length > 1 && (
          <span className="font-mono text-[10px] text-lp-subtle">
            {suggestionIndex + 1} of {suggestions.length}
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => void commit()}
            disabled={saving || !draft.trim()}
            className="btn-primary px-2.5 py-1.5 text-xs"
          >
            <Check className="mr-1.5 inline h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={cancel} disabled={saving} className="btn-secondary px-2.5 py-1.5 text-xs">
            <X className="mr-1.5 inline h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      </div>

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}
    </div>
  );
}
