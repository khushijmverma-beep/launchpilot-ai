import type { IVoiceProvider, VoiceConfig, VoiceEventHandler, VoiceProvider } from "./voiceProvider";

/**
 * Text Fallback Provider
 * When no voice API is available, use text-only mode
 */

export class TextFallbackProvider implements IVoiceProvider {
  private config: VoiceConfig;
  private eventHandler: VoiceEventHandler;

  constructor(config: VoiceConfig, eventHandler: VoiceEventHandler) {
    this.config = config;
    this.eventHandler = eventHandler;
  }

  isAvailable(): boolean {
    return true; // Always available as fallback
  }

  getProvider(): VoiceProvider {
    return "text-fallback";
  }

  async start(): Promise<void> {
    // Text mode doesn't need initialization
    this.eventHandler({ type: "listening" });
  }

  async send(text: string): Promise<void> {
    // In text mode, just echo back through events
    this.eventHandler({
      type: "transcript",
      text,
      isFinal: true,
    });
  }

  stop(): void {
    this.eventHandler({ type: "end" });
  }
}
