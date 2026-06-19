import { getCurrentUserId } from "@/lib/auth-session";
import { getUserProfile, profileToInterviewFields } from "@/lib/users/firestore";
import type { CollectedFields } from "@/lib/interview/aiInterview";
import { mergeCollectedFields } from "@/lib/interview/aiInterview";

export async function loadInterviewPrefill(userId?: string | null): Promise<CollectedFields> {
  const resolvedUserId = userId ?? getCurrentUserId();
  if (!resolvedUserId) return {};

  const profile = await getUserProfile(resolvedUserId);
  if (!profile) return {};

  return profileToInterviewFields(profile) as CollectedFields;
}

export async function mergeWithInterviewPrefill(
  fields: CollectedFields,
  userId?: string | null
): Promise<CollectedFields> {
  const prefill = await loadInterviewPrefill(userId);
  return mergeCollectedFields(prefill, fields);
}
