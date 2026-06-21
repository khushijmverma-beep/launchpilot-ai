"use client";

import { DotFieldBackground } from "@/components/animations/DotFieldBackground";
import { Nav } from "@/components/Nav";
import { Badge } from "@/components/Badge";
import { ChatTranscriptPanel } from "@/components/ChatTranscriptPanel";
import { PublishProjectButton } from "@/components/projects/PublishProjectButton";
import {
  getInterviewProgress,
  mergeCollectedFields,
  requestInterviewTurn,
  type CollectedFields,
} from "@/lib/interview/aiInterview";
import { isIrrelevantFounderQuestion, redirectMessage } from "@/lib/guardrails";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getProject, userOwnsProject } from "@/lib/projects/firestore";
import { playClickSound } from "@/lib/sounds/click";
import { mergeWithInterviewPrefill } from "@/lib/users/prefill";
import { useAuth } from "@/contexts/AuthContext";

type ChatMessage = { role: "assistant" | "user"; content: string; status?: string };

function InterviewChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const projectId = searchParams.get("projectId") ?? undefined;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Array<{ role: "assistant" | "user"; content: string }>>([]);
  const [collectedFields, setCollectedFields] = useState<CollectedFields>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [interviewComplete, setInterviewComplete] = useState(false);

  const bootstrapRef = useRef(false);
  const interviewCompleteRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (bootstrapRef.current) return;

    if (projectId && !user) {
      router.replace("/login");
      return;
    }

    bootstrapRef.current = true;
    const userId = user?.uid;

    async function bootstrap() {
      try {
        if (projectId && userId) {
          const project = await getProject(projectId);
          if (project && userOwnsProject(project, userId) && project.transcript.length > 0) {
            setMessages(project.transcript.map((entry) => ({ role: entry.role, content: entry.content })));
            setConversation(project.transcript);
            setCollectedFields(project.collectedFields);
            return;
          }
        }

        const turn = await requestInterviewTurn([]);
        playClickSound();
        setMessages([{ role: "assistant", content: turn.message }]);
        setConversation([{ role: "assistant", content: turn.message }]);
        setCollectedFields(await mergeWithInterviewPrefill(turn.collectedFields, user?.uid));
      } catch (error) {
        setMessages([
          {
            role: "assistant",
            content:
              error instanceof Error
                ? `I couldn't start the interview: ${error.message}`
                : "I couldn't start the interview. Please refresh and try again.",
          },
        ]);
      } finally {
        setIsBootstrapping(false);
      }
    }

    void bootstrap();
  }, [projectId, authLoading, user, router]);

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing || isBootstrapping) return;

    const answer = input.trim();
    setInput("");
    setIsProcessing(true);

    if (isIrrelevantFounderQuestion(answer)) {
      playClickSound();
      setMessages((prev) => [
        ...prev,
        { role: "user", content: answer },
        { role: "assistant", content: redirectMessage },
      ]);
      setIsProcessing(false);
      return;
    }

    const nextConversation = [...conversation, { role: "user" as const, content: answer }];
    setMessages((prev) => [
      ...prev,
      { role: "user", content: answer },
      { role: "assistant", content: "...", status: "thinking" },
    ]);
    setConversation(nextConversation);

    try {
      const postInterview = interviewCompleteRef.current;
      const turn = await requestInterviewTurn(nextConversation, {
        postInterview,
        collectedFields: postInterview ? collectedFields : undefined,
      });
      const mergedFields = mergeCollectedFields(collectedFields, turn.collectedFields);
      setCollectedFields(mergedFields);

      const assistantMessage = { role: "assistant" as const, content: turn.message };
      setConversation((prev) => [...prev, assistantMessage]);
      playClickSound();
      setMessages((prev) => [
        ...prev.filter((message) => message.status !== "thinking"),
        { role: "assistant", content: turn.message },
      ]);

      if (turn.interviewComplete) {
        interviewCompleteRef.current = true;
        setInterviewComplete(true);
      }
    } catch (error) {
      playClickSound();
      setMessages((prev) => [
        ...prev.filter((message) => message.status !== "thinking"),
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `Something went wrong: ${error.message}`
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const progress = getInterviewProgress(collectedFields);
  const canPublish = conversation.some((entry) => entry.role === "user");
  const voiceHref = projectId ? `/interview-voice?projectId=${projectId}` : "/interview-voice";

  return (
    <main className="relative min-h-screen bg-black">
      <DotFieldBackground variant="calm" bulgeStrength={32} />

      <div className="page-content relative z-10">
        <Nav />

        <section className="mx-auto max-w-6xl px-5 pb-10 pt-4">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="mono-label">Founder interview</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Chat mode</h1>
                </div>
                <Badge label={`${progress.current} of ${progress.total}`} />
              </div>

              <div className="mt-4 h-1 overflow-hidden bg-white/10">
                <div
                  className="h-full bg-white/70 transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              <ChatTranscriptPanel
                messages={messages}
                subtitle={
                  isBootstrapping
                    ? "Starting interview…"
                    : isProcessing
                      ? "LaunchPilot is thinking…"
                      : "Transcript updates as you type."
                }
              />

              <div className="mt-4 flex gap-2">
                <input
                  className="input-field min-w-0 flex-1"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your answer..."
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  disabled={isProcessing || isBootstrapping}
                />
                <button
                  type="button"
                  className="btn-primary shrink-0 px-5"
                  onClick={handleSubmit}
                  disabled={isProcessing || isBootstrapping}
                >
                  Send <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <aside className="space-y-5 lg:pt-12">
              <section className="terminal-card space-y-4 p-5">
                <div>
                  <h2 className="font-semibold text-white">Live AI interview</h2>
                  <p className="mt-3 text-sm leading-6 text-lp-muted">
                    {projectId
                      ? "Pick up where you left off, then publish to update your project."
                      : "Complete the conversation, then publish to generate your project blueprint."}
                  </p>
                </div>
                {interviewComplete && (
                  <p className="font-mono text-xs text-lp-subtle">
                    Interview complete — ask anything else, then publish when ready.
                  </p>
                )}
                {canPublish && (
                  <PublishProjectButton
                    collectedFields={collectedFields}
                    transcript={conversation}
                    projectId={projectId}
                    label={projectId ? "Update project" : "Publish project"}
                    className="btn-primary w-full"
                  />
                )}
                <Link href={voiceHref} className="btn-secondary block w-full text-center">
                  Nevermind I want voice!
                </Link>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function InterviewChatPage() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen bg-black">
          <DotFieldBackground variant="calm" bulgeStrength={32} />
          <div className="page-content relative z-10">
            <Nav />
            <section className="mx-auto max-w-6xl px-5 py-10">
              <p className="font-mono text-sm text-lp-muted">Loading interview…</p>
            </section>
          </div>
        </main>
      }
    >
      <InterviewChatPageInner />
    </Suspense>
  );
}
