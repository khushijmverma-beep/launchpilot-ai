"use client";

import { Nav } from "@/components/Nav";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { getUserEmail } from "@/lib/auth-session";
import { getUserProjectSummary, listRecentProjects } from "@/lib/projects/firestore";
import { getUserProfile, saveUserProfile } from "@/lib/users/firestore";
import { OPEN_EDIT_PROFILE_EVENT } from "@/lib/users/profileEvents";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { FounderUserProfile, UserProjectSummary } from "@/lib/users/types";
import { formatLastActive, formatRelativeTime, inferSchoolFromEmail } from "@/lib/users/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { RecentProjectRow } from "@/lib/users/types";

const emptyProfile: FounderUserProfile = {
  background: "",
  skills: "",
  goals: "",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { displayName, avatarUrl, refresh: refreshIdentity } = useUserProfile();
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [profile, setProfile] = useState<FounderUserProfile>(emptyProfile);
  const [stats, setStats] = useState<UserProjectSummary>({
    projectCount: 0,
    avgConfidence: null,
    lastActive: null,
  });
  const [recentProjects, setRecentProjects] = useState<RecentProjectRow[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    function openEdit() {
      setEditOpen(true);
    }
    window.addEventListener(OPEN_EDIT_PROFILE_EVENT, openEdit);
    return () => window.removeEventListener(OPEN_EDIT_PROFILE_EVENT, openEdit);
  }, []);

  useEffect(() => {
    async function load() {
      if (authLoading) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      setReady(false);
      const userId = user.uid;
      const email = getUserEmail(user);
      setUserEmail(email);

      try {
        const [userProfile, projectStats, recent] = await Promise.all([
          getUserProfile(userId),
          getUserProjectSummary(userId),
          listRecentProjects(userId, 3),
        ]);

        const loaded = userProfile ?? emptyProfile;
        setProfile(loaded);
        setStats(projectStats);
        setRecentProjects(recent);

        const school = userProfile?.school || inferSchoolFromEmail(email);
        setSubtitle(school ? `FOUNDER · ${school}` : email);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load profile");
      } finally {
        setReady(true);
      }
    }

    void load();
  }, [router, user, authLoading]);

  function updateField(key: keyof Pick<FounderUserProfile, "background" | "skills" | "goals">, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const savedDoc = await saveUserProfile(user.uid, {
        background: profile.background,
        skills: profile.skills,
        goals: profile.goals,
        email: getUserEmail(user),
        displayName: displayName,
        school: inferSchoolFromEmail(getUserEmail(user)) ?? undefined,
      });
      setProfile(savedDoc);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setProfile(emptyProfile);
    setSaved(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  if (!ready || authLoading) {
    return (
      <main className="shell-bg min-h-screen">
        <Nav />
        <section className="mx-auto max-w-3xl px-5 py-10">
          <p className="font-mono text-sm text-lp-muted">Loading profile…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell-bg min-h-screen">
      <Nav />

      <section className="mx-auto max-w-3xl space-y-6 px-5 py-8 pb-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar name={displayName} avatarUrl={avatarUrl} onClick={() => setEditOpen(true)} />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">{displayName}</h1>
              <p className="mt-1 font-mono text-sm text-lp-muted">{userEmail}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-lp-subtle">{subtitle}</p>
            </div>
          </div>
          <button type="button" className="btn-secondary text-xs" onClick={() => setEditOpen(true)}>
            Edit profile
          </button>
        </div>

        {error && (
          <div className="profile-section-card">
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="profile-stat-card">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-lp-subtle">Projects published</p>
            <p className="mt-2 text-[22px] font-medium text-white">{stats.projectCount}</p>
          </div>
          <div className="profile-stat-card">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-lp-subtle">Avg confidence</p>
            <p className="mt-2 text-[22px] font-medium text-white">
              {stats.avgConfidence != null ? `${stats.avgConfidence}/100` : "—"}
            </p>
          </div>
          <div className="profile-stat-card">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-lp-subtle">Last active</p>
            <p className="mt-2 text-[22px] font-medium text-white">{formatLastActive(stats.lastActive)}</p>
          </div>
        </div>

        <div className="profile-section-card space-y-5">
          <div>
            <h2 className="profile-section-title">Founder profile</h2>
            <p className="mt-1 text-xs text-lp-muted">Used to personalize every new interview</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="background" className="profile-field-label mb-2 block">
                Background
              </label>
              <input
                id="background"
                className="input-field"
                value={profile.background}
                onChange={(e) => updateField("background", e.target.value)}
                placeholder="Student at UTD, exploring B2B SaaS…"
              />
            </div>
            <div>
              <label htmlFor="skills" className="profile-field-label mb-2 block">
                Skills
              </label>
              <input
                id="skills"
                className="input-field"
                value={profile.skills}
                onChange={(e) => updateField("skills", e.target.value)}
                placeholder="React, product design, sales…"
              />
            </div>
            <div>
              <label htmlFor="goals" className="profile-field-label mb-2 block">
                Goals
              </label>
              <input
                id="goals"
                className="input-field"
                value={profile.goals}
                onChange={(e) => updateField("goals", e.target.value)}
                placeholder="Validate idea and ship MVP in 30 days…"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear} disabled={saving}>
              Clear
            </button>
          </div>

          <p className="font-mono text-xs text-lp-subtle">
            {saved ? "Saved to your account." : "Changes stay local until you save."}
          </p>
        </div>

        <div className="profile-section-card">
          <div className="mb-4">
            <h2 className="profile-section-title">Recent projects</h2>
            <p className="mt-1 text-xs text-lp-muted">Your latest published work</p>
          </div>

          {recentProjects.length === 0 ? (
            <p className="font-mono text-sm text-lp-muted">No projects yet. Publish an interview to see it here.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-white"
                  >
                    <span className="text-sm text-white">{project.name}</span>
                    <span className="shrink-0 font-mono text-xs text-lp-subtle">
                      {formatRelativeTime(project.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-lp-subtle">Account</span>
          <button type="button" className="btn-secondary px-4 py-2 text-xs" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </section>

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialDisplayName={displayName}
        initialAvatarUrl={avatarUrl}
        onSaved={() => {
          void refreshIdentity();
        }}
      />
    </main>
  );
}
