"use client";

import { ProjectCopilot } from "@/components/projects/ProjectCopilot";
import { ContinueProjectLinks } from "@/components/projects/ContinueProjectLinks";
import { Nav } from "@/components/Nav";
import { AgentBreakdown } from "@/components/projects/AgentBreakdown";
import { BlueprintStepper } from "@/components/projects/BlueprintStepper";
import { ProjectNameEditor } from "@/components/projects/ProjectNameEditor";
import { ProjectStatsSummary } from "@/components/projects/ProjectStatsSummary";
import { StrengthsWeaknessesChart } from "@/components/projects/StrengthsWeaknessesChart";
import { useAuth } from "@/contexts/AuthContext";
import { getProject, updateProjectName, userOwnsProject } from "@/lib/projects/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProjectDisplayDescription } from "@/lib/projects/description";
import type { Project } from "@/lib/projects/types";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const userId = user.uid;

    async function load() {
      if (!params.id) return;
      try {
        const loaded = await getProject(params.id);
        if (!loaded || !userOwnsProject(loaded, userId)) {
          setProject(null);
          return;
        }
        setProject(loaded);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load project");
      } finally {
        setReady(true);
      }
    }

    void load();
  }, [params.id, authLoading, user, router]);

  async function handleRename(name: string) {
    if (!project) return;
    try {
      const updated = await updateProjectName(project.id, name);
      if (updated) setProject(updated);
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "Failed to update name");
    }
  }

  if (!ready || authLoading) {
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

      <section className="mx-auto max-w-7xl px-5 py-8 pb-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0 space-y-10">
            <div>
              <Link href="/dashboard" className="font-mono text-xs text-lp-subtle hover:text-white">
                ← Workspace
              </Link>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <ProjectNameEditor name={project.name} onSave={handleRename} />
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-lp-muted">
                    {getProjectDisplayDescription(project)}
                  </p>
                </div>
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
          </div>

          <ProjectCopilot project={project} />
        </div>
      </section>
    </main>
  );
}
