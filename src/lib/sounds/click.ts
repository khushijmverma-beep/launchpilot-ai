let clickAudio: HTMLAudioElement | null = null;

/** Short click when a new AI message arrives in chat (not for user messages). */
export function playClickSound(): void {
  if (typeof window === "undefined") return;

  try {
    if (!clickAudio) {
      clickAudio = new Audio("/sounds/click.mp3");
      clickAudio.volume = 0.5;
    }
    clickAudio.currentTime = 0;
    void clickAudio.play().catch(() => {});
  } catch {
    // Autoplay or audio unavailable — non-fatal
  }
}
