import type { IVoiceProvider, VoiceConfig, VoiceEventHandler, VoiceProvider } from "./voiceProvider";

/**
 * Gemini Live API Provider
 * Uses WebSocket for real-time voice conversation
 * Reference: https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket
 */

export class GeminiLiveProvider implements IVoiceProvider {
  private config: VoiceConfig;
  private eventHandler: VoiceEventHandler;
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private isConnected = false;

  constructor(config: VoiceConfig, eventHandler: VoiceEventHandler) {
    this.config = config;
    this.eventHandler = eventHandler;
  }

  isAvailable(): boolean {
    return !!this.config.apiKey && typeof WebSocket !== "undefined";
  }

  getProvider(): VoiceProvider {
    return "gemini-live";
  }

  async start(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error("Gemini Live API key not configured");
    }

    try {
      // Initialize audio context
      this.audioContext = new AudioContext({ sampleRate: 16000 });

      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Connect to Gemini Live WebSocket
      await this.connectWebSocket();

      // Start recording
      this.startRecording();

      this.eventHandler({ type: "listening" });
    } catch (error) {
      this.eventHandler({
        type: "error",
        message: `Failed to start Gemini Live: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Gemini Live API WebSocket endpoint
        // Format: wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=API_KEY
        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.config.apiKey}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;

          // Send setup message
          this.sendSetup();

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

        this.ws.onerror = (error) => {
          this.eventHandler({
            type: "error",
            message: "WebSocket connection error",
          });
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.eventHandler({ type: "end" });
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private sendSetup(): void {
    if (!this.ws || !this.isConnected) return;

    // Send setup configuration
    const setupMessage = {
      setup: {
        model: "models/gemini-2.0-flash-exp",
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: "Aoede", // Natural female voice
              },
            },
          },
        },
        system_instruction: {
          parts: [
            {
              text: `You are LaunchPilot, a warm founder execution navigator conducting a live intake interview by voice.

There is NO fixed question list and NO required order. Listen to what the founder says and ask ONE natural follow-up at a time — tailored to their specific project, users, and problem.

Rules:
- 1–2 short sentences per turn. One question only.
- Reference their idea by name (e.g. if they said parking app, ask about parking workflows — not generic startup questions).
- If an answer is vague, ask for a concrete example: who, when, how often, what they do today.
- Cover over time: name, location, status, hours, budget, skills, team, stage, idea, target user, problem, evidence, alternatives, 30-day goal, openness to pivot.
- Do NOT end or say research is starting until the founder has given substantive detail on idea, user, problem, constraints, validation, and next steps.
- Stay warm and efficient. Never mention question numbers or scripts.`,
            },
          ],
        },
      },
    };

    this.ws.send(JSON.stringify(setupMessage));
  }

  private startRecording(): void {
    if (!this.mediaStream) return;

    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      mimeType: "audio/webm",
    });

    this.mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && this.ws && this.isConnected) {
        // Convert audio to PCM16 format required by Gemini Live
        const audioData = await this.convertToPCM16(event.data);

        // Send audio chunk
        const message = {
          realtime_input: {
            media_chunks: [
              {
                mime_type: "audio/pcm",
                data: this.arrayBufferToBase64(audioData),
              },
            ],
          },
        };

        this.ws.send(JSON.stringify(message));
      }
    };

    // Capture audio in 100ms chunks for low latency
    this.mediaRecorder.start(100);
  }

  private async convertToPCM16(blob: Blob): Promise<ArrayBuffer> {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized");
    }

    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Convert to 16-bit PCM
    const pcmData = audioBuffer.getChannelData(0);
    const pcm16 = new Int16Array(pcmData.length);

    for (let i = 0; i < pcmData.length; i++) {
      const s = Math.max(-1, Math.min(1, pcmData[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    return pcm16.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // Handle server content (audio response)
      if (data.serverContent) {
        const parts = data.serverContent.modelTurn?.parts || [];

        for (const part of parts) {
          // Text transcript
          if (part.text) {
            this.eventHandler({
              type: "transcript",
              text: part.text,
              isFinal: true,
            });

            this.eventHandler({
              type: "speaking",
              text: part.text,
            });
          }

          // Audio data
          if (part.inlineData && part.inlineData.mimeType === "audio/pcm") {
            const audioData = this.base64ToArrayBuffer(part.inlineData.data);
            this.eventHandler({
              type: "audio",
              data: audioData,
            });

            // Play audio
            this.playAudio(audioData);
          }
        }
      }

      // Handle tool calls if any
      if (data.toolCall) {
        // Handle tool calls (not used in this interview flow)
      }

      // Handle errors
      if (data.error) {
        this.eventHandler({
          type: "error",
          message: data.error.message || "Unknown error from Gemini Live",
        });
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  private async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Convert PCM16 to AudioBuffer
      const pcm16 = new Int16Array(audioData);
      const floatData = new Float32Array(pcm16.length);

      for (let i = 0; i < pcm16.length; i++) {
        floatData[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
      }

      const audioBuffer = this.audioContext.createBuffer(1, floatData.length, 16000);
      audioBuffer.copyToChannel(floatData, 0);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }

  async send(text: string): Promise<void> {
    if (!this.ws || !this.isConnected) {
      throw new Error("WebSocket not connected");
    }

    // Send text message
    const message = {
      client_content: {
        turns: [
          {
            role: "user",
            parts: [
              {
                text,
              },
            ],
          },
        ],
        turn_complete: true,
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  stop(): void {
    // Stop recording
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isConnected = false;
    this.eventHandler({ type: "end" });
  }
}
