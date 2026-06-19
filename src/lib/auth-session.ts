import type { User } from "firebase/auth";

let authUserSnapshot: User | null = null;

/** Updated by AuthProvider on every Firebase auth state change. */
export function setAuthUserSnapshot(user: User | null): void {
  authUserSnapshot = user;
}

export function getAuthUser(): User | null {
  return authUserSnapshot;
}

export function getCurrentUserId(): string | null {
  return authUserSnapshot?.uid ?? null;
}

export function getUserLabel(user: User): string {
  if (user.displayName?.trim()) return user.displayName.trim();
  if (user.email?.trim()) return user.email.split("@")[0];
  return "Founder";
}

export function getUserEmail(user: User): string {
  return user.email?.trim() || "";
}

export function userHasPasswordProvider(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === "password");
}

const LOCAL_DATA_KEYS = [
  "launchpilot-profile",
  "launchpilot-brief",
  "launchpilot-interview",
  "launchpilot-interview-state",
] as const;

export function clearLaunchPilotLocalData(): void {
  if (typeof window === "undefined") return;
  for (const key of LOCAL_DATA_KEYS) {
    localStorage.removeItem(key);
  }
}
