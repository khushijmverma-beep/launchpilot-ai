/**
 * Short two-tone chime when voice session starts (call-connected feel).
 * Uses Web Audio API — no asset files, works on first user gesture.
 */
export function playConnectDing(): void {
  if (typeof window === "undefined") return;

  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const now = ctx.currentTime;

    const playTone = (frequency: number, start: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
    };

    playTone(880, now, 0.1);
    playTone(1174.66, now + 0.1, 0.2);

    window.setTimeout(() => void ctx.close(), 400);
  } catch {
    // Audio unavailable — non-fatal
  }
}

/**
 * Descending two-tone chime when voice session ends (call-disconnected feel).
 */
export function playDisconnectDing(): void {
  if (typeof window === "undefined") return;

  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const now = ctx.currentTime;

    const playTone = (frequency: number, start: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
    };

    playTone(1174.66, now, 0.1);
    playTone(880, now + 0.1, 0.22);

    window.setTimeout(() => void ctx.close(), 400);
  } catch {
    // Audio unavailable — non-fatal
  }
}
