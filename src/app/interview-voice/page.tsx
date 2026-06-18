"use client";

import { Nav } from "@/components/Nav";
import { VoiceOrb, type OrbState } from "@/components/VoiceOrb";
import { ResearchProgress } from "@/components/ResearchProgress";
import { EvidenceScoreCard } from "@/components/EvidenceScoreCard";
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
import { extractMultipleFields } from "@/lib/intake/fieldExtractor";
import { createVoiceProvider, detectAvailableProvider, type IVoiceProvider, type VoiceEvent } from "@/lib/voice/voiceProvider";
import { createInitialProgress, runResearchEvaluation, type ResearchProgress as ResearchProgressType } from "@/lib/research/researchAgent";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { EvidenceScore } from "@/lib/intake/schema";

export default function InterviewVoicePage() {
  const router = useRouter();
  const [state, setState] = useState<InterviewState>(() => createInitialState("voice"));
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [isActive, setIsActive] = useState(false);
  const [statusText, setStatusText] = useState<string>();
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; content: string }>>([]);
  const [researchProgress, setResearchProgress] = useState<ResearchProgressType | null>(null);
  const [evidenceScore, setEvidenceScore] = useState<EvidenceScore | null>(null);

  const voiceProviderRef = useRef<IVoiceProvider | null>(null);
  const currentQuestionIndexRef = useRef(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialMessages] = useState(() => {
    const welcomeMsg = CORE_QUESTIONS[0].conversationalVariant;
    return [
      {
        role: "assistant" as const,
        content: "Hey! I'm LaunchPilot. I'll ask you 15 questions to understand you and your idea. Ready? Let's start!",
      },
      { role: "assistant" as const, content: welcomeMsg },
    ];
  });

  useEffect(() => {
    // Initialize with welcome message
    if (!isInitialized) {
      setMessages(initialMessages);
      setIsInitialized(true);
    }
  }, [isInitialized, initialMessages]);

  const handleVoiceEvent = async (event: VoiceEvent) => {
    switch (event.type) {
      case "listening":
        setOrbState("listening");
        setStatusText("Listening to your answer...");
        break;

      case "transcribing":
        setOrbState("thinking");
        setStatusText("Transcribing...");
        break;

      case "transcript":
        if (event.isFinal) {
          setTranscript(event.text);
          await handleAnswer(event.text);
        } else {
          setTranscript(event.text);
        }
        break;

      case "thinking":
        setOrbState("thinking");
        setStatusText("Checking if the answer is usable...");
        break;

      case "speaking":
        setOrbState("speaking");
        setStatusText("Speaking...");
        setMessages((prev) => [...prev, { role: "assistant", content: event.text }]);
        break;

      case "error":
        setStatusText(`Error: ${event.message}`);
        setOrbState("idle");
        break;

      case "end":
        setOrbState("idle");
        setIsActive(false);
        break;
    }
  };

  const handleAnswer = async (answer: string) => {
    if (!answer.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: answer }]);
    setState((s) => addMessage(s, "user", answer));

    setOrbState("thinking");
    setStatusText("Checking if the answer is usable...");

    // Get current question
    const currentQuestion = CORE_QUESTIONS[currentQuestionIndexRef.current];
    if (!currentQuestion) return;

    // Extract multiple fields if present
    extractMultipleFields(answer, currentQuestion.field);

    // Validate answer
    const validation = await validateAnswer(currentQuestion, answer, {});

    const retryCount = state.retryCount[currentQuestion.id] || 0;
    const decision = shouldContinueToNext(validation, retryCount);

    if (decision.action === "accept") {
      // Save answer
      setState((s) => setAnswer(s, currentQuestion.field, validation.normalizedAnswer, validation));

      // Move to next question
      currentQuestionIndexRef.current++;

      if (currentQuestionIndexRef.current >= CORE_QUESTIONS.length) {
        // Interview complete
        setState((s) => markComplete(s));
        const thankYouMessage = "Thank you for answering the questions. I'm going to carry out a thorough market and feasibility research pass now.";
        setMessages((prev) => [...prev, { role: "assistant", content: thankYouMessage }]);

        if (voiceProviderRef.current) {
          await voiceProviderRef.current.send(thankYouMessage);
        }

        // Start research
        await startResearch();
      } else {
        // Ask next question
        const nextQuestion = CORE_QUESTIONS[currentQuestionIndexRef.current];
        setMessages((prev) => [...prev, { role: "assistant", content: nextQuestion.conversationalVariant }]);

        if (voiceProviderRef.current) {
          await voiceProviderRef.current.send(nextQuestion.conversationalVariant);
        }

        setOrbState("listening");
        setStatusText("Listening...");
      }
    } else if (decision.action === "followup" || decision.action === "retry") {
      // Increment retry
      setState((s) => incrementRetry(s, currentQuestion.id));

      // Ask follow-up
      const followUpMessage = decision.message || currentQuestion.conversationalVariant;
      setMessages((prev) => [...prev, { role: "assistant", content: followUpMessage }]);

      if (voiceProviderRef.current) {
        await voiceProviderRef.current.send(followUpMessage);
      }

      setOrbState("listening");
      setStatusText("Listening...");
    } else if (decision.action === "skip") {
      // Skip and move to next
      currentQuestionIndexRef.current++;

      if (currentQuestionIndexRef.current >= CORE_QUESTIONS.length) {
        setState((s) => markComplete(s));
        const thankYouMessage = "Thank you. I'm going to run research now.";
        setMessages((prev) => [...prev, { role: "assistant", content: thankYouMessage }]);

        if (voiceProviderRef.current) {
          await voiceProviderRef.current.send(thankYouMessage);
        }

        await startResearch();
      } else {
        const skipMessage = "Let's move on for now.";
        const nextQuestion = CORE_QUESTIONS[currentQuestionIndexRef.current];
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: skipMessage },
          { role: "assistant", content: nextQuestion.conversationalVariant },
        ]);

        if (voiceProviderRef.current) {
          await voiceProviderRef.current.send(`${skipMessage} ${nextQuestion.conversationalVariant}`);
        }

        setOrbState("listening");
      }
    }

    // Save state
    saveInterviewState(state);
  };

  const startResearch = async () => {
    setOrbState("thinking");
    setStatusText("Running research...");

    const progress = createInitialProgress();
    setResearchProgress(progress);

    // Simulate research steps
    for (let i = 0; i < progress.steps.length; i++) {
      progress.steps[i].status = "running";
      setResearchProgress({ ...progress });
      setStatusText(progress.steps[i].label);

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
    setOrbState("idle");
    setStatusText(undefined);
  };

  const toggleVoice = async () => {
    if (isActive) {
      // Stop voice
      voiceProviderRef.current?.stop();
      voiceProviderRef.current = null;
      setIsActive(false);
      setOrbState("idle");
      setStatusText(undefined);
    } else {
      // Start voice
      try {
        const provider = detectAvailableProvider();
        const voiceProvider = await createVoiceProvider(
          {
            provider,
            apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
            language: "en-US",
          },
          handleVoiceEvent
        );

        await voiceProvider.start();
        voiceProviderRef.current = voiceProvider;
        setIsActive(true);
        setOrbState("listening");
        setStatusText("Listening...");
      } catch (error) {
        console.error("Failed to start voice:", error);
        setStatusText(`Voice unavailable. Use chat mode instead.`);
      }
    }
  };

  const progress = getProgress(state);

  return (
    <main className="shell-bg min-h-screen">
      <Nav />

      <section className="mx-auto max-w-6xl px-5 pb-10">
        {!evidenceScore ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* Left: Voice interface */}
            <div className="flex flex-col items-center justify-center py-20">
              <VoiceOrb state={orbState} isActive={isActive} onToggle={toggleVoice} statusText={statusText} />

              {/* Progress */}
              <div className="mt-8 text-center">
                <p className="text-sm font-semibold text-stone-600">
                  Question {progress.current} of {progress.total}
                </p>
                <div className="mt-2 h-2 w-64 overflow-hidden rounded-full bg-stone-200">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Live transcript */}
              {transcript && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 max-w-md rounded-2xl bg-white/90 px-6 py-4 text-center text-sm text-stone-700 shadow-lg"
                >
                  &quot;{transcript}&quot;
                </motion.div>
              )}
            </div>

            {/* Right: Conversation log or research progress */}
            <div className="space-y-4">
              {researchProgress ? (
                <ResearchProgress steps={researchProgress.steps} currentStep={researchProgress.currentStep} />
              ) : (
                <div className="premium-card rounded-[28px] p-5">
                  <h2 className="text-lg font-semibold text-stone-950">Conversation</h2>
                  <div className="mt-4 max-h-[600px] space-y-3 overflow-y-auto">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                          msg.role === "user"
                            ? "ml-auto max-w-[85%] bg-stone-950 text-white"
                            : "max-w-[90%] bg-stone-50 text-stone-700"
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))}
                  </div>
                </div>
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
