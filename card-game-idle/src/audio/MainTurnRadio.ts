// MainTurnRadio — shuffled radio playlist for normal (non-boss) gameplay turns.
//
// Plays tracks in random order with crossfade between songs.
// When a track ends the next one starts automatically.
//
// ── Adding new tracks ────────────────────────────────────────────────
// 1. Drop the .mp3 under /public/assets/audio/music/
// 2. Append an entry to MAIN_TURN_RADIO_PLAYLIST below — done.
// ─────────────────────────────────────────────────────────────────────

const AUDIO_BASE = `${import.meta.env.BASE_URL}assets/audio/music`;

export interface RadioTrackInfo {
  id: string;
  title: string;
}

interface RadioTrack extends RadioTrackInfo {
  filename: string;
  /** Per-track loudness trim (1 = file level). */
  gain: number;
}

/**
 * The main turn radio playlist.
 * Add entries here to expand the radio — no other changes required.
 */
export const MAIN_TURN_RADIO_PLAYLIST: RadioTrack[] = [
  {
    id: 'for-every-card-a-whisper',
    title: 'For Every Card, a Whisper',
    filename: 'for-every-card-a-whisper-main-turn-fight.mp3',
    gain: 1.0,
  },
  {
    id: 'unbroken-momentum',
    title: 'Unbroken Momentum',
    filename: 'unbroken-momentum-main-turn.mp3',
    gain: 1.0,
  },
  {
    id: 'empire-of-countless-cards',
    title: 'Empire of Countless Cards',
    filename: 'empire-of-countless-cards-main-turn.mp3',
    gain: 1.0,
  },
];

const CROSSFADE_MS = 1400;
const FADE_STEPS = 28;

class MainTurnRadioImpl {
  private a: HTMLAudioElement | null = null;
  private b: HTMLAudioElement | null = null;
  private liveKey: 'a' | 'b' = 'a';
  private volume = 0.5;
  private running = false;
  private paused = false;
  private fadeTimer: number | null = null;
  private queue: RadioTrack[] = [];
  private queueIndex = 0;
  private onTrackChangeCb: ((info: RadioTrackInfo) => void) | null = null;
  private onPausedChangeCb: ((paused: boolean) => void) | null = null;
  private gestureBound = false;

  // ── Public API ─────────────────────────────────────────────────────

  /** Register a callback that fires when a new track starts playing. */
  setOnTrackChange(fn: (info: RadioTrackInfo) => void) {
    this.onTrackChangeCb = fn;
  }

  /** Start the radio. Stops any currently playing track then begins. */
  start(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.running = true;
    this.paused = false;
    this.queue = this.buildQueue();
    this.queueIndex = 0;
    this.playCurrentTrack();
    this.onPausedChangeCb?.(false);
  }

  /** Stop all radio playback and fade out. */
  stop() {
    this.running = false;
    this.paused = false;
    this.clearFade();
    const live = this.live();
    const other = this.other();
    if (live) { live.onended = null; this.fadeOut(live); }
    if (other) { other.onended = null; this.fadeOut(other); }
    this.onPausedChangeCb?.(false);
  }

  /** Pause radio playback without stopping it. */
  pause() {
    if (!this.running || this.paused) return;
    this.paused = true;
    const live = this.live();
    if (live && !live.paused) live.pause();
    this.onPausedChangeCb?.(true);
  }

  /** Resume paused playback. */
  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    const live = this.live();
    if (live && live.paused && this.volume > 0) void this.tryPlay(live);
    this.onPausedChangeCb?.(false);
  }

  /** Skip to the next track immediately. */
  skip() {
    if (!this.running) return;
    this.paused = false;
    this.clearFade();
    const live = this.live();
    const other = this.other();
    if (live) live.onended = null;
    if (other) other.onended = null;
    this.advance();
    this.onPausedChangeCb?.(false);
  }

  /** Returns whether the radio is currently paused. */
  isPaused(): boolean {
    return this.paused;
  }

  /** Register a callback that fires when pause state changes. */
  setOnPausedChange(fn: (paused: boolean) => void) {
    this.onPausedChangeCb = fn;
  }

  /** Update master volume. Resumes if paused and volume becomes non-zero. */
  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    const live = this.live();
    if (!live) return;
    if (this.volume <= 0) {
      live.pause();
      const other = this.other();
      if (other) other.pause();
    } else if (this.running && !this.paused && live.paused) {
      void this.tryPlay(live);
    } else if (this.running && !this.paused) {
      const track = this.queue[this.queueIndex];
      live.volume = this.volume * (track?.gain ?? 1);
    }
  }

  // ── Internal ───────────────────────────────────────────────────────

  /**
   * Fisher-Yates shuffle.
   * `avoidLeading` keeps the first slot from repeating the last track.
   */
  private buildQueue(avoidLeading?: string): RadioTrack[] {
    const arr = [...MAIN_TURN_RADIO_PLAYLIST];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (avoidLeading && arr.length > 1 && arr[0].id === avoidLeading) {
      [arr[0], arr[1]] = [arr[1], arr[0]];
    }
    return arr;
  }

  private ensureElements() {
    if (typeof window === 'undefined') return;
    if (!this.a) { this.a = new Audio(); this.a.loop = false; this.a.preload = 'auto'; this.a.volume = 0; }
    if (!this.b) { this.b = new Audio(); this.b.loop = false; this.b.preload = 'auto'; this.b.volume = 0; }
  }

  private live(): HTMLAudioElement | null {
    this.ensureElements();
    return this.liveKey === 'a' ? this.a : this.b;
  }

  private other(): HTMLAudioElement | null {
    this.ensureElements();
    return this.liveKey === 'a' ? this.b : this.a;
  }

  private playCurrentTrack() {
    if (!this.running) return;
    const track = this.queue[this.queueIndex];
    if (!track) return;

    this.ensureElements();
    // Swap which element is live so the outgoing one can fade out.
    this.liveKey = this.liveKey === 'a' ? 'b' : 'a';
    const live = this.live()!;
    const fading = this.other();
    if (fading) fading.onended = null;

    live.src = `${AUDIO_BASE}/${track.filename}`;
    live.currentTime = 0;
    live.volume = 0;
    live.onended = () => {
      if (this.running) this.advance();
    };

    this.onTrackChangeCb?.(track);
    this.runFade(live, fading, track.gain);
    void this.tryPlay(live);
  }

  private advance() {
    this.queueIndex++;
    if (this.queueIndex >= this.queue.length) {
      const lastId = this.queue[this.queue.length - 1]?.id;
      this.queue = this.buildQueue(lastId);
      this.queueIndex = 0;
    }
    this.playCurrentTrack();
  }

  private runFade(incoming: HTMLAudioElement, outgoing: HTMLAudioElement | null, gain: number) {
    this.clearFade();
    const startOut = outgoing ? outgoing.volume : 0;
    const targetIn = this.volume * gain;
    let step = 0;
    this.fadeTimer = window.setInterval(() => {
      step++;
      const t = step / FADE_STEPS;
      incoming.volume = Math.min(1, targetIn * t);
      if (outgoing) outgoing.volume = Math.max(0, startOut * (1 - t));
      if (step >= FADE_STEPS) {
        this.clearFade();
        incoming.volume = targetIn;
        if (outgoing) { outgoing.pause(); outgoing.volume = 0; }
      }
    }, Math.max(16, Math.floor(CROSSFADE_MS / FADE_STEPS)));
  }

  private fadeOut(el: HTMLAudioElement | null) {
    if (!el) return;
    const start = el.volume;
    if (start <= 0) { el.pause(); return; }
    let step = 0;
    const timer = window.setInterval(() => {
      step++;
      el.volume = Math.max(0, start * (1 - step / FADE_STEPS));
      if (step >= FADE_STEPS) {
        el.pause();
        el.volume = 0;
        window.clearInterval(timer);
      }
    }, Math.max(16, Math.floor(CROSSFADE_MS / FADE_STEPS)));
  }

  private clearFade() {
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  private async tryPlay(el: HTMLAudioElement) {
    try {
      await el.play();
    } catch {
      // Autoplay blocked — wait for a user gesture then resume.
      this.bindGestureUnlock();
    }
  }

  private bindGestureUnlock() {
    if (this.gestureBound || typeof window === 'undefined') return;
    this.gestureBound = true;
    const unlock = () => {
      this.gestureBound = false;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      if (this.running && this.volume > 0) {
        const live = this.live();
        if (live?.paused) void live.play();
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }
}

export const MainTurnRadio = new MainTurnRadioImpl();
