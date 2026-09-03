const AUDIO_BASE = `${import.meta.env.BASE_URL}assets/audio/music`;
const CROSSFADE_MS = 1400;

export interface EternityBossTrack { id: string; title: string; filename: string; }

export const ETERNITY_BOSS_RADIO_PLAYLIST: EternityBossTrack[] = [
  { id: 'lifelong-fight', title: "Lifelong Fight", filename: 'lifelong-fight-eternitys-wake-fight.mp3' },
  { id: 'everlasting-moment', title: 'By the Cards, Everlasting Moment', filename: 'by-the-cards-everlasting-moment-wake-trials.mp3' },
  { id: 'endless-dream', title: 'The Endless Dream', filename: 'the-endless-dream-endless-gauntlet.mp3' },
  { id: 'only-i', title: 'In the Beginning, It Was Only I', filename: 'in-the-beginning-it-was-only-i-gauntlet-p1.mp3' },
  { id: 'each-other', title: 'But in the End, We Only Have Each Other', filename: 'but-in-the-end-we-only-have-eachother-gauntlet-p2.mp3' },
];

class EternityBossRadioImpl {
  private audio: HTMLAudioElement | null = null;
  private index = 0;
  private volume = 0.5;
  private running = false;
  private fadeTimer: number | null = null;
  private onTrackChange: ((track: EternityBossTrack) => void) | null = null;

  setOnTrackChange(callback: (track: EternityBossTrack) => void) { this.onTrackChange = callback; }

  start(volume: number) {
    this.stop();
    this.volume = Math.max(0, Math.min(1, volume));
    this.running = true;
    this.index = Math.floor(Math.random() * ETERNITY_BOSS_RADIO_PLAYLIST.length);
    this.playCurrent();
  }

  stop() {
    this.running = false;
    if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
    this.fadeTimer = null;
    if (this.audio) { this.audio.onended = null; this.audio.pause(); this.audio.currentTime = 0; this.audio.volume = 0; }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio && this.running) this.audio.volume = this.volume;
  }

  private playCurrent() {
    if (!this.running) return;
    const track = ETERNITY_BOSS_RADIO_PLAYLIST[this.index];
    if (!track) return;
    if (!this.audio) { this.audio = new Audio(); this.audio.preload = 'auto'; }
    this.audio.src = `${AUDIO_BASE}/${track.filename}`;
    this.audio.volume = 0;
    this.audio.onended = () => this.advance();
    this.onTrackChange?.(track);
    void this.audio.play().catch(() => undefined);
    const startedAt = performance.now();
    this.fadeTimer = window.setInterval(() => {
      if (!this.audio) return;
      const progress = Math.min(1, (performance.now() - startedAt) / CROSSFADE_MS);
      this.audio.volume = this.volume * progress;
      if (progress >= 1 && this.fadeTimer !== null) { window.clearInterval(this.fadeTimer); this.fadeTimer = null; }
    }, 50);
  }

  private advance() {
    this.index = (this.index + 1) % ETERNITY_BOSS_RADIO_PLAYLIST.length;
    this.playCurrent();
  }
}

export const EternityBossRadio = new EternityBossRadioImpl();
