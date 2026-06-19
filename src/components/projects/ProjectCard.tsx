"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import type { ProjectListItem } from "@/lib/projects/types";

type ProjectCardProps = {
  project: ProjectListItem;
  onDeleted: (id: string) => void;
};

export function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Failed to delete project");
      }

      setConfirmOpen(false);
      onDeleted(project.id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete project");
      setDeleting(false);
    }
  }

  return (
    <>
      <article className="terminal-card group relative p-6 transition-colors hover:border-white/30">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="absolute right-4 top-4 rounded border border-transparent p-2 text-lp-subtle transition-colors hover:border-white/20 hover:text-white"
          aria-label={`Delete ${project.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <Link href={`/projects/${project.id}`} className="block pr-8">
          <p className="mono-label text-lp-subtle">
            {new Date(project.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <h2 className="mt-3 text-xl font-semibold text-white group-hover:underline">{project.name}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-lp-muted">{project.description}</p>
          <span className="mt-5 inline-block font-mono text-xs text-lp-subtle group-hover:text-white">
            Open project →
          </span>
        </Link>

        {error && <p className="mt-3 font-mono text-xs text-red-400">{error}</p>}
      </article>

      <DeleteProjectDialog
        projectName={project.name}
        open={confirmOpen}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) {
            setConfirmOpen(false);
            setError(null);
          }
        }}
      />
    </>
  );
}
