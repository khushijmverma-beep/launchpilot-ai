/**
 * Core 15 questions for LaunchPilot AI founder intake
 * These questions are asked dynamically in a conversational tone
 */

export type QuestionField =
  | "name"
  | "location"
  | "status"
  | "hoursPerWeek"
  | "budget"
  | "skills"
  | "teamStatus"
  | "stage"
  | "rawIdea"
  | "targetUser"
  | "problem"
  | "evidenceLevel"
  | "alternatives"
  | "thirtyDayGoal"
  | "openToModification";

export type Question = {
  id: number;
  field: QuestionField;
  question: string;
  conversationalVariant: string;
  expectedAnswerType: "text" | "number" | "choice" | "longText";
  isCritical: boolean;
  exampleGoodAnswer: string;
  exampleBadAnswer: string;
  whyItMatters: string;
};

export const CORE_QUESTIONS: Question[] = [
  {
    id: 1,
    field: "name",
    question: "What is your name, and what should LaunchPilot call you?",
    conversationalVariant: "Hey! Let's start with your name — what should I call you?",
    expectedAnswerType: "text",
    isCritical: true,
    exampleGoodAnswer: "Tanush",
    exampleBadAnswer: "0, idk, ., random",
    whyItMatters: "Personalizes the founder journey",
  },
  {
    id: 2,
    field: "location",
    question: "Where are you based? Country and city if comfortable.",
    conversationalVariant: "Where are you building from? Just country and city is fine.",
    expectedAnswerType: "text",
    isCritical: true,
    exampleGoodAnswer: "Mumbai, India",
    exampleBadAnswer: "earth, nowhere, idk",
    whyItMatters: "Helps identify region-specific opportunities and programs",
  },
  {
    id: 3,
    field: "status",
    question: "Are you currently a student, working professional, founder, freelancer, or something else?",
    conversationalVariant: "What's your current situation — student, working, exploring on your own?",
    expectedAnswerType: "choice",
    isCritical: true,
    exampleGoodAnswer: "Student, working professional, founder",
    exampleBadAnswer: "yes, no, maybe",
    whyItMatters: "Determines time constraints and resources",
  },
  {
    id: 4,
    field: "hoursPerWeek",
    question: "How many hours per week can you realistically work on this idea?",
    conversationalVariant: "Realistically, how many hours per week can you spend on this?",
    expectedAnswerType: "number",
    isCritical: true,
    exampleGoodAnswer: "10 hours, 3-5 hours, 15+ hours",
    exampleBadAnswer: "a lot, maybe, yes, 0",
    whyItMatters: "Critical for roadmap feasibility",
  },
  {
    id: 5,
    field: "budget",
    question: "What is your current budget for building/testing this idea?",
    conversationalVariant: "What budget do you have to work with right now? Rough range is fine.",
    expectedAnswerType: "choice",
    isCritical: false,
    exampleGoodAnswer: "₹0, under ₹5,000, ₹5,000-₹25,000, not sure",
    exampleBadAnswer: "idk, maybe",
    whyItMatters: "Shapes MVP scope and resource recommendations",
  },
  {
    id: 6,
    field: "skills",
    question: "What skills do you already have? Examples: coding, AI, design, marketing, sales, research, writing, domain expertise, community access.",
    conversationalVariant: "What skills do you bring? Coding, design, marketing, domain knowledge, anything else?",
    expectedAnswerType: "longText",
    isCritical: false,
    exampleGoodAnswer: "Python, UI design, social media marketing",
    exampleBadAnswer: "nothing, idk, 0",
    whyItMatters: "Identifies skill gaps and founder-market fit",
  },
  {
    id: 7,
    field: "teamStatus",
    question: "Are you building alone or with a team?",
    conversationalVariant: "Are you solo or do you have a co-founder/team?",
    expectedAnswerType: "choice",
    isCritical: false,
    exampleGoodAnswer: "Solo, with 1 co-founder, small team",
    exampleBadAnswer: "yes, maybe",
    whyItMatters: "Affects execution capacity",
  },
  {
    id: 8,
    field: "stage",
    question: "What stage are you at?",
    conversationalVariant: "Where are you at? No idea yet, rough idea, building, or further along?",
    expectedAnswerType: "choice",
    isCritical: true,
    exampleGoodAnswer: "No idea yet, rough idea, MVP exists, users exist",
    exampleBadAnswer: "what, yes, idk",
    whyItMatters: "Determines the intervention mode",
  },
  {
    id: 9,
    field: "rawIdea",
    question: "Describe your startup/project idea in your own words.",
    conversationalVariant: "Tell me about your idea. Who's it for, and what does it solve?",
    expectedAnswerType: "longText",
    isCritical: true,
    exampleGoodAnswer: "A tool that helps college students find affordable housing near campus",
    exampleBadAnswer: "app, AI, startup, make money, idk, 0",
    whyItMatters: "Core problem definition",
  },
  {
    id: 10,
    field: "targetUser",
    question: "Who exactly is the target user?",
    conversationalVariant: "Who specifically would use this first? Get as narrow as you can.",
    expectedAnswerType: "text",
    isCritical: true,
    exampleGoodAnswer: "First-year college students in tier-2 cities",
    exampleBadAnswer: "everyone, people, students, businesses",
    whyItMatters: "Validates problem-solution fit",
  },
  {
    id: 11,
    field: "problem",
    question: "What painful problem does this solve for them?",
    conversationalVariant: "What's the actual pain point? What frustration does this remove?",
    expectedAnswerType: "longText",
    isCritical: true,
    exampleGoodAnswer: "They waste weeks searching unreliable listings and get scammed",
    exampleBadAnswer: "nothing, idk, bad experience",
    whyItMatters: "Problem intensity determines demand",
  },
  {
    id: 12,
    field: "evidenceLevel",
    question: "What proof do you currently have that this problem is real?",
    conversationalVariant: "How do you know this problem exists? Personal experience, user feedback, data?",
    expectedAnswerType: "choice",
    isCritical: true,
    exampleGoodAnswer: "Personal experience, friends told me, Reddit discussions, survey data",
    exampleBadAnswer: "nothing, random",
    whyItMatters: "Distinguishes validated pain from assumptions",
  },
  {
    id: 13,
    field: "alternatives",
    question: "What alternatives do people currently use instead of your idea?",
    conversationalVariant: "What do people use now to solve this? Manual work, another app, just suffering?",
    expectedAnswerType: "text",
    isCritical: false,
    exampleGoodAnswer: "Facebook groups, word of mouth, local brokers",
    exampleBadAnswer: "nothing, idk, 0",
    whyItMatters: "Reveals competitive landscape and switching cost",
  },
  {
    id: 14,
    field: "thirtyDayGoal",
    question: "What would make this idea successful in the next 30 days? Ask for one measurable outcome.",
    conversationalVariant: "If you had to pick one measurable win in the next 30 days, what would it be?",
    expectedAnswerType: "text",
    isCritical: false,
    exampleGoodAnswer: "Get 5 users to test the prototype",
    exampleBadAnswer: "success, money, famous, idk",
    whyItMatters: "Tests execution clarity",
  },
  {
    id: 15,
    field: "openToModification",
    question: "Are you open to LaunchPilot modifying, narrowing, or rejecting the idea if research shows the current version is weak?",
    conversationalVariant: "If research shows your idea needs major changes or isn't ready yet, are you open to that feedback?",
    expectedAnswerType: "choice",
    isCritical: true,
    exampleGoodAnswer: "Yes, absolutely, I'm open",
    exampleBadAnswer: "no, idk, what",
    whyItMatters: "Ensures founder is coachable",
  },
];

export function getQuestionById(id: number): Question | undefined {
  return CORE_QUESTIONS.find((q) => q.id === id);
}

export function getQuestionByField(field: QuestionField): Question | undefined {
  return CORE_QUESTIONS.find((q) => q.field === field);
}
