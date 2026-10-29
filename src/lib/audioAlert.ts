// Web Audio API sound synthesizer for Front Desk Operations (Check-In, Check-Out, Timers)
// Zero external mp3/wav asset dependencies; runs completely client-side.

class SoundAlertManager {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Vibrant, positive check-in chime when launching a game session or guest check-in.
   * Ascending arpeggio (C5 -> E5 -> G5 -> C6) with smooth harmonics and gentle shimmer decay.
   */
  playCheckInSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: 0, dur: 0.12, gain: 0.18 }, // C5
        { freq: 659.25, time: 0.08, dur: 0.14, gain: 0.2 }, // E5
        { freq: 783.99, time: 0.16, dur: 0.16, gain: 0.22 }, // G5
        { freq: 1046.5, time: 0.24, dur: 0.38, gain: 0.24 } // C6 (high sparkling tonic)
      ];

      notes.forEach(({ freq, time, dur, gain: noteGain }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(noteGain, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Smooth, satisfying check-out chime when a session completes, guest checks out, or resource releases.
   * Descending resolution chord (A5 -> F#5 -> D5 or G5 -> E5 -> C5) with warm tone.
   */
  playCheckOutSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 783.99, time: 0, dur: 0.14, gain: 0.18 }, // G5
        { freq: 659.25, time: 0.1, dur: 0.16, gain: 0.18 }, // E5
        { freq: 523.25, time: 0.2, dur: 0.42, gain: 0.22 } // C5 (warm resting resolution)
      ];

      notes.forEach(({ freq, time, dur, gain: noteGain }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Use triangle for warm chime body
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(noteGain, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Pleasant two-tone chime when a session scheduled duration ends (Status: DUE)
   */
  playDueChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Distinctive urgent double-beep when grace period expires (Status: OVERDUE)
   */
  playOverdueAlert() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      [0, 0.2].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now + offset);

        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } catch {
      // Silent catch
    }
  }
}

export const soundAlert = new SoundAlertManager();
