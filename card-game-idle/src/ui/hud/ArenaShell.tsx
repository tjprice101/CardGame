import { useMemo } from 'react';
import { uiTypography } from '@/ui/theme';
import { useStore, selectBoard, selectDeck, selectBossFight, selectTurn } from '@/state/store';
import { ELEMENT_COLORS, ELEMENT_SET_NAMES } from '@/data/elements';
import { CardRegistry } from '@/cards/CardRegistry';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';

/**
 * Ambient arena backdrop. Mounted only while the player is actively in the
 * arena scene. Renders a dynamic gradient tinted by the currently dominant
 * element (boss element if in a fight, otherwise the most-represented
 * element across the deck) plus a quiet status ribbon. Stays beneath the
 * HUD so all existing controls remain interactive.
 */
export default function ArenaShell() {
  const board = useStore(selectBoard);
  const deck = useStore(selectDeck);
  const bossFight = useStore(selectBossFight);
  const turn = useStore(selectTurn);

  const dominantElement = useMemo(() => {
    if (bossFight.mode === 'active' && bossFight.activeBossId) {
      const boss = BOSS_DEFINITIONS.find(b => b.id === bossFight.activeBossId);
      if (boss) {
        // Boss exposes its set as `category` (e.g. 'Pyroabyss'). Invert the
        // ELEMENT_SET_NAMES map to recover the element key.
        const key = Object.keys(ELEMENT_SET_NAMES).find(k => ELEMENT_SET_NAMES[k] === boss.category);
        if (key) return key;
      }
    }
    const counts: Record<string, number> = {};
    for (const slot of board.frontSlots) {
      if (!slot) continue;
      const def = CardRegistry.get(slot.definitionId);
      if (def?.element) counts[def.element] = (counts[def.element] ?? 0) + 1;
    }
    if (Object.keys(counts).length === 0) {
      for (const entry of deck.deckList) {
        const def = CardRegistry.get(entry.definitionId);
        if (def?.element) counts[def.element] = (counts[def.element] ?? 0) + entry.copies;
      }
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [el, n] of Object.entries(counts)) {
      if (n > bestCount) { best = el; bestCount = n; }
    }
    return best;
  }, [board.frontSlots, deck.deckList, bossFight.mode, bossFight.activeBossId]);

  const tint = dominantElement ? ELEMENT_COLORS[dominantElement] ?? '#9090a8' : '#9090a8';
  const setName = dominantElement ? ELEMENT_SET_NAMES[dominantElement] ?? dominantElement : 'Arena';
  const isBossActive = bossFight.mode === 'active';

  // Parse hex → rgb components for nebula corner gradients.
  const tintRgb = useMemo(() => {
    const m = /^#([0-9a-f]{6})$/i.exec(tint);
    if (!m) return { r: 144, g: 144, b: 168 };
    const v = parseInt(m[1], 16);
    return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
  }, [tint]);

  // Boss fight: corners shift to crimson + violet (collapsing-star palette).
  const cornerA = isBossActive ? { r: 255, g: 70, b: 70 } : tintRgb;
  const cornerB = isBossActive ? { r: 120, g: 60, b: 255 } : tintRgb;
  const nebulaA = `radial-gradient(circle at 0% 0%, rgba(${cornerA.r},${cornerA.g},${cornerA.b},0.22) 0%, rgba(${cornerA.r},${cornerA.g},${cornerA.b},0.08) 40%, transparent 72%)`;
  const nebulaB = `radial-gradient(circle at 100% 100%, rgba(${cornerB.r},${cornerB.g},${cornerB.b},0.18) 0%, rgba(${cornerB.r},${cornerB.g},${cornerB.b},0.06) 40%, transparent 72%)`;

  // Altar floor halo — central elliptical pool of element-tinted light that
  // gives the void a "ground" so cards feel like they sit on a surface
  // rather than floating in nothing. Boss fights swap to a crimson hot floor.
  const altarRgb = isBossActive ? { r: 255, g: 80, b: 80 } : tintRgb;
  const altarHalo = `radial-gradient(ellipse 64% 38% at 50% 50%, rgba(${altarRgb.r},${altarRgb.g},${altarRgb.b},0.18) 0%, rgba(${altarRgb.r},${altarRgb.g},${altarRgb.b},0.08) 38%, transparent 72%)`;

  const phaseLabel = turn.phase === 'mulligan'
    ? 'Mulligan'
    : turn.phase === 'playing'
      ? 'Playing'
      : 'Idle';

  // Drifting cosmic motes — 8 deterministic seeds so positions don't reshuffle
  // every render. Spread across the central play area, faint, slow.
  const motes = useMemo(() => {
    const seeds: Array<{ x: number; y: number; delay: number; duration: number; size: number }> = [
      { x: 18, y: 62, delay: 0,   duration: 9,  size: 2.4 },
      { x: 32, y: 78, delay: 1.6, duration: 11, size: 1.8 },
      { x: 47, y: 55, delay: 3.2, duration: 8,  size: 2.8 },
      { x: 58, y: 70, delay: 4.5, duration: 10, size: 2.0 },
      { x: 71, y: 60, delay: 2.1, duration: 12, size: 2.6 },
      { x: 82, y: 74, delay: 5.0, duration: 9,  size: 1.6 },
      { x: 26, y: 45, delay: 6.0, duration: 11, size: 1.8 },
      { x: 64, y: 42, delay: 3.8, duration: 10, size: 2.2 },
    ];
    return seeds;
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #050507 0%, #08080f 50%, #050507 100%)',
      }}
    >
      {/* Star layer 1 — deep field, slow parallax drift */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle, rgba(255,255,255,0.85) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
        backgroundSize: '67px 67px, 101px 101px',
        backgroundPosition: '0px 0px, 34px 49px',
        opacity: 0.22,
        animation: 'voidStarDrift 90s linear infinite',
      }} />

      {/* Star layer 2 — near field, faster, slightly brighter */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)`,
        backgroundSize: '127px 127px, 83px 83px',
        backgroundPosition: '12px 8px, 55px 32px',
        opacity: 0.32,
        animation: 'voidStarDrift 48s linear infinite reverse',
      }} />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ALTAR FLOOR HALO — the missing "ground" that anchors the cards.
          A soft elliptical pool of element-tinted light at the play-area
          center. Breathes gently so the void feels living, not empty.
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '85%', height: '70%',
        background: altarHalo,
        animation: 'altarBreathe 9s ease-in-out infinite',
        transition: 'background 1s ease',
        transformOrigin: 'center',
      }} />

      {/* Horizon beam between front rank and back rank — a soft horizontal
          band of light that suggests altitude separation between the rows. */}
      <div style={{
        position: 'absolute', top: '46%', left: '8%', right: '8%', height: 1,
        background: `linear-gradient(90deg, transparent 0%, rgba(${altarRgb.r},${altarRgb.g},${altarRgb.b},0.35) 20%, rgba(244,244,248,0.5) 50%, rgba(${altarRgb.r},${altarRgb.g},${altarRgb.b},0.35) 80%, transparent 100%)`,
        opacity: 0.55,
        boxShadow: `0 0 14px rgba(${altarRgb.r},${altarRgb.g},${altarRgb.b},0.18)`,
      }} />

      {/* Element nebula — top-left corner bloom */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 480, height: 480,
        background: nebulaA,
        animation: 'nebulaPulse 7s ease-in-out infinite',
        transition: 'background 1s ease',
      }} />

      {/* Element nebula — bottom-right corner bloom */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0, width: 480, height: 480,
        background: nebulaB,
        animation: 'nebulaPulse 7s ease-in-out 3.5s infinite',
        transition: 'background 1s ease',
      }} />

      {/* Drifting cosmic motes — micro points of light that float upward
          inside the play area, giving the void a living, lived-in feel. */}
      {motes.map((m, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${m.x}%`, top: `${m.y}%`,
          width: m.size, height: m.size,
          borderRadius: '50%',
          background: `rgba(${altarRgb.r},${altarRgb.g},${altarRgb.b},0.9)`,
          boxShadow: `0 0 ${m.size * 3}px rgba(${altarRgb.r},${altarRgb.g},${altarRgb.b},0.7)`,
          animation: `moteFloat ${m.duration}s ease-in-out ${m.delay}s infinite`,
          opacity: 0,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Corner vignettes — cinematic letterbox darkening at the four extreme
          corners. Focuses the eye on the play area without occluding HUD. */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 28% 28% at 0% 0%,     rgba(0,0,0,0.55) 0%, transparent 70%),
          radial-gradient(ellipse 28% 28% at 100% 0%,   rgba(0,0,0,0.55) 0%, transparent 70%),
          radial-gradient(ellipse 28% 28% at 0% 100%,   rgba(0,0,0,0.55) 0%, transparent 70%),
          radial-gradient(ellipse 28% 28% at 100% 100%, rgba(0,0,0,0.55) 0%, transparent 70%)
        `,
      }} />

      {/* Top-edge chrome accent line */}
      <div style={{
        position: 'absolute', top: 0, left: '5%', right: '5%', height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(244,244,248,0.45) 25%, rgba(244,244,248,0.9) 50%, rgba(244,244,248,0.45) 75%, transparent 100%)',
      }} />

      {/* Bottom void fade for hand area legibility */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '26%',
        background: 'linear-gradient(0deg, rgba(5,5,7,0.88) 0%, rgba(5,5,7,0) 100%)',
      }} />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CINEMATIC TOP-CENTER TURN HEADER — replaces the tiny corner badge.
          Movie-title-card style: hairlines flank a big chrome turn number,
          set name + phase whisper underneath in widely-spaced caps.
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        key={`turn-${turn.turnNumber ?? 1}-${turn.phase}`}
        style={{
          position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          pointerEvents: 'none',
          animation: 'turnHeaderFadeIn 1.1s cubic-bezier(0.22,0.61,0.36,1) both',
        }}
      >
        {/* Flanking hairlines + turn number */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 72, height: 1,
            background: `linear-gradient(90deg, transparent, rgba(${altarRgb.r},${altarRgb.g},${altarRgb.b},0.7) 60%, rgba(244,244,248,0.9))`,
          }} />
          <div style={{
            fontFamily: uiTypography.display,
            fontSize: 16, letterSpacing: 8,
            color: 'rgba(244,244,248,0.96)',
            textTransform: 'uppercase',
            textShadow: `0 0 16px rgba(${altarRgb.r},${altarRgb.g},${altarRgb.b},0.5), 0 0 32px rgba(244,244,248,0.18)`,
            whiteSpace: 'nowrap',
          }}>
            Turn {turn.turnNumber ?? 1}
          </div>
          <div style={{
            width: 72, height: 1,
            background: `linear-gradient(90deg, rgba(244,244,248,0.9), rgba(${altarRgb.r},${altarRgb.g},${altarRgb.b},0.7) 40%, transparent)`,
          }} />
        </div>
        {/* Set name + phase whisper */}
        <div style={{
          fontFamily: uiTypography.body,
          fontSize: 9, letterSpacing: 4.5,
          color: 'rgba(244,244,248,0.5)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {setName} <span style={{ color: 'rgba(244,244,248,0.28)', margin: '0 6px' }}>·</span> {phaseLabel}
        </div>
      </div>
    </div>
  );
}
