export type FounderUserProfile = {
  background: string;
  skills: string;
  goals: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  school?: string;
  updatedAt?: string;
};

export type UserProjectSummary = {
  projectCount: number;
  avgConfidence: number | null;
  lastActive: string | null;
};

export type RecentProjectRow = {
  id: string;
  name: string;
  updatedAt: string;
};
