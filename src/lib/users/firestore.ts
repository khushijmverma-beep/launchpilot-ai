import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FounderUserProfile } from "./types";

type FirestoreUserDoc = {
  background: string;
  skills: string;
  goals: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  school?: string;
  updatedAt: Timestamp;
};

function timestampToIso(value: Timestamp | undefined): string {
  return value?.toDate?.()?.toISOString() ?? new Date().toISOString();
}

function docToProfile(data: DocumentData): FounderUserProfile {
  const record = data as FirestoreUserDoc;
  return {
    background: record.background ?? "",
    skills: record.skills ?? "",
    goals: record.goals ?? "",
    email: record.email,
    displayName: record.displayName,
    avatarUrl: record.avatarUrl,
    school: record.school,
    updatedAt: timestampToIso(record.updatedAt),
  };
}

export async function getUserProfile(userId: string): Promise<FounderUserProfile | null> {
  const snapshot = await getDoc(doc(db, "users", userId));
  if (!snapshot.exists()) return null;
  return docToProfile(snapshot.data());
}

export async function saveUserProfile(
  userId: string,
  profile: Pick<FounderUserProfile, "background" | "skills" | "goals"> & {
    email?: string;
    displayName?: string;
    school?: string;
  }
): Promise<FounderUserProfile> {
  const ref = doc(db, "users", userId);
  const document: Partial<FirestoreUserDoc> = {
    background: profile.background.trim(),
    skills: profile.skills.trim(),
    goals: profile.goals.trim(),
    email: profile.email,
    displayName: profile.displayName,
    school: profile.school,
    updatedAt: Timestamp.now(),
  };

  await setDoc(ref, document, { merge: true });

  const saved = await getUserProfile(userId);
  return saved ?? { ...profile, updatedAt: new Date().toISOString() };
}

export async function saveUserIdentity(
  userId: string,
  identity: { displayName: string; avatarUrl?: string; email?: string }
): Promise<FounderUserProfile> {
  const ref = doc(db, "users", userId);
  const trimmedName = identity.displayName.trim();

  await setDoc(
    ref,
    {
      displayName: trimmedName,
      ...(identity.avatarUrl ? { avatarUrl: identity.avatarUrl } : {}),
      ...(identity.email ? { email: identity.email } : {}),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  const saved = await getUserProfile(userId);
  return (
    saved ?? {
      background: "",
      skills: "",
      goals: "",
      displayName: trimmedName,
      avatarUrl: identity.avatarUrl,
      email: identity.email,
      updatedAt: new Date().toISOString(),
    }
  );
}

export function profileToInterviewFields(profile: FounderUserProfile): Record<string, string> {
  const fields: Record<string, string> = {};
  if (profile.skills.trim()) fields.skills = profile.skills.trim();
  if (profile.goals.trim()) fields.thirtyDayGoal = profile.goals.trim();
  if (profile.background.trim()) fields.status = profile.background.trim();
  return fields;
}

export async function deleteUserProfile(userId: string): Promise<void> {
  const ref = doc(db, "users", userId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return;
  await deleteDoc(ref);
}
