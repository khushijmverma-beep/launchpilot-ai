/**
 * Browser TTS — simple single-pass speech with light sentence chunking.
 */

let speakGeneration = 0;

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], language: string): SpeechSynthesisVoice | undefined {
  const langPrefix = language.split("-")[0];

  const ranked = voices
    .filter((voice) => voice.lang.startsWith(langPrefix))
    .sort((a, b) => {
      const score = (voice: SpeechSynthesisVoice) => {
        const name = voice.name.toLowerCase();
        if (name.includes("google") && name.includes("english")) return 0;
        if (name.includes("samantha")) return 1;
        if (name.includes("karen")) return 2;
        if (name.includes("zira")) return 3;
        if (voice.localService) return 6;
        return 10;
      };
      return score(a) - score(b);
    });

  return ranked[0] ?? voices.find((voice) => voice.lang.startsWith(langPrefix));
}

function splitIntoPhrases(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const parts = cleaned.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g);
  if (!parts) return [cleaned];

  return parts.map((part) => part.trim()).filter(Boolean);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function speakPhrase(
  text: string,
  language: string,
  voice: SpeechSynthesisVoice | undefined,
  generation: number
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis || generation !== speakGeneration) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.92;
    utterance.pitch = 1.02;
    utterance.volume = 1;
    if (voice) utterance.voice = voice;

    const finish = () => resolve();
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  });
}

export async function speakNaturally(text: string, language = "en-US"): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const generation = ++speakGeneration;
  window.speechSynthesis.cancel();
  await delay(80);

  if (generation !== speakGeneration) return;

  const voices = await waitForVoices();
  if (generation !== speakGeneration) return;

  const voice = pickVoice(voices, language);
  const phrases = splitIntoPhrases(text);

  for (let i = 0; i < phrases.length; i++) {
    if (generation !== speakGeneration) return;
    await speakPhrase(phrases[i], language, voice, generation);
    if (generation !== speakGeneration) return;
    if (i < phrases.length - 1) {
      await delay(220);
    }
  }
}

export function cancelSpeech(): void {
  speakGeneration++;
  if (typeof window !== "undefined") {
    window.speechSynthesis?.cancel();
  }
}
