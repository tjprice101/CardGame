import { useMemo } from 'react';
import { warmTheme, uiTypography } from '@/ui/theme';
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

  const tint = dominantElement ? ELEMENT_COLORS[dominantElement] ?? warmTheme.accent : warmTheme.accent;
  const setName = dominantElement ? ELEMENT_SET_NAMES[dominantElement] ?? dominantElement : 'Arena';

  // Hex → rgba helper for the tint at low alpha.
  const tintRgba = useMemo(() => {
    const m = /^#([0-9a-f]{6})$/i.exec(tint);
    if (!m) return 'rgba(214,162,94,0.18)';
    const v = parseInt(m[1], 16);
    const r = (v >> 16) & 0xff;
    const g = (v >> 8) & 0xff;
    const b = v & 0xff;
    return `rgba(${r},${g},${b},0.22)`;
  }, [tint]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Dynamic element-tinted ambient gradient. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 12%, ${tintRgba} 0%, rgba(0,0,0,0) 48%), radial-gradient(circle at 14% 88%, ${tintRgba} 0%, rgba(0,0,0,0) 52%), linear-gradient(180deg, rgba(8,5,3,0) 0%, rgba(8,5,3,0.35) 100%)`,
          transition: 'background 600ms ease',
        }}
      />

      {/* Subtle ambient set badge — names the active element flavor of this arena. */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          right: 16,
          padding: '4px 10px',
          borderRadius: 999,
          border: `1px solid ${warmTheme.border}`,
          background: 'rgba(14,9,6,0.55)',
          color: warmTheme.textSoft,
          fontFamily: uiTypography.body,
          fontSize: 10,
          letterSpacing: 2.4,
          textTransform: 'uppercase',
          opacity: 0.72,
          pointerEvents: 'none',
        }}
      >
        {setName} · Turn {turn.turnNumber ?? 1}
      </div>
    </div>
  );
}
