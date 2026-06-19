"use client";

import { getUserEmail, getUserLabel } from "@/lib/auth-session";
import { getUserProfile } from "@/lib/users/firestore";
import { PROFILE_CHANGE_EVENT } from "@/lib/users/profileEvents";
import type { FounderUserProfile } from "@/lib/users/types";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useState } from "react";

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<FounderUserProfile | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setReady(true);
      return;
    }

    try {
      setProfile(await getUserProfile(user.uid));
    } catch {
      setProfile(null);
    } finally {
      setReady(true);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    setReady(false);
    void refresh();
  }, [authLoading, refresh]);

  useEffect(() => {
    function onProfileChange(event: Event) {
      const detail = (event as CustomEvent<Partial<FounderUserProfile>>).detail;
      if (detail) {
        setProfile((current) => ({ background: "", skills: "", goals: "", ...current, ...detail }));
      }
      void refresh();
    }

    window.addEventListener(PROFILE_CHANGE_EVENT, onProfileChange);
    return () => window.removeEventListener(PROFILE_CHANGE_EVENT, onProfileChange);
  }, [refresh]);

  const fallbackName = user ? getUserLabel(user) : "Founder";
  const displayName = profile?.displayName?.trim() || fallbackName;
  const email = user ? getUserEmail(user) : "";

  return {
    profile,
    ready: ready && !authLoading,
    refresh,
    displayName,
    avatarUrl: profile?.avatarUrl ?? user?.photoURL ?? null,
    email,
    user,
  };
}
