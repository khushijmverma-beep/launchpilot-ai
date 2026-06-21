"use client";

import { Nav } from "@/components/Nav";
import SideRays from "@/components/animations/SideRays";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useAuth } from "@/contexts/AuthContext";
import { listProjects } from "@/lib/projects/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProjectListItem } from "@/lib/projects/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
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
      try {
        setProjects(await listProjects(userId));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load projects");
      } finally {
        setReady(true);
      }
    }

    void load();
  }, [authLoading, user, router]);

  return (
    <main className="shell-bg relative min-h-screen">
      <div style={{ position: "absolute", inset: 0, zIndex: -1 }}>
        <SideRays
          rayColor1="#444441"
          rayColor2="#888780"
          origin="top-right"
          intensity={1.5}
          spread={2}
          opacity={0.5}
        />
      </div>

      <div className="relative z-[1]">
        <Nav />

        <section className="mx-auto max-w-7xl px-5 pb-10 pt-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono-label">Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Your projects</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-lp-muted">
              One card per published interview. Open a project to see its blueprint, stats, and agent breakdown.
            </p>
          </div>
          <Link href="/start" className="btn-secondary">
            Start new interview
          </Link>
        </div>

        {!ready || authLoading ? (
          <div className="terminal-card p-6">
            <p className="font-mono text-sm text-lp-muted">Loading projects…</p>
          </div>
        ) : error ? (
          <div className="terminal-card p-6">
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="terminal-card p-8 text-center">
            <p className="mono-label">No projects yet</p>
            <h2 className="mt-3 text-xl font-semibold text-white">Publish your first interview</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-lp-muted">
              Complete a voice or chat intake, then click Publish to save a project to Firestore and see it here.
            </p>
            <Link href="/start" className="btn-primary mt-6 inline-flex">
              Start interview
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDeleted={(id) => setProjects((current) => current.filter((entry) => entry.id !== id))}
              />
            ))}
          </div>
        )}
        </section>
      </div>
    </main>
  );
}
