import { z } from "zod";

export const FounderIntakeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  locationCountry: z.string().min(1, "Country is required"),
  locationCity: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  hoursPerWeek: z.number().min(0).max(168),
  budget: z.string(),
  skills: z.array(z.string()),
  teamStatus: z.string(),
  stage: z.enum(["no idea yet", "rough idea", "started building", "MVP exists", "users exist", "revenue exists"]),
  rawIdea: z.string(),
  targetUser: z.string(),
  problem: z.string(),
  evidenceLevel: z.string(),
  alternatives: z.string(),
  thirtyDayGoal: z.string(),
  openToModification: z.boolean(),
  transcript: z.array(z.string()).optional(),
  answerValidations: z.array(z.any()).optional(),
  skippedOrUnclearFields: z.array(z.string()).optional(),
});

export type FounderIntake = z.infer<typeof FounderIntakeSchema>;

export const AnswerValidationSchema = z.object({
  questionId: z.number(),
  originalQuestion: z.string(),
  userAnswer: z.string(),
  expectedField: z.string(),
  isUsable: z.boolean(),
  qualityScore: z.number().min(0).max(1),
  extractedValue: z.any(),
  issues: z.array(z.string()),
  followUpQuestion: z.string().optional(),
  normalizedAnswer: z.string(),
});

export type AnswerValidation = z.infer<typeof AnswerValidationSchema>;

export const EvidenceScoreSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(["strong", "promising_needs_modification", "weak", "reject"]),
  reasoning: z.string(),
  strongestSignal: z.string(),
  weakestSignal: z.string(),
  whatCouldBeWrong: z.string(),
  nextValidationStep: z.string(),
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
      sourceType: z.string(),
      supports: z.string(),
      limitation: z.string().optional(),
      confidence: z.enum(["low", "medium", "high"]),
    })
  ),
});

export type EvidenceScore = z.infer<typeof EvidenceScoreSchema>;
