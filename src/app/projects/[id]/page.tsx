"use client";

import { ContinueProjectLinks } from "@/components/projects/ContinueProjectLinks";
import { Nav } from "@/components/Nav";
import { AgentBreakdown } from "@/components/projects/AgentBreakdown";
import { BlueprintStepper } from "@/components/projects/BlueprintStepper";
import { ProjectNameEditor } from "@/components/projects/ProjectNameEditor";
import { ProjectStatsSummary } from "@/components/projects/ProjectStatsSummary";
import { StrengthsWeaknessesChart } from "@/components/projects/StrengthsWeaknessesChart";
import { getProject, updateProjectName } from "@/lib/projects/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/projects/types";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!params.id) return;
      try {
        setProject(await getProject(params.id));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load project");
      } finally {
        setReady(true);
      }
    }

    void load();
  }, [params.id]);

  async function handleRename(name: string) {
    if (!project) return;
    try {
      const updated = await updateProjectName(project.id, name);
      if (updated) setProject(updated);
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "Failed to update name");
    }
  }

  if (!ready) {
    return (
      <main className="shell-bg min-h-screen">
        <Nav />
        <section className="mx-auto max-w-5xl px-5 py-10">
          <p className="font-mono text-sm text-lp-muted">Loading project…</p>
        </section>
      </main>
    );
  }

  if (error && !project) {
    return (
      <main className="shell-bg min-h-screen">
        <Nav />
        <section className="mx-auto max-w-5xl px-5 py-10">
          <div className="terminal-card p-8">
            <p className="font-mono text-sm text-red-400">{error}</p>
            <Link href="/dashboard" className="btn-primary mt-6 inline-flex">
              Back to workspace
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="shell-bg min-h-screen">
        <Nav />
        <section className="mx-auto max-w-5xl px-5 py-10">
          <div className="terminal-card p-8">
            <p className="mono-label">Not found</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Project not found</h1>
            <Link href="/dashboard" className="btn-primary mt-6 inline-flex">
              Back to workspace
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell-bg min-h-screen">
      <Nav />

      <section className="mx-auto max-w-5xl space-y-10 px-5 py-8 pb-16">
        <div>
          <Link href="/dashboard" className="font-mono text-xs text-lp-subtle hover:text-white">
            ← Workspace
          </Link>
          <div className="mt-4">
            <ProjectNameEditor name={project.name} onSave={handleRename} />
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-lp-muted">{project.description}</p>
          <div className="mt-6">
            <ContinueProjectLinks projectId={project.id} />
          </div>
        </div>

        <section>
          <p className="mono-label mb-4">Stats summary</p>
          <ProjectStatsSummary
            stats={project.stats}
            agentOutputs={project.agentOutputs}
            strengthsWeaknesses={project.strengthsWeaknesses}
          />
        </section>

        <section>
          <p className="mono-label mb-4">Step-by-step blueprint</p>
          <BlueprintStepper blueprint={project.blueprint} />
        </section>

        <section>
          <StrengthsWeaknessesChart categories={project.strengthsWeaknesses} />
        </section>

        <section>
          <p className="mono-label mb-4">Multi-agent breakdown</p>
          <AgentBreakdown agentOutputs={project.agentOutputs} />
        </section>
      </section>
    </main>
  );
}
