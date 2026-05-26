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

      {/* Set/turn ambient badge */}
      <div style={{
        position: 'absolute', bottom: 14, right: 16,
        padding: '4px 10px', borderRadius: 999,
        border: '1px solid rgba(244,244,248,0.14)',
        background: 'rgba(5,5,7,0.65)',
        color: 'rgba(244,244,248,0.45)',
        fontFamily: uiTypography.body, fontSize: 10, letterSpacing: 2.4,
        textTransform: 'uppercase', pointerEvents: 'none',
      }}>
        {setName} · Turn {turn.turnNumber ?? 1}
      </div>
    </div>
  );
}
