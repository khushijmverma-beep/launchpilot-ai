import { isIrrelevantFounderQuestion, redirectMessage, sanitizeAdvisorResponse } from "./guardrails";
import { retrieveSources, sourceRegistry } from "./rag";
import type { AgentOutput, FounderProfile, LaunchBrief, ReasoningCard, WorkspaceItem } from "./types";

const now = () => new Date().toISOString();
const isIndia = (profile: FounderProfile) => /india|bengaluru|delhi|mumbai|pune|hyderabad|chennai/i.test(profile.location);
const hasNoValidation = (profile: FounderProfile) =>
  profile.evidence.some((item) => /no evidence|no formal/i.test(item)) || /no users/i.test(profile.traction);

function reasoning(
  recommendation: string,
  why: string,
  evidenceUsed: string[],
  assumptions: string[],
  confidence: "Low" | "Medium" | "High",
  howToValidate: string,
): ReasoningCard {
  return {
    recommendation,
    why,
    evidenceUsed,
    assumptions,
    confidence,
    whatCouldBeWrong:
      "The founder's initial answers may be incomplete, community signals may not represent willingness to pay, and fallback research may be stale.",
    howToValidate,
  };
}

export function problemDiscoveryCards(profile: FounderProfile) {
  const community = profile.targetUser || "a community you can access";
  return [
    {
      problem: "Students with promising ideas do not know which assumption to test first.",
      who: community,
      evidenceType: "Fallback analysis + founder context",
      whyItMayMatter: "Unclear first steps cause overbuilding, abandoned projects, and weak hackathon follow-through.",
      confidence: "Medium",
      whatCouldBeWrong: "The pain may be occasional rather than urgent.",
      howToValidate: "Ask 8 students to describe the last idea they abandoned and why.",
      label: "Fallback analysis",
    },
    {
      problem: "Early founders confuse pitch polish with validation progress.",
      who: "Pre-revenue student founders",
      evidenceType: "Framework-based",
      whyItMayMatter: "It redirects time away from user interviews and prototype tests.",
      confidence: "Medium",
      whatCouldBeWrong: "Some founders may already have strong user access.",
      howToValidate: "Compare how many users they interviewed versus how many pitch slides they created.",
      label: "Framework-based",
    },
    {
      problem: "Low-budget builders need credible non-funding opportunities before investor outreach.",
      who: isIndia(profile) ? "India-based student founders" : "Low-budget student founders",
      evidenceType: isIndia(profile) ? "Official source + fallback analysis" : "Fallback analysis",
      whyItMayMatter: "Programs, mentors, grants, and incubators can be a better first support system than VC.",
      confidence: "Medium",
      whatCouldBeWrong: "Eligibility depends on official program rules that must be checked directly.",
      howToValidate: "List 3 relevant programs and confirm current eligibility on official pages.",
      label: isIndia(profile) ? "Official source" : "Fallback analysis",
    },
  ];
}

export function generateLaunchBrief(profile: FounderProfile): LaunchBrief {
  const noIdea = profile.ideaStage === "no idea yet";
  const validationWeak = hasNoValidation(profile);
  const bottleneck = noIdea
    ? "No sharply chosen problem yet"
    : validationWeak
      ? "Unvalidated demand from a specific target user"
      : "MVP scope and repeatable distribution are not yet clear";
  const readinessLabel = noIdea
    ? "Explore more"
    : validationWeak
      ? "Problem-validation ready"
      : profile.traction.includes("revenue")
        ? "Pilot-ready"
        : "Prototype-ready";
  const refinedIdea = noIdea
    ? `Problem discovery workspace for ${profile.targetUser}, starting from pains the founder can personally access and validate.`
    : `${profile.rawIdea} Focus it on ${profile.targetUser}, with the first milestone being proof that this group urgently wants the problem solved.`;
  const problem = noIdea
    ? "The founder needs to discover a painful, accessible problem before choosing a solution."
    : `${profile.targetUser} may struggle with ${profile.whyItMatters.toLowerCase()}`;
  const nextValidationTask = noIdea
    ? "Interview 8 people from one accessible community and collect the top repeated problem before choosing an idea."
    : `Interview 10 ${profile.targetUser.toLowerCase()} this week. Success signal: at least 5 ask to see or try the prototype.`;

  const competitors = [
    "Manual mentoring from college incubators",
    "Generic AI chatbots and pitch generators",
    "Startup templates, Notion workspaces, and accelerator worksheets",
  ];
  const opportunities = [
    ...(isIndia(profile)
      ? [
          "Check Startup India / DPIIT recognition only when the venture has a clear entity and eligibility fit.",
          "Explore MAARG mentorship for guidance, not as proof of demand.",
        ]
      : ["Check local university incubators, public grants, and founder office hours before fundraising."]),
    "Use hackathon communities and campus clubs as the first user interview channel.",
  ];
  const assumptions = [
    `${profile.targetUser} feels this problem strongly enough to spend time on it.`,
    "A narrow MVP can create value before advanced automation is built.",
    "The founder can reach at least 10 target users within 7 days.",
  ];
  const risks = [
    "Building before validation could waste the limited weekly hours.",
    "The target user may be too broad for a clear wedge.",
    "AI-generated market research can miss current local context.",
    "Funding outreach is premature before user evidence and a working prototype.",
  ];
  const mvpScope = noIdea
    ? ["Problem interview script", "Evidence board", "Pain-ranking worksheet", "One selected problem brief"]
    : ["Founder intake", "Assumption map", "Interview script", "Clickable prototype or concierge workflow", "Evidence-labeled Launch Brief"];
  const roadmap = [
    {
      horizon: "Next 24 hours",
      actions: [
        "Pick one narrow target user segment.",
        "Send 5 interview requests using the generated script.",
        "Write down the riskiest assumption and what would disprove it.",
      ],
    },
    {
      horizon: "Next 7 days",
      actions: [
        "Complete 10 problem interviews.",
        "Synthesize repeated pain points and exact user quotes.",
        "Decide whether to prototype, pivot the user segment, or return to problem discovery.",
      ],
    },
    {
      horizon: "Next 30 days",
      actions: [
        "Run a small concierge or no-code MVP with 3-5 users.",
        "Track activation, repeat use, and willingness to pay or commit.",
        "Update the Launch Brief before considering fundraising or large builds.",
      ],
    },
  ];
  const skillGaps = [
    "User interviewing without leading questions",
    "Basic landing page or no-code prototype shipping",
    "Simple analytics and evidence logging",
  ];
  const pitchAssets = {
    oneLinePitch: `LaunchPilot helps ${profile.targetUser.toLowerCase()} turn vague startup ideas into validated first steps.`,
    elevatorPitch:
      "LaunchPilot AI interviews student founders, maps their assumptions, researches market reality, and creates a practical MVP roadmap with source labels and human control.",
    problemStatement: problem,
    interviewMessage: `Hey, I'm testing an idea for ${profile.targetUser.toLowerCase()}. Could I ask you 15 minutes of questions about how you currently handle this problem? I am not selling anything yet.`,
    landingHeadline: "Turn your vague idea into a real execution plan.",
    deckOutline: [
      "Problem: student founders overbuild before validation",
      `Target User: ${profile.targetUser}`,
      "Solution: guided interview, evidence map, and first-step roadmap",
      "Market Reality / Alternatives: mentors, templates, generic AI tools",
      "MVP + Validation Plan: 10 interviews, concierge MVP, evidence dashboard",
      "Ask / Next Step: introductions to student founders for problem interviews",
    ],
  };
  const responsibleAINotes = [
    "LaunchPilot can make mistakes. Treat market data as guidance, not proof.",
    "The AI does not guarantee success, predict funding, or decide whether to drop out.",
    "Validate important decisions with real users, mentors, and trusted advisors.",
    "Raw audio is not stored by default; only transcript and structured answers are saved locally.",
  ];

  const agents: AgentOutput[] = [
    {
      name: "Lead Research Agent",
      role: "Decides what needs to be checked",
      status: "Complete",
      finding: `The plan should focus on ${bottleneck.toLowerCase()} before broader roadmap work.`,
      whyItMatters: "The founder has limited time and needs the next constraint, not a fake 12-month plan.",
      label: "Framework-based",
      confidence: "High",
      reasoning: reasoning(
        "Break the current bottleneck before expanding scope.",
        "A focused validation sprint produces better evidence than building many features.",
        profile.evidence,
        assumptions,
        "High",
        nextValidationTask,
      ),
    },
    {
      name: "Competitor Subagent",
      role: "Checks alternatives",
      status: "Complete",
      finding: "The main alternatives are mentors, generic AI tools, templates, and manual accelerator worksheets.",
      whyItMatters: "LaunchPilot must win on structured context, evidence labels, and first-step execution.",
      label: "Inferred",
      confidence: "Medium",
      reasoning: reasoning(
        "Position against manual guidance and generic AI wrappers.",
        "The user needs persistent founder context and evidence-labeled outputs.",
        competitors,
        ["The target user has tried or considered generic tools."],
        "Medium",
        "Ask interviewees what they use today and what feels missing.",
      ),
    },
    {
      name: "Pain Point Subagent",
      role: "Looks for user pain signals",
      status: "Complete",
      finding: noIdea
        ? "Problem Discovery Mode should start from communities the founder understands."
        : "The pain is plausible but not proven because formal validation is missing.",
      whyItMatters: "Community signals and personal experience are starting points, not proof of demand.",
      label: validationWeak ? "Needs validation" : "Community signal",
      confidence: validationWeak ? "Medium" : "High",
      reasoning: reasoning(
        "Treat the idea as validation-stage, not company-stage.",
        "The founder has no revenue or strong user evidence yet.",
        profile.evidence,
        ["The founder can reach the stated target users quickly."],
        "Medium",
        nextValidationTask,
      ),
    },
    {
      name: "Opportunity Subagent",
      role: "Finds programs and support",
      status: "Complete",
      finding: opportunities.join(" "),
      whyItMatters: "Non-dilutive help and mentorship are more appropriate than VC outreach at this stage.",
      label: isIndia(profile) ? "Official source" : "Fallback analysis",
      confidence: "Medium",
      reasoning: reasoning(
        "Use programs as support channels, not validation proof.",
        "Eligibility and program rules change, so official pages must be checked.",
        retrieveSources("Startup India DPIIT MAARG entrepreneurship").map((s) => s.title),
        ["The founder's country field is accurate."],
        "Medium",
        "Open official program pages and confirm current eligibility before applying.",
      ),
    },
    {
      name: "Skill Gap Subagent",
      role: "Maps learning needs",
      status: "Complete",
      finding: `Most urgent skills: ${skillGaps.join(", ")}.`,
      whyItMatters: "The founder has only limited weekly hours, so learning must serve validation.",
      label: "Official source",
      confidence: "Medium",
      reasoning: reasoning(
        "Prioritize user discovery and simple prototyping skills.",
        "Advanced engineering can wait until the problem is validated.",
        ["Founder skills", "ESCO skills framework"],
        ["Current skills are self-reported."],
        "Medium",
        "After interviews, decide which one skill unlocks the next MVP test.",
      ),
    },
    {
      name: "Source Quality Agent",
      role: "Labels sources and uncertainty",
      status: "Complete",
      finding: "Official programs are labeled separately from inferred and fallback analysis.",
      whyItMatters: "Judges and founders can see what is verified versus what needs validation.",
      label: "Verified",
      confidence: "High",
      reasoning: reasoning(
        "Keep uncertainty visible on every recommendation.",
        "Market evidence is guidance until target users confirm it.",
        sourceRegistry.map((s) => s.title),
        ["Fallback registry is sufficient when live search is unavailable."],
        "High",
        "Replace fallback findings with fresh official or primary sources when live research is enabled.",
      ),
    },
  ];

  const workspace: WorkspaceItem[] = [
    { id: "founder", type: "Founder Snapshot", title: `${profile.name} - ${profile.status}`, content: `${profile.location}; ${profile.hoursPerWeek} hrs/week; budget ${profile.budget}; skills: ${profile.skills.join(", ")}.`, label: "Inferred", confidence: "High", updatedAt: now() },
    { id: "idea", type: "Refined Idea", title: "Refined Idea", content: refinedIdea, label: "Needs validation", confidence: "Medium", updatedAt: now() },
    { id: "research", type: "Research Notes", title: "Market Reality", content: "Research mode uses official and framework sources when available, then deterministic fallback analysis with clear labels.", label: "Fallback analysis", confidence: "Medium", updatedAt: now() },
    { id: "competitors", type: "Competitors / Alternatives", title: "Alternatives", content: competitors.join("; "), label: "Inferred", confidence: "Medium", updatedAt: now() },
    { id: "assumptions", type: "Assumptions", title: "Riskiest Assumptions", content: assumptions.join("; "), label: "Needs validation", confidence: "Medium", updatedAt: now() },
    { id: "risks", type: "Risks", title: "Key Risks", content: risks.join("; "), label: "AI may be wrong", confidence: "Medium", updatedAt: now() },
    { id: "mvp", type: "MVP Plan", title: "MVP Scope", content: mvpScope.join("; "), label: "Framework-based", confidence: "Medium", updatedAt: now() },
    { id: "bottleneck", type: "Current Bottleneck", title: bottleneck, content: nextValidationTask, label: "Framework-based", confidence: "High", updatedAt: now() },
    { id: "reality", type: "Founder Reality Check", title: readinessLabel, content: `Strongest: ${profile.skills[0] || "access to the problem"}. Weakest: ${validationWeak ? "validation evidence" : "distribution clarity"}. VC outreach is premature until evidence improves.`, label: "Framework-based", confidence: "High", updatedAt: now() },
    { id: "roadmap", type: "Roadmap", title: "First Real Step Roadmap", content: roadmap.map((r) => `${r.horizon}: ${r.actions.join(" ")}`).join("\n"), label: "Needs validation", confidence: "High", updatedAt: now() },
    { id: "pitch", type: "Pitch Assets", title: "Pitch Assets", content: pitchAssets.oneLinePitch, label: "Inferred", confidence: "Medium", updatedAt: now() },
    { id: "opportunities", type: "Opportunity Cards", title: "Opportunities", content: opportunities.join("; "), label: isIndia(profile) ? "Official source" : "Fallback analysis", confidence: "Medium", updatedAt: now() },
    { id: "decisions", type: "Saved Decisions", title: "Human Decisions", content: "Founder must choose final direction, contact users, spend money, and apply to programs manually.", label: "Verified", confidence: "High", updatedAt: now() },
    { id: "sources", type: "Sources", title: "Source Registry", content: sourceRegistry.map((s) => `${s.title} (${s.label})`).join("; "), label: "Verified", confidence: "High", updatedAt: now() },
  ];

  return {
    profile,
    refinedIdea,
    problem,
    targetUser: profile.targetUser,
    readinessLabel,
    currentBottleneck: bottleneck,
    strongestPoint: profile.skills[0] || "Founder access and willingness to learn",
    weakestPoint: validationWeak ? "Validation evidence" : "Distribution clarity",
    nextValidationTask,
    competitors,
    opportunities,
    assumptions,
    risks,
    mvpScope,
    roadmap,
    skillGaps,
    pitchAssets,
    responsibleAINotes,
    sources: sourceRegistry,
    agents,
    workspace,
  };
}

export function copilotReply(question: string, brief: LaunchBrief) {
  if (isIrrelevantFounderQuestion(question)) return redirectMessage;
  const lower = question.toLowerCase();
  if (lower.includes("drop out")) {
    return sanitizeAdvisorResponse(
      `Do not make a dropout decision from this project right now. Your Launch Brief says the current bottleneck is ${brief.currentBottleneck.toLowerCase()}, and your readiness is "${brief.readinessLabel}". Because the plan has no validated demand or revenue yet, keep school as your default path and validate for 60-90 days first. Next action: ${brief.nextValidationTask}`,
    );
  }
  if (lower.includes("yc") || lower.includes("fund")) {
    return "I cannot predict YC or investor interest. Using public startup-quality principles, this is not funding-ready until you have stronger user evidence, a narrow target segment, and repeat usage. Your next best move is validation, not investor outreach.";
  }
  if (lower.includes("startup india") || lower.includes("dpiit") || lower.includes("maarg")) {
    return isIndia(brief.profile)
      ? "Startup India, DPIIT recognition, and MAARG may be useful support paths, but check official eligibility first. Do not treat program eligibility as proof of demand. Your better sequence is: validate the pain, build a small MVP, then apply if the venture structure fits."
      : "Those India-specific programs may not fit your location. Look for equivalent university incubators, public grants, and mentor networks, then verify eligibility on official pages.";
  }
  return `Your weakest point is ${brief.weakestPoint.toLowerCase()}. The next useful action is: ${brief.nextValidationTask}. I would avoid adding features until this bottleneck changes.`;
}
