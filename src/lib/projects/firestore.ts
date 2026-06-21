import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  Timestamp,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createEmptyAgentOutputs } from "./defaults";
import type { Project, ProjectListItem } from "./types";
import type { RecentProjectRow, UserProjectSummary } from "@/lib/users/types";

type FirestoreProjectDoc = {
  name: string;
  description: string;
  blueprint: string[];
  stats: Project["stats"];
  strengthsWeaknesses: Project["strengthsWeaknesses"];
  agentOutputs: Project["agentOutputs"];
  transcript: Project["transcript"];
  collectedFields: Project["collectedFields"];
  conversationId?: string;
  userId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

function timestampToIso(value: Timestamp | undefined): string {
  return value?.toDate?.()?.toISOString() ?? new Date().toISOString();
}

function stripUndefined<T>(value: T): T {
  if (value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }

  if (value !== null && typeof value === "object" && !(value instanceof Timestamp)) {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (nested === undefined) continue;
      result[key] = stripUndefined(nested);
    }
    return result as T;
  }

  return value;
}

function docToProject(id: string, data: DocumentData): Project {
  const record = data as FirestoreProjectDoc;
  return {
    id,
    name: record.name,
    description: record.description ?? "",
    blueprint: record.blueprint ?? [],
    stats: record.stats ?? null,
    strengthsWeaknesses: record.strengthsWeaknesses ?? [],
    agentOutputs: record.agentOutputs ?? createEmptyAgentOutputs(),
    transcript: record.transcript ?? [],
    collectedFields: record.collectedFields ?? {},
    conversationId: record.conversationId,
    userId: record.userId,
    createdAt: timestampToIso(record.createdAt),
    updatedAt: timestampToIso(record.updatedAt),
  };
}

export async function createProject(
  payload: Omit<Project, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = doc(collection(db, "projects"));
  const now = Timestamp.now();

  const document: FirestoreProjectDoc = stripUndefined({
    ...payload,
    createdAt: now,
    updatedAt: now,
  });

  await setDoc(ref, document);
  return ref.id;
}

export async function updateProject(
  id: string,
  payload: Omit<Project, "id" | "createdAt" | "updatedAt">
): Promise<void> {
  const ref = doc(db, "projects", id);

  await updateDoc(
    ref,
    stripUndefined({
      ...payload,
      updatedAt: Timestamp.now(),
    })
  );
}

export async function listProjects(userId?: string | null): Promise<ProjectListItem[]> {
  if (!userId) return [];

  const snapshot = await getDocs(query(collection(db, "projects"), where("userId", "==", userId)));

  return snapshot.docs
    .map((entry) => {
      const data = entry.data() as FirestoreProjectDoc;
      return {
        id: entry.id,
        name: data.name,
        description: data.description,
        createdAt: timestampToIso(data.createdAt),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUserProjectSummary(userId: string): Promise<UserProjectSummary> {
  const snapshot = await getDocs(query(collection(db, "projects"), where("userId", "==", userId)));

  let confidenceTotal = 0;
  let confidenceCount = 0;
  let lastActive: string | null = null;

  for (const entry of snapshot.docs) {
    const data = entry.data() as FirestoreProjectDoc;
    const updated = timestampToIso(data.updatedAt);
    if (!lastActive || updated > lastActive) {
      lastActive = updated;
    }
    if (data.stats?.confidenceScore != null) {
      confidenceTotal += data.stats.confidenceScore;
      confidenceCount += 1;
    }
  }

  return {
    projectCount: snapshot.size,
    avgConfidence: confidenceCount > 0 ? Math.round(confidenceTotal / confidenceCount) : null,
    lastActive,
  };
}

export async function listRecentProjects(userId: string, limit = 3): Promise<RecentProjectRow[]> {
  const snapshot = await getDocs(query(collection(db, "projects"), where("userId", "==", userId)));

  return snapshot.docs
    .map((entry) => {
      const data = entry.data() as FirestoreProjectDoc;
      return {
        id: entry.id,
        name: data.name,
        updatedAt: timestampToIso(data.updatedAt),
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

export async function getProject(id: string): Promise<Project | null> {
  const snapshot = await getDoc(doc(db, "projects", id));
  if (!snapshot.exists()) return null;
  return docToProject(snapshot.id, snapshot.data());
}

export function userOwnsProject(
  project: Pick<Project, "userId">,
  userId: string | null | undefined
): boolean {
  if (!userId || !project.userId) return false;
  return project.userId === userId;
}

export async function updateProjectName(id: string, name: string): Promise<Project | null> {
  const ref = doc(db, "projects", id);
  const trimmed = name.trim();
  if (!trimmed) return getProject(id);

  await updateDoc(ref, {
    name: trimmed,
    updatedAt: Timestamp.now(),
  });

  return getProject(id);
}

export async function deleteProject(id: string): Promise<void> {
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new Error("Project id is required");
  }

  const ref = doc(db, "projects", trimmedId);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return;
  }

  await deleteDoc(ref);

  const verify = await getDoc(ref);
  if (verify.exists()) {
    throw new Error("Project was not removed from Firestore. Check your database permissions.");
  }
}

export async function deleteAllUserProjects(userId: string): Promise<number> {
  const snapshot = await getDocs(query(collection(db, "projects"), where("userId", "==", userId)));
  await Promise.all(snapshot.docs.map((entry) => deleteDoc(entry.ref)));
  return snapshot.size;
}
