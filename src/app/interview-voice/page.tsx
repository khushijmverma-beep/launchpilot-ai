"use client";

import { DotFieldBackground } from "@/components/animations/DotFieldBackground";
import { Nav } from "@/components/Nav";
import { VoiceOrb, type OrbState } from "@/components/VoiceOrb";
import { VoiceTranscriptPanel } from "@/components/VoiceTranscriptPanel";
import { EvidenceScoreCard } from "@/components/EvidenceScoreCard";
import {
  buildIntakeFromFields,
  getInterviewProgress,
  mergeCollectedFields,
  requestInterviewTurn,
  type CollectedFields,
} from "@/lib/interview/aiInterview";
import { createVoiceProvider, detectAvailableProvider, type IVoiceProvider, type VoiceEvent } from "@/lib/voice/voiceProvider";
import { PublishProjectButton } from "@/components/projects/PublishProjectButton";
import { cancelSpeech } from "@/lib/voice/speechSynthesis";
import { playConnectDing, playDisconnectDing } from "@/lib/sounds/connectDing";
import { playClickSound } from "@/lib/sounds/click";
import { createInitialProgress, runResearchEvaluation, type ResearchProgress as ResearchProgressType } from "@/lib/research/researchAgent";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, Suspense } from "react";
import { getProject } from "@/lib/projects/firestore";
import { loadInterviewPrefill, mergeWithInterviewPrefill } from "@/lib/users/prefill";
import type { EvidenceScore } from "@/lib/intake/schema";

function InterviewVoicePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? undefined;
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [isActive, setIsActive] = useState(false);
  const [statusText, setStatusText] = useState<string>();
  const [liveTranscript, setLiveTranscript] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; content: string }>>([]);
  const [collectedFields, setCollectedFields] = useState<CollectedFields>({});
  const [researchProgress, setResearchProgress] = useState<ResearchProgressType | null>(null);
  const [evidenceScore, setEvidenceScore] = useState<EvidenceScore | null>(null);

  const voiceProviderRef = useRef<IVoiceProvider | null>(null);
  const conversationRef = useRef<Array<{ role: "assistant" | "user"; content: string }>>([]);
  const collectedFieldsRef = useRef<CollectedFields>({});
  const isProcessingRef = useRef(false);
  const liveTranscriptRef = useRef("");
  const sessionAbortedRef = useRef(false);
  const interviewCompleteRef = useRef(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const projectLoadedRef = useRef(false);

  useEffect(() => {
    if (projectLoadedRef.current || !projectId) return;
    projectLoadedRef.current = true;
    const id = projectId;

    async function loadProject() {
      const project = await getProject(id);
      if (!project) return;

      const transcript = project.transcript.filter((entry) => entry.content !== "— Conversation ended —");
      conversationRef.current = transcript;
      collectedFieldsRef.current = project.collectedFields;
      setMessages(transcript);
      setCollectedFields(project.collectedFields);
    }

    void loadProject();
  }, [projectId]);

  useEffect(() => {
    if (projectId) return;

    async function loadPrefill() {
      const prefill = await loadInterviewPrefill();
      collectedFieldsRef.current = prefill;
      setCollectedFields(prefill);
    }

    void loadPrefill();
  }, [projectId]);

  const endConversation = () => {
    sessionAbortedRef.current = true;
    cancelSpeech();
    playDisconnectDing();
    voiceProviderRef.current?.stop();
    voiceProviderRef.current = null;
    isProcessingRef.current = false;

    const pending = liveTranscriptRef.current.trim();

    setMessages((prev) => {
      const next = [...prev];
      if (pending) {
        next.push({ role: "user", content: pending });
      }
      next.push({ role: "assistant", content: "— Conversation ended —" });
      return next;
    });

    if (pending) {
      conversationRef.current = [...conversationRef.current, { role: "user", content: pending }];
    }

    liveTranscriptRef.current = "";
    setLiveTranscript("");
    setIsActive(false);
    setSessionEnded(true);
    setOrbState("idle");
    setStatusText("Conversation ended");
  };

  const handleVoiceEvent = async (event: VoiceEvent) => {
    switch (event.type) {
      case "listening":
        setOrbState("listening");
        setStatusText("Listening — take your time, I'll wait for you to finish.");
        break;

      case "transcript":
        if (!event.isFinal) {
          liveTranscriptRef.current = event.text;
          setLiveTranscript(event.text);
        } else if (!event.text) {
          liveTranscriptRef.current = "";
          setLiveTranscript("");
        }
        break;

      case "utterance-ready":
        if (!sessionAbortedRef.current) {
          await handleAnswer(event.text);
        }
        break;

      case "thinking":
        setOrbState("thinking");
        setStatusText("Thinking...");
        break;

      case "speaking":
        setOrbState("speaking");
        setStatusText("Speaking...");
        setLiveTranscript("");
        liveTranscriptRef.current = "";
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.content === event.text) return prev;
          return [...prev, { role: "assistant", content: event.text }];
        });
        break;

      case "error":
        setStatusText(`Error: ${event.message}`);
        setOrbState("idle");
        break;

      case "end":
        if (!isActive) {
          setOrbState("idle");
        }
        break;
    }
  };

  const startResearch = async () => {
    setOrbState("thinking");
    setStatusText("Running research...");

    const progress = createInitialProgress();
    setResearchProgress(progress);

    for (let i = 0; i < progress.steps.length; i++) {
      progress.steps[i].status = "running";
      setResearchProgress({ ...progress });
      setStatusText(progress.steps[i].label);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      progress.steps[i].status = "complete";
      setResearchProgress({ ...progress });
    }

    const intake = buildIntakeFromFields(collectedFieldsRef.current, conversationRef.current);
    const score = await runResearchEvaluation(intake);

    setEvidenceScore(score);
    setResearchProgress({ ...progress, isComplete: true });
    setOrbState("idle");
    setStatusText(undefined);
  };

  const handleAnswer = async (answer: string) => {
    if (!answer.trim() || isProcessingRef.current || sessionAbortedRef.current) return;

    isProcessingRef.current = true;
    voiceProviderRef.current?.pauseListening?.();

    setLiveTranscript("");
    liveTranscriptRef.current = "";
    setMessages((prev) => [...prev, { role: "user", content: answer }]);

    const nextConversation = [...conversationRef.current, { role: "user" as const, content: answer }];
    conversationRef.current = nextConversation;

    setOrbState("thinking");
    setStatusText("Thinking...");

    try {
      const turn = await requestInterviewTurn(nextConversation, {
        postInterview: interviewCompleteRef.current,
        collectedFields: interviewCompleteRef.current ? collectedFieldsRef.current : undefined,
      });
      if (sessionAbortedRef.current) return;

      const mergedFields = mergeCollectedFields(collectedFieldsRef.current, turn.collectedFields);
      collectedFieldsRef.current = mergedFields;
      setCollectedFields(mergedFields);

      conversationRef.current = [...nextConversation, { role: "assistant", content: turn.message }];

      if (voiceProviderRef.current && !sessionAbortedRef.current) {
        playClickSound();
        await voiceProviderRef.current.send(turn.message);
      }
      if (sessionAbortedRef.current) return;

      if (turn.interviewComplete) {
        interviewCompleteRef.current = true;
        setOrbState("listening");
        setStatusText("Interview complete — ask me anything else you need.");
      } else {
        setOrbState("listening");
        setStatusText("Listening — take your time, I'll wait for you to finish.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Try chat mode instead.";
      setStatusText(message);
      voiceProviderRef.current?.resumeListening?.();
      setOrbState("listening");
    } finally {
      isProcessingRef.current = false;
    }
  };

  const toggleVoice = async () => {
    if (isActive) return;

    if (sessionEnded && !projectId) {
      sessionAbortedRef.current = false;
      setSessionEnded(false);
      setMessages([]);
      setLiveTranscript("");
      liveTranscriptRef.current = "";
      setCollectedFields({});
      collectedFieldsRef.current = {};
      conversationRef.current = [];
      interviewCompleteRef.current = false;
    } else if (sessionEnded) {
      sessionAbortedRef.current = false;
      setSessionEnded(false);
    }

    playConnectDing();
    sessionAbortedRef.current = false;

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
      setOrbState("thinking");
      setStatusText("Connecting to LaunchPilot...");

      const turn = await requestInterviewTurn([]);
      const mergedFields = mergeCollectedFields(collectedFieldsRef.current, turn.collectedFields);
      collectedFieldsRef.current = mergedFields;
      setCollectedFields(mergedFields);
      conversationRef.current = [{ role: "assistant", content: turn.message }];

      playClickSound();
      await voiceProvider.send(turn.message);
      setOrbState("listening");
      setStatusText("Listening — take your time, I'll wait for you to finish.");
    } catch (error) {
      console.error("Failed to start voice:", error);
      setStatusText(error instanceof Error ? error.message : "Voice unavailable. Use chat mode instead.");
      setOrbState("idle");
      setIsActive(false);
    }
  };

  const progress = getInterviewProgress(collectedFields);
  const canPublish = messages.some((message) => message.role === "user");
  const chatHref = projectId ? `/interview-chat?projectId=${projectId}` : "/interview-chat";
  void researchProgress;

  function stopVoiceForPublish() {
    sessionAbortedRef.current = true;
    cancelSpeech();
    voiceProviderRef.current?.stop();
    voiceProviderRef.current = null;
    setIsActive(false);
    setOrbState("idle");
  }

  return (
    <main className="relative min-h-screen bg-black">
      <DotFieldBackground variant="calm" bulgeStrength={40} />

      <div className="page-content relative z-10">
        <Nav />

        <section className="mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl items-center px-5 pb-10">
          {!evidenceScore ? (
            <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="flex min-h-[min(70vh,560px)] flex-col items-center justify-center pt-14">
                <VoiceOrb
                  state={orbState}
                  isActive={isActive}
                  onToggle={toggleVoice}
                  onEndConversation={endConversation}
                  statusText={statusText}
                />

                <p className="mt-8 font-mono text-sm text-lp-muted">
                  Topics covered {progress.current} of {progress.total}
                </p>

                <Link href={chatHref} className="btn-secondary mt-6">
                  Nevermind I want chat!
                </Link>

                {canPublish && (
                  <div className="mt-6">
                    <PublishProjectButton
                      collectedFields={collectedFields}
                      transcript={messages.filter((message) => message.content !== "— Conversation ended —")}
                      evidenceScore={evidenceScore}
                      projectId={projectId}
                      label={projectId ? "Update project" : "Publish project"}
                      onBeforePublish={stopVoiceForPublish}
                    />
                  </div>
                )}
              </div>

              <VoiceTranscriptPanel
                entries={messages}
                liveText={liveTranscript}
                isListening={orbState === "listening"}
                sessionEnded={sessionEnded}
              />
            </div>
          ) : (
            <div className="w-full py-10">
              <EvidenceScoreCard evidenceScore={evidenceScore} />
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <PublishProjectButton
                  collectedFields={collectedFields}
                  transcript={messages.filter((message) => message.content !== "— Conversation ended —")}
                  evidenceScore={evidenceScore}
                  projectId={projectId}
                  label={projectId ? "Update project" : "Publish project"}
                />
                <Link href={chatHref} className="btn-secondary">
                  Nevermind I want chat!
                </Link>
                <button onClick={() => router.push("/dashboard")} className="btn-secondary">
                  Go to workspace
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function InterviewVoicePage() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen bg-black">
          <div className="page-content relative z-10">
            <Nav />
            <section className="mx-auto max-w-6xl px-5 py-10">
              <p className="font-mono text-sm text-lp-muted">Loading voice interview…</p>
            </section>
          </div>
        </main>
      }
    >
      <InterviewVoicePageInner />
    </Suspense>
  );
}
