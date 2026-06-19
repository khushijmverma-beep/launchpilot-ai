"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildProjectFromInterview, shouldRunResearchEvaluation } from "@/lib/projects/publish";
import { createProject, getProject, updateProject } from "@/lib/projects/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { buildIntakeFromFields, type CollectedFields } from "@/lib/interview/aiInterview";
import { runResearchEvaluation } from "@/lib/research/researchAgent";
import type { EvidenceScore } from "@/lib/intake/schema";
import type { TranscriptEntry } from "@/lib/projects/types";

type PublishProjectButtonProps = {
  collectedFields: CollectedFields;
  transcript: TranscriptEntry[];
  evidenceScore?: EvidenceScore | null;
  projectId?: string;
  onBeforePublish?: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export function PublishProjectButton({
  collectedFields,
  transcript,
  evidenceScore,
  projectId,
  onBeforePublish,
  disabled,
  className = "btn-primary",
  label = "Publish project",
}: PublishProjectButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    if (loading || disabled || transcript.length === 0) return;

    setLoading(true);
    setError(null);
    onBeforePublish?.();

    try {
      const existing = projectId ? await getProject(projectId) : null;
      let score = evidenceScore ?? undefined;

      if (!score && shouldRunResearchEvaluation(collectedFields, transcript, existing)) {
        const intake = buildIntakeFromFields(collectedFields, transcript);
        score = await runResearchEvaluation(intake);
      }

      const nameResponse = await fetch("/api/projects/suggest-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectedFields,
          transcript,
          existingName: existing?.name ?? null,
        }),
      });

      if (!nameResponse.ok) {
        throw new Error(await nameResponse.text());
      }

      const { name: resolvedName } = (await nameResponse.json()) as { name: string };

      const payload = buildProjectFromInterview(
        {
          collectedFields,
          transcript,
          evidenceScore: score,
          projectId,
          resolvedName,
        },
        existing
      );

      const userId = user?.uid;
      const document = userId ? { ...payload, userId } : payload;

      const id = projectId ?? (await createProject(document));
      if (projectId) {
        await updateProject(projectId, document);
      }

      router.push(`/projects/${id}`);
    } catch (publishError) {
      console.error("Publish failed:", publishError);
      setError(publishError instanceof Error ? publishError.message : "Publish failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" className={className} onClick={handlePublish} disabled={disabled || loading}>
        {loading ? "Publishing…" : label}
      </button>
      {error && <p className="font-mono text-xs text-red-400">{error}</p>}
    </div>
  );
}
