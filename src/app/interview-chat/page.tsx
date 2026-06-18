"use client";

import { Nav } from "@/components/Nav";
import { ResearchProgress } from "@/components/ResearchProgress";
import { EvidenceScoreCard } from "@/components/EvidenceScoreCard";
import { Badge } from "@/components/Badge";
import { CORE_QUESTIONS } from "@/lib/intake/questions";
import { validateAnswer, shouldContinueToNext } from "@/lib/intake/answerValidator";
import {
  createInitialState,
  addMessage,
  setAnswer,
  incrementRetry,
  markComplete,
  getProgress,
  convertToFounderIntake,
  saveInterviewState,
  type InterviewState,
} from "@/lib/intake/interviewState";
import { createInitialProgress, runResearchEvaluation, type ResearchProgress as ResearchProgressType } from "@/lib/research/researchAgent";
import { isIrrelevantFounderQuestion, redirectMessage } from "@/lib/guardrails";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { EvidenceScore } from "@/lib/intake/schema";

export default function InterviewChatPage() {
  const router = useRouter();
  const [state, setState] = useState<InterviewState>(() => createInitialState("chat"));
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; content: string; status?: string }>>([]);
  const [researchProgress, setResearchProgress] = useState<ResearchProgressType | null>(null);
  const [evidenceScore, setEvidenceScore] = useState<EvidenceScore | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentQuestionIndexRef = useRef(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialMessages] = useState(() => {
    const welcomeMsg = "Hey! I'm LaunchPilot, your founder execution navigator. I'll ask you 15 focused questions to understand you, your idea, and your constraints. Then I'll run real research to validate if your idea is ready or needs refinement. Ready?";
    const firstQuestion = CORE_QUESTIONS[0].conversationalVariant;
    return [
      { role: "assistant" as const, content: welcomeMsg },
      { role: "assistant" as const, content: firstQuestion },
    ];
  });

  useEffect(() => {
    // Initialize with first question
    if (!isInitialized) {
      setMessages(initialMessages);
      setIsInitialized(true);
    }
  }, [isInitialized, initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    const answer = input.trim();
    setInput("");
    setIsProcessing(true);

    // Check for irrelevant questions
    if (isIrrelevantFounderQuestion(answer)) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: answer },
        { role: "assistant", content: redirectMessage },
      ]);
      setIsProcessing(false);
      return;
    }

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: answer }]);
    setState((s) => addMessage(s, "user", answer));

    // Show validation status
    setMessages((prev) => [...prev, { role: "assistant", content: "Checking your answer...", status: "validating" }]);

    // Get current question
    const currentQuestion = CORE_QUESTIONS[currentQuestionIndex];
    if (!currentQuestion) {
      setIsProcessing(false);
      return;
    }

    // Validate answer
    const validation = await validateAnswer(currentQuestion, answer, {});

    // Remove validation message
    setMessages((prev) => prev.filter((m) => m.status !== "validating"));

    const retryCount = state.retryCount[currentQuestion.id] || 0;
    const decision = shouldContinueToNext(validation, retryCount);

    if (decision.action === "accept") {
      // Save answer
      setState((s) => setAnswer(s, currentQuestion.field, validation.normalizedAnswer, validation));

      // Show success
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "✓ Got it", status: "success" },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Remove success message
      setMessages((prev) => prev.filter((m) => m.status !== "success"));

      // Move to next question
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      currentQuestionIndexRef.current = nextIndex;

      if (nextIndex >= CORE_QUESTIONS.length) {
        // Interview complete
        setState((s) => markComplete(s));
        const thankYouMessage = "Thank you for answering the questions. I'm going to carry out a thorough market and feasibility research pass now.";
        setMessages((prev) => [...prev, { role: "assistant", content: thankYouMessage }]);

        // Start research
        await startResearch();
      } else {
        // Ask next question
        const nextQuestion = CORE_QUESTIONS[nextIndex];
        setMessages((prev) => [...prev, { role: "assistant", content: nextQuestion.conversationalVariant }]);
      }
    } else if (decision.action === "followup" || decision.action === "retry") {
      // Increment retry
      setState((s) => incrementRetry(s, currentQuestion.id));

      // Ask follow-up
      const followUpMessage = decision.message || currentQuestion.conversationalVariant;
      setMessages((prev) => [...prev, { role: "assistant", content: followUpMessage }]);
    } else if (decision.action === "skip") {
      // Skip and move to next
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      currentQuestionIndexRef.current = nextIndex;

      if (nextIndex >= CORE_QUESTIONS.length) {
        setState((s) => markComplete(s));
        const thankYouMessage = "Thank you. I'm going to run research now.";
        setMessages((prev) => [...prev, { role: "assistant", content: thankYouMessage }]);
        await startResearch();
      } else {
        const skipMessage = "Let's move on for now.";
        const nextQuestion = CORE_QUESTIONS[nextIndex];
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: skipMessage },
          { role: "assistant", content: nextQuestion.conversationalVariant },
        ]);
      }
    }

    // Save state
    saveInterviewState(state);
    setIsProcessing(false);
  };

  const startResearch = async () => {
    const progress = createInitialProgress();
    setResearchProgress(progress);

    // Simulate research steps
    for (let i = 0; i < progress.steps.length; i++) {
      progress.steps[i].status = "running";
      setResearchProgress({ ...progress });

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      progress.steps[i].status = "complete";
      setResearchProgress({ ...progress });
    }

    // Run actual research
    const intake = convertToFounderIntake(state);
    const score = await runResearchEvaluation(intake as unknown as Parameters<typeof runResearchEvaluation>[0]);

    setEvidenceScore(score);
    setResearchProgress({ ...progress, isComplete: true });
  };

  const progress = getProgress(state);

  return (
    <main className="shell-bg min-h-screen">
      <Nav />

      <section className="mx-auto max-w-6xl px-5 pb-10">
        {!evidenceScore ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left: Chat interface */}
            <div className="glass rounded-[32px] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Founder interview</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">Chat Mode</h1>
                </div>
                <Badge label={`${progress.current} of ${progress.total}`} />
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Messages */}
              <div className="mt-6 min-h-[500px] max-h-[600px] space-y-3 overflow-y-auto rounded-[26px] bg-white/90 p-5 shadow-inner">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      msg.role === "user"
                        ? "ml-auto bg-stone-950 text-white"
                        : msg.status === "validating"
                          ? "bg-amber-50 text-amber-700 italic"
                          : msg.status === "success"
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "bg-stone-50 text-stone-700"
                    }`}
                  >
                    {msg.content}
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="mt-4 flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-full border border-stone-200 bg-white px-5 py-3 outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-200 disabled:opacity-50"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your answer..."
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  disabled={isProcessing || !!researchProgress}
                />
                <button
                  className="flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={isProcessing || !!researchProgress}
                >
                  Send <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Why this matters */}
              {currentQuestionIndex < CORE_QUESTIONS.length && !researchProgress && (
                <div className="mt-4 rounded-2xl bg-violet-50 p-4 text-xs leading-5 text-violet-700">
                  <strong>Why this matters:</strong> {CORE_QUESTIONS[currentQuestionIndex]?.whyItMatters}
                </div>
              )}
            </div>

            {/* Right: Research progress or info */}
            <div className="space-y-5">
              {researchProgress ? (
                <ResearchProgress steps={researchProgress.steps} currentStep={researchProgress.currentStep} />
              ) : (
                <>
                  <section className="premium-card rounded-[28px] p-5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <h2 className="font-semibold text-stone-950">Answer Quality Gate</h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      Every answer is validated. If it&apos;s unclear, vague, or too short, I&apos;ll ask a follow-up. No garbage answers accepted.
                    </p>
                  </section>

                  <section className="premium-card rounded-[28px] p-5">
                    <h3 className="text-sm font-semibold text-stone-900">What gets saved</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      Founder snapshot, idea, assumptions, risks, roadmap, sources, and research findings. Nothing is shared without your control.
                    </p>
                  </section>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="py-10">
            <EvidenceScoreCard evidenceScore={evidenceScore} />

            <div className="mt-8 flex justify-center gap-4">
              {evidenceScore.verdict === "strong" && (
                <button
                  onClick={() => router.push("/dashboard")}
                  className="rounded-full bg-stone-950 px-8 py-4 text-sm font-semibold text-white shadow-lg"
                >
                  Continue to Dashboard
                </button>
              )}

              {evidenceScore.verdict !== "strong" && (
                <button className="rounded-full bg-stone-950 px-8 py-4 text-sm font-semibold text-white shadow-lg">
                  Revise Idea
                </button>
              )}

              <button
                onClick={() => router.push("/start")}
                className="rounded-full border-2 border-stone-200 bg-white px-8 py-4 text-sm font-semibold text-stone-900"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
