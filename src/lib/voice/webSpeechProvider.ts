import type { IVoiceProvider, VoiceConfig, VoiceEventHandler, VoiceProvider } from "./voiceProvider";

/**
 * Web Speech API Provider
 * Fallback when Gemini Live is not available
 * Uses browser's built-in speech recognition
 */

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: SpeechRecognitionResultList }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
};

export class WebSpeechProvider implements IVoiceProvider {
  private config: VoiceConfig;
  private eventHandler: VoiceEventHandler;
  private recognition: BrowserSpeechRecognition | null = null;
  private isListening = false;

  constructor(config: VoiceConfig, eventHandler: VoiceEventHandler) {
    this.config = config;
    this.eventHandler = eventHandler;
  }

  isAvailable(): boolean {
    if (typeof window === "undefined") return false;

    const SpeechRecognition =
      (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    return !!SpeechRecognition;
  }

  getProvider(): VoiceProvider {
    return "web-speech";
  }

  async start(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error("Web Speech API not available");
    }

    const SpeechRecognition =
      (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error("Speech Recognition not supported");
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.config.language || "en-US";

    this.recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const latestResult = results[results.length - 1];

      if (latestResult) {
        const transcript = latestResult[0]?.transcript || "";
        const isFinal = latestResult.isFinal || false;

        if (transcript) {
          this.eventHandler({
            type: "transcript",
            text: transcript,
            isFinal,
          });
        }
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.eventHandler({ type: "end" });
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      this.eventHandler({
        type: "error",
        message: `Speech recognition error: ${event.error}`,
      });
    };

    this.recognition.start();
    this.isListening = true;
    this.eventHandler({ type: "listening" });
  }

  async send(text: string): Promise<void> {
    // Web Speech API doesn't support sending - it only transcribes
    // Text responses are handled by the UI layer
    this.eventHandler({
      type: "speaking",
      text,
    });
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.recognition = null;
      this.isListening = false;
    }
  }
}
