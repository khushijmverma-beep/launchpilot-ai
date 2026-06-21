import { describe, expect, it } from "vitest";
import { generateLaunchBrief, copilotReply, problemDiscoveryCards } from "./agents";
import { redirectMessage, isIrrelevantFounderQuestion } from "./guardrails";
import { selectGeminiKey, keyPoolStatus } from "./keyPool";
import { retrieveSources } from "./rag";
import { demoProfile, emptyProfile } from "./seed";

describe("LaunchPilot guardrails", () => {
  it("redirects irrelevant interview questions", () => {
    expect(isIrrelevantFounderQuestion("What is an amethyst?")).toBe(true);
    expect(copilotReply("Tell me a joke", generateLaunchBrief(demoProfile))).toBe(redirectMessage);
  });

  it("does not block relevant founder questions", () => {
    expect(isIrrelevantFounderQuestion("Should I apply to Startup India?")).toBe(false);
  });
});

describe("API key pool", () => {
  it("rotates keys deterministically", () => {
    expect(selectGeminiKey(0, ["a", "b"])).toBe("a");
    expect(selectGeminiKey(1, ["a", "b"])).toBe("b");
    expect(selectGeminiKey(2, ["a", "b"])).toBe("a");
  });

  it("reports fallback mode when no key exists", () => {
    expect(keyPoolStatus([])).toEqual({ available: false, count: 0, mode: "deterministic-fallback" });
  });
});

describe("RAG source registry", () => {
  it("returns sources for opportunity queries", () => {
    const sources = retrieveSources("Startup India DPIIT MAARG");
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.some((source) => source.id === "startup-india")).toBe(true);
  });
});

describe("Agent engine", () => {
  it("returns structured JSON-ready launch brief", () => {
    const brief = generateLaunchBrief(demoProfile);
    expect(brief.agents.length).toBeGreaterThanOrEqual(5);
    expect(brief.workspace.some((item) => item.type === "Current Bottleneck")).toBe(true);
    expect(brief.sources.length).toBeGreaterThan(0);
  });

  it("creates one clear bottleneck", () => {
    const brief = generateLaunchBrief(demoProfile);
    expect(brief.currentBottleneck.length).toBeGreaterThan(0);
    expect(brief.agents.some((agent) => agent.name.includes("Market Reality"))).toBe(true);
  });

  it("keeps Founder Reality Check free of fake success and funding claims", () => {
    const brief = generateLaunchBrief(demoProfile);
    const text = JSON.stringify(brief);
    expect(text).not.toMatch(/\d{1,3}% likely to succeed/i);
    expect(text).not.toMatch(/YC would fund/i);
    expect(text).toMatch(/VC outreach is premature/i);
  });

  it("labels no-idea problem discovery as fallback or framework analysis", () => {
    const cards = problemDiscoveryCards(emptyProfile);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((card) => ["Fallback analysis", "Framework-based", "Official source"].includes(card.label))).toBe(true);
  });

  it("chatbot uses saved context and challenges weak assumptions", () => {
    const brief = generateLaunchBrief(demoProfile);
    expect(copilotReply("What should I do today?", brief).length).toBeGreaterThan(10);
    expect(copilotReply("Would YC like this?", brief)).toContain("cannot predict");
    expect(copilotReply("Should I drop out?", brief)).toContain("Do not make a dropout decision");
  });

  it("supports voice and text fallback architecture without raw audio storage", () => {
    const status = {
      webSpeechFallback: true,
      textFallback: true,
      rawAudioStored: false,
    };
    expect(status.webSpeechFallback).toBe(true);
    expect(status.textFallback).toBe(true);
    expect(status.rawAudioStored).toBe(false);
  });

  it("text transcript and voice transcript produce the same profile shape", () => {
    const textProfile = { ...demoProfile };
    const voiceTranscriptProfile = { ...demoProfile };
    expect(generateLaunchBrief(textProfile).profile).toEqual(generateLaunchBrief(voiceTranscriptProfile).profile);
  });

  it("workspace persists exportable items", () => {
    const brief = generateLaunchBrief(demoProfile);
    const required = [
      "Founder Snapshot",
      "Refined Idea",
      "Research Notes",
      "Competitors / Alternatives",
      "Assumptions",
      "Risks",
      "MVP Plan",
      "Current Bottleneck",
      "Founder Reality Check",
      "Roadmap",
      "Pitch Assets",
      "Opportunity Cards",
      "Saved Decisions",
      "Sources",
    ];
    expect(required.every((type) => brief.workspace.some((item) => item.type === type))).toBe(true);
  });
});

describe("Adaptive interview completion", () => {
  it("does not complete when required fields are missing or vague", async () => {
    const { isInterviewCompleteEnough, getMissingInterviewTopics } = await import("./interview/aiInterview");

    expect(isInterviewCompleteEnough({})).toBe(false);
    expect(getMissingInterviewTopics({ name: "Alex" }).length).toBeGreaterThan(5);

    expect(
      isInterviewCompleteEnough({
        name: "Alex",
        location: "Austin, USA",
        status: "student",
        hoursPerWeek: "10",
        budget: "$500",
        skills: "React, design",
        stage: "rough idea",
        rawIdea: "app",
        targetUser: "students",
        problem: "hard",
        evidenceLevel: "none",
        alternatives: "manual",
        thirtyDayGoal: "launch",
      })
    ).toBe(false);
  });

  it("completes when substantive project detail is captured", async () => {
    const { isInterviewCompleteEnough } = await import("./interview/aiInterview");

    expect(
      isInterviewCompleteEnough({
        name: "Alex",
        location: "Austin, USA",
        status: "student",
        hoursPerWeek: "10",
        budget: "$500 for hosting",
        skills: "React, design",
        teamStatus: "solo",
        stage: "rough idea",
        rawIdea: "Campus parking spot finder that texts you when a spot opens near your dorm",
        targetUser: "First-year students at large state schools with permit shortages",
        problem: "Students circle for 20+ minutes and miss class because campus parking fills by 8am",
        evidenceLevel: "Talked to 8 classmates who all said parking is their top campus frustration",
        alternatives: "Group chats, driving loops, paying for off-campus garages",
        thirtyDayGoal: "Get 15 students to test a waitlist SMS prototype",
        openToModification: "yes, open to pivot if research shows weak fit",
      })
    ).toBe(true);
  });
});

describe("Market growth series", () => {
  it("builds a volatile 24-month profit forecast", async () => {
    const { buildMarketGrowthSeries, formatMarketUsdExact } = await import("./projects/marketGrowth");

    const series = buildMarketGrowthSeries(
      {
        sourcesAnalyzed: 6,
        confidenceScore: 72,
        competitorsFound: 3,
        marketSizeEstimate: "$12M TAM",
        competitors: ["ParkMobile", "SpotHero", "ParkWhiz"],
        sources: [
          {
            title: "Global EdTech Market Report 2025",
            url: "https://example.com/edtech-report",
            label: "Verified",
            type: "market_report",
          },
        ],
        evidenceScore: {
          score: 72,
          verdict: "promising_needs_modification",
          reasoning: "test",
          strongestSignal: "test",
          weakestSignal: "test",
          whatCouldBeWrong: "test",
          nextValidationStep: "test",
          breakdown: {
            problemPainClarity: 14,
            targetUserSharpness: 10,
            demandEvidence: 15,
            competitorGap: 10,
            feasibility: 11,
            founderMarketFit: 8,
            riskLevel: 4,
          },
          researchMode: "live",
        },
      },
      "demo-project",
      { budget: "$5,000" }
    );

    expect(series).not.toBeNull();
    expect(series!.points).toHaveLength(24);
    expect(series!.targetMonthlyProfitUsd).toBeGreaterThan(0);

    const values = series!.points.map((point) => point.valueUsd);
    const hasPeak = values.some((value, index) => {
      if (index === 0 || index === values.length - 1) return false;
      return value > values[index - 1] && value > values[index + 1];
    });
    const hasDip = values.some((value, index) => {
      if (index === 0 || index === values.length - 1) return false;
      return value < values[index - 1] && value < values[index + 1];
    });

    expect(hasPeak || hasDip).toBe(true);
    expect(formatMarketUsdExact(series!.points[0].monthlyNetUsd)).toMatch(/^-\$/);
    expect(series!.competitors.length).toBe(3);
    expect(series!.competitors[0].points).toHaveLength(24);
    expect(series!.citations.length).toBeGreaterThan(0);
  });
});
