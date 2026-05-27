/**
 * SfxManager — synthesises UI sound effects procedurally via Web Audio API.
 *
 * No audio files are required; all sounds are generated on the fly using
 * oscillators, filtered noise buffers, and gain envelopes. This makes the
 * system work immediately on any platform without asset loading.
 *
 * Volume is driven by the `sfxVolume` setting (0–1). Call `setVolume` from
 * App.tsx whenever the setting changes (mirrors MusicManager's pattern).
 *
 * The AudioContext is lazily created on first play to satisfy browser/Electron
 * autoplay policies — calls before any user gesture silently succeed if the
 * context resumes, or silently no-op if it cannot.
 */

class SfxManagerImpl {
  private ctx: AudioContext | null = null;
  private volume = 0.8;

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    // Resume if suspended (browser autoplay policy until first user gesture)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
  }

  /**
   * Short crisp click — played on every button press.
   * Bandpass-filtered noise burst with exponential decay (~32ms).
   */
  click(): void {
    if (this.volume === 0) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const sampleRate = ctx.sampleRate;
    const dur = 0.032;
    const buf = ctx.createBuffer(1, Math.ceil(sampleRate * dur), sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 5);
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4200;
    filter.Q.value = 1.3;

    const gain = ctx.createGain();
    gain.gain.value = this.volume * 0.52;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  /**
   * Ascending 3-note chime — C5 → E5 → G5 (major chord arpeggio).
   * Used for victory, collect, and positive confirmation actions.
   */
  positive(): void {
    if (this.volume === 0) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const t = ctx.currentTime + i * 0.115;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.28, t + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  /**
   * Short descending interval — A4 → E4, each with a slight pitch slide down.
   * Used for defeat and blocked/unavailable actions.
   */
  negative(): void {
    if (this.volume === 0) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const notes = [440, 329.63]; // A4, E4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const t = ctx.currentTime + i * 0.17;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.82, t + 0.24);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.26, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.30);
    });
  }

  /**
   * Feather-light tick — high-bandpass noise transient, 12 ms.
   * Played on every button pointer-enter so cursor movement gives tactile
   * feedback without being distracting. Volume is intentionally very quiet.
   */
  hover(): void {
    if (this.volume === 0) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const sampleRate = ctx.sampleRate;
    const dur = 0.012;
    const buf = ctx.createBuffer(1, Math.ceil(sampleRate * dur), sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3);
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4800 + Math.random() * 400 - 200; // ±200 Hz variation
    filter.Q.value = 2.2;

    const gain = ctx.createGain();
    gain.gain.value = this.volume * 0.11;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  /**
   * Heavy thud click — lower-frequency bandpass noise body with a sub-sine
   * transient at ~95 Hz. More substantial than `click()`.
   * Used for standard/destructive/navigation buttons.
   */
  clickHeavy(): void {
    if (this.volume === 0) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const sampleRate = ctx.sampleRate;
    const dur = 0.048;
    const buf = ctx.createBuffer(1, Math.ceil(sampleRate * dur), sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 4);
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    // Mid-body bandpass — centred around 850 Hz with slight random variation
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 820 + Math.random() * 80 - 40;
    filter.Q.value = 1.6;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = this.volume * 0.58;

    src.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    src.start();

    // Sub-thump sine burst at ~95 Hz
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 95 + Math.random() * 10 - 5;

    const t = ctx.currentTime;
    oscGain.gain.setValueAtTime(this.volume * 0.20, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  /**
   * Weighted mechanical click-ring — used for Claim, Collect, and Open Pack.
   * A mid-freq noise body with a descending minor-third metallic ring.
   * Sounds like a quality latch engaging rather than a cartoon chime.
   */
  clickChime(): void {
    if (this.volume === 0) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const t0 = ctx.currentTime;
    const pitchJitter = 1 + (Math.random() * 0.04 - 0.02);

    // Noise body: mid-freq bandpass transient
    const sampleRate = ctx.sampleRate;
    const dur = 0.055;
    const buf = ctx.createBuffer(1, Math.ceil(sampleRate * dur), sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 4);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 1050;
    filt.Q.value = 1.5;
    const gNoise = ctx.createGain();
    gNoise.gain.value = this.volume * 0.46;
    src.connect(filt);
    filt.connect(gNoise);
    gNoise.connect(ctx.destination);
    src.start(t0);

    // Descending minor-third ring (B3 → G#3) — feels like a latch, not a jingle
    ([246.94, 207.65] as number[]).forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * pitchJitter, t0 + i * 0.042);
      osc.frequency.exponentialRampToValueAtTime(freq * pitchJitter * 0.90, t0 + i * 0.042 + 0.20);
      g.gain.setValueAtTime(0, t0 + i * 0.042);
      g.gain.linearRampToValueAtTime(this.volume * (0.13 - i * 0.03), t0 + i * 0.042 + 0.009);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.042 + 0.24);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0 + i * 0.042);
      osc.stop(t0 + i * 0.042 + 0.26);
    });
  }

  /**
   * Quick soft whoosh — lowpass-filtered noise sweep, falling frequency.
   * Used for card plays and similar fast actions.
   */
  card(): void {
    if (this.volume === 0) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const sampleRate = ctx.sampleRate;
    const dur = 0.115;
    const buf = ctx.createBuffer(1, Math.ceil(sampleRate * dur), sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      const env = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88;
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + dur);

    const gain = ctx.createGain();
    gain.gain.value = this.volume * 0.42;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }
}

export const SfxManager = new SfxManagerImpl();
