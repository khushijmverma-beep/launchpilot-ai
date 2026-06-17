import type { FounderProfile } from "./types";

export const demoProfile: FounderProfile = {
  name: "Aarav",
  location: "Bengaluru, India",
  status: "Student founder",
  ageRange: "18-24",
  hoursPerWeek: 10,
  budget: "Under $100 / INR 8,000",
  skills: ["AI prototyping", "product thinking", "basic React", "community building"],
  teamStatus: "Solo, with classmates who can help test",
  ideaStage: "rough idea",
  rawIdea:
    "An AI workspace that helps student founders turn scattered ideas into a practical execution plan.",
  targetUser: "Student founders in Indian colleges with early startup or hackathon ideas",
  whyItMatters:
    "They often overbuild before talking to users and do not know which first validation step matters.",
  evidence: ["personal experience", "friends/classmates", "no formal user validation yet"],
  traction: "no users",
  willingnessToLearn: "High, comfortable learning no-code and coding basics",
  riskTolerance: "Low to medium",
  success30Days: "Interview 10 student founders and get 5 to try a clickable prototype",
};

export const emptyProfile: FounderProfile = {
  name: "Demo Founder",
  location: "Undisclosed",
  status: "Student founder",
  hoursPerWeek: 6,
  budget: "Very low",
  skills: ["curiosity", "basic research"],
  teamStatus: "Solo",
  ideaStage: "no idea yet",
  rawIdea: "I do not have a clear idea yet.",
  targetUser: "A community I understand",
  whyItMatters: "I want to find a real problem before building.",
  evidence: ["no evidence yet"],
  traction: "no users",
  willingnessToLearn: "High",
  riskTolerance: "Low",
  success30Days: "Find one painful problem and interview 8 people who experience it",
};
