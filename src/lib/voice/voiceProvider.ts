/**
 * Voice Provider Interface
 * Supports Gemini Live API, Web Speech API, and text fallback
 */

export type VoiceProvider = "gemini-live" | "web-speech" | "text-fallback";

export type VoiceConfig = {
  provider: VoiceProvider;
  apiKey?: string;
  language?: string;
  voice?: string;
};

export type VoiceEvent =
  | { type: "listening" }
  | { type: "transcribing" }
  | { type: "transcript"; text: string; isFinal: boolean }
  | { type: "thinking" }
  | { type: "speaking"; text: string }
  | { type: "audio"; data: ArrayBuffer }
  | { type: "error"; message: string }
  | { type: "end" };

export type VoiceEventHandler = (event: VoiceEvent) => void;

export interface IVoiceProvider {
  start(): Promise<void>;
  stop(): void;
  send(text: string): Promise<void>;
  isAvailable(): boolean;
  getProvider(): VoiceProvider;
}

/**
 * Detect which voice provider is available
 */
export function detectAvailableProvider(): VoiceProvider {
  // Check for Gemini API key
  if (typeof window !== "undefined") {
    const hasGeminiKey = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (hasGeminiKey) {
      return "gemini-live";
    }

    // Check for Web Speech API
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (SpeechRecognition) {
      return "web-speech";
    }
  }

  return "text-fallback";
}

/**
 * Create appropriate voice provider
 */
export async function createVoiceProvider(
  config: VoiceConfig,
  eventHandler: VoiceEventHandler
): Promise<IVoiceProvider> {
  switch (config.provider) {
    case "gemini-live":
      const { GeminiLiveProvider } = await import("./geminiLiveProvider");
      return new GeminiLiveProvider(config, eventHandler);

    case "web-speech":
      const { WebSpeechProvider } = await import("./webSpeechProvider");
      return new WebSpeechProvider(config, eventHandler);

    default:
      const { TextFallbackProvider } = await import("./textFallbackProvider");
      return new TextFallbackProvider(config, eventHandler);
  }
}
