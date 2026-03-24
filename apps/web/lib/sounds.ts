'use client';

type SoundName = 'tick' | 'ding' | 'correct' | 'wrong' | 'fanfare' | 'countdown';

class SoundManager {
  private context: AudioContext | null = null;
  private enabled = true;

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
    }
    return this.context;
  }

  setEnabled(v: boolean) { this.enabled = v; }

  private async playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.3) {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gainNode.gain.setValueAtTime(gain, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch { /* ignore */ }
  }

  play(name: SoundName) {
    switch (name) {
      case 'tick': this.playTone(800, 0.1, 'square', 0.1); break;
      case 'ding': this.playTone(1200, 0.3, 'sine', 0.3); break;
      case 'correct':
        this.playTone(523, 0.15, 'sine', 0.4);
        setTimeout(() => this.playTone(659, 0.15, 'sine', 0.4), 150);
        setTimeout(() => this.playTone(784, 0.3, 'sine', 0.4), 300);
        break;
      case 'wrong':
        this.playTone(200, 0.3, 'sawtooth', 0.3);
        break;
      case 'countdown':
        this.playTone(440, 0.15, 'sine', 0.2);
        break;
      case 'fanfare':
        [0, 150, 300, 450, 600].forEach((t, i) => {
          const freqs = [523, 659, 784, 1047, 1319];
          setTimeout(() => this.playTone(freqs[i], 0.3, 'sine', 0.5), t);
        });
        break;
    }
  }
}

export const sounds = new SoundManager();

export function vibrate(pattern: number | number[]) {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
