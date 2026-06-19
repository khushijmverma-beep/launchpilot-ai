import type { FounderUserProfile } from "./types";

export const PROFILE_CHANGE_EVENT = "launchpilot-profile-change";
export const OPEN_EDIT_PROFILE_EVENT = "launchpilot-open-edit-profile";

export function dispatchProfileChange(profile: Partial<FounderUserProfile>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_CHANGE_EVENT, { detail: profile }));
}

export function dispatchOpenEditProfile() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_EDIT_PROFILE_EVENT));
}
