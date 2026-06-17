# Voice Architecture

LaunchPilot is designed for a premium voice-first interview, but it must always work without voice.

## Provider Order

1. Gemini Live API when `GEMINI_API_KEY` or `GEMINI_API_KEYS` is configured.
2. Browser Web Speech API when available.
3. Text chat mode always.

## Privacy

Raw audio is not stored by default. Voice input is used to produce interview transcript text, and that transcript goes through the same guardrails as typed answers.

## Guardrails

Irrelevant voice input is redirected with the same message used in text mode:

`Let's stay focused on your founder plan for now. I can help with your idea, skills, market, risks, roadmap, opportunities, or next step.`

## Current MVP Status

The app exposes voice readiness and fallback status through `/api/voice`. Full Gemini Live websocket streaming is a future production upgrade; the hackathon demo remains fully usable through chat and deterministic brief generation.
