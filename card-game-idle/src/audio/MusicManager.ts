// MusicManager — single source of truth for in-game background music.
//
// Owns two HTMLAudioElements so we can crossfade between context tracks
// (e.g. main-menu ambient → shop theme → boss fight). Volume is driven by
// `settings.musicVolume` from the zustand store; a value of 0 silences and
// pauses playback entirely.
//
// Tracks live under `/assets/audio/music/<id>.mp3` (served from /public).
// Autoplay rules: browsers (and Electron) often require a user gesture
// before audio can start. We listen for the first pointerdown/keydown and
// retry the pending track at that point.

export type MusicTrackId =
  | 'menu-main'
  | 'menu-ascension'
  | 'menu-artifacts'
  | 'menu-eternity'
  | 'menu-infinitude'
  | 'menu-shop'
  | 'battle-normal'
  | 'battle-null-raid'
  | 'battle-eternity'
  | 'battle-wake-trials'
  | 'battle-gauntlet'
  | 'battle-gauntlet-p1'
  | 'battle-gauntlet-p2';

interface TrackDef {
  src: string;
  /** Per-track loudness trim (1 = file's natural level). */
  gain: number;
}

const AUDIO_BASE = `${import.meta.env.BASE_URL}assets/audio/music`;
const TRACKS: Record<MusicTrackId, TrackDef> = {
  'menu-main':         { src: `${AUDIO_BASE}/the-space-between-eternities-main-menu.mp3`,             gain: 1.0 },
  'menu-ascension':    { src: `${AUDIO_BASE}/sovereign-of-the-infinite-deck-main-menu.mp3`,           gain: 1.0 },
  'menu-artifacts':    { src: `${AUDIO_BASE}/artifacts-of-infinity-artifact-menu.mp3`,                gain: 1.0 },
  'menu-eternity':     { src: `${AUDIO_BASE}/brink-of-eternity-eternitys-wake-menu.mp3`,              gain: 1.0 },
  'menu-infinitude':   { src: `${AUDIO_BASE}/precipice-of-infinity-infinity-card-menu.mp3`,           gain: 1.0 },
  'menu-shop':         { src: `${AUDIO_BASE}/store-by-the-event-horizon-shop-menu.mp3`,               gain: 1.0 },
  'battle-normal':     { src: `${AUDIO_BASE}/for-every-card-a-whisper-main-turn-fight.mp3`,           gain: 1.0 },
  'battle-null-raid':  { src: `${AUDIO_BASE}/sovereign-of-the-infinite-deck-main-menu.mp3`,           gain: 1.0 },
  'battle-eternity':   { src: `${AUDIO_BASE}/lifelong-fight-eternitys-wake-fight.mp3`,                gain: 1.0 },
  'battle-wake-trials':{ src: `${AUDIO_BASE}/by-the-cards-everlasting-moment-wake-trials.mp3`,        gain: 1.0 },
  'battle-gauntlet':   { src: `${AUDIO_BASE}/the-endless-dream-endless-gauntlet.mp3`,                 gain: 1.0 },
  'battle-gauntlet-p1':{ src: `${AUDIO_BASE}/in-the-beginning-it-was-only-i-gauntlet-p1.mp3`,         gain: 1.0 },
  'battle-gauntlet-p2':{ src: `${AUDIO_BASE}/but-in-the-end-we-only-have-eachother-gauntlet-p2.mp3`,  gain: 1.0 },
};

const CROSSFADE_MS = 900;
const FADE_STEPS = 18;

class MusicManagerImpl {
  private a: HTMLAudioElement | null = null;
  private b: HTMLAudioElement | null = null;
  /** Which of {a,b} is currently the "live" element. */
  private liveKey: 'a' | 'b' = 'a';
  private currentTrack: MusicTrackId | null = null;
  private requestedTrack: MusicTrackId | null = null;
  private volume = 0.5;
  private fadeTimer: number | null = null;
  private gestureBound = false;

  private ensureElements() {
    if (typeof window === 'undefined') return;
    if (!this.a) {
      this.a = new Audio();
      this.a.loop = true;
      this.a.preload = 'auto';
      this.a.volume = 0;
    }
    if (!this.b) {
      this.b = new Audio();
      this.b.loop = true;
      this.b.preload = 'auto';
      this.b.volume = 0;
    }
  }

  private live(): HTMLAudioElement | null {
    this.ensureElements();
    return this.liveKey === 'a' ? this.a : this.b;
  }

  private other(): HTMLAudioElement | null {
    this.ensureElements();
    return this.liveKey === 'a' ? this.b : this.a;
  }

  /** Update the master music volume (0..1). Pauses entirely at 0. */
  setVolume(v: number) {
    const next = Math.max(0, Math.min(1, v));
    this.volume = next;
    const live = this.live();
    if (!live) return;
    if (next <= 0) {
      live.volume = 0;
      const other = this.other();
      if (other) other.volume = 0;
      live.pause();
      if (other) other.pause();
      return;
    }
    if (this.currentTrack) {
      const def = TRACKS[this.currentTrack];
      live.volume = next * def.gain;
      if (live.paused) {
        void this.tryPlay(live);
      }
    } else if (this.requestedTrack) {
      // Volume was 0 (muted) and we'd skipped starting a track. Try now.
      this.playTrack(this.requestedTrack);
    }
  }

  /** Stop all playback. Call when no menu wants music (e.g. main hub). */
  stop() {
    this.requestedTrack = null;
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    const live = this.live();
    const other = this.other();
    if (live) {
      live.pause();
      live.volume = 0;
      live.currentTime = 0;
    }
    if (other) {
      other.pause();
      other.volume = 0;
      other.currentTime = 0;
    }
    this.currentTrack = null;
  }

  /** Switch to `track`, crossfading from the current track if any. */
  playTrack(track: MusicTrackId | null) {
    this.requestedTrack = track;
    if (track === null) { this.stop(); return; }
    if (this.currentTrack === track) return;
    if (this.volume <= 0) {
      // Muted — record the request but don't start any audio.
      this.currentTrack = track;
      return;
    }
    this.ensureElements();
    const def = TRACKS[track];
    if (!def) return;

    // Swap which element is live, load new src into it, fade in.
    this.liveKey = this.liveKey === 'a' ? 'b' : 'a';
    const live = this.live();
    const fading = this.other();
    if (!live) return;
    live.src = def.src;
    live.currentTime = 0;
    live.volume = 0;
    this.currentTrack = track;
    void this.tryPlay(live);
    this.runFade(live, fading, def.gain);
  }

  private runFade(incoming: HTMLAudioElement, outgoing: HTMLAudioElement | null, gain: number) {
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    const startOut = outgoing ? outgoing.volume : 0;
    const targetIn = this.volume * gain;
    let step = 0;
    this.fadeTimer = window.setInterval(() => {
      step += 1;
      const t = step / FADE_STEPS;
      if (incoming) incoming.volume = Math.min(1, targetIn * t);
      if (outgoing) outgoing.volume = Math.max(0, startOut * (1 - t));
      if (step >= FADE_STEPS) {
        if (outgoing) {
          outgoing.pause();
          outgoing.volume = 0;
        }
        if (incoming) incoming.volume = targetIn;
        if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }
    }, Math.max(16, Math.floor(CROSSFADE_MS / FADE_STEPS)));
  }

  private async tryPlay(el: HTMLAudioElement) {
    try {
      await el.play();
    } catch {
      // Autoplay blocked — wait for a user gesture and retry.
      this.bindGestureUnlock();
    }
  }

  private bindGestureUnlock() {
    if (this.gestureBound || typeof window === 'undefined') return;
    this.gestureBound = true;
    const unlock = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      this.gestureBound = false;
      if (this.requestedTrack && this.volume > 0) {
        // Retry whatever track was last asked for.
        const track = this.requestedTrack;
        this.currentTrack = null;
        this.playTrack(track);
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }
}

export const MusicManager = new MusicManagerImpl();
