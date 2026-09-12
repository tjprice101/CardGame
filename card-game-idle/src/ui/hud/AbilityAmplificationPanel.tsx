import { useEffect, useState } from 'react';
import { ABILITY_REGISTRY } from '@/data/abilities/abilityDefinitions';
import { useStore, selectProgress, selectTurn } from '@/state/store';
import { uiTypography } from '@/ui/theme';

export default function AbilityAmplificationPanel() {
  const [, refresh] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => refresh(value => value + 1), 250);
    return () => window.clearInterval(timer);
  }, []);
  const progress = useStore(selectProgress);
  const turn = useStore(selectTurn);
  const activateAbility = useStore(state => state.activateAbility);
  const activeDeck = progress.savedDecks.find(deck => deck.id === progress.activeDeckId);
  const loadout = activeDeck?.abilityLoadout ?? {};

  return (
    <section style={{ color: 'rgba(244,244,248,0.9)', fontFamily: uiTypography.body }}>
      <div style={{ color: '#d8f0ff', fontFamily: uiTypography.display, fontSize: 14, letterSpacing: 1 }}>Ability Amplification</div>
      <div style={{ marginTop: 3, color: 'rgba(244,244,248,0.5)', fontSize: 9 }}>Three equipped abilities</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {([1, 2, 3] as const).map(slot => {
          const abilityId = loadout[slot];
          const ability = abilityId ? ABILITY_REGISTRY.get(abilityId) : undefined;
          const cooldown = ability ? Math.max(0, (turn.abilityCooldownUntil?.[ability.id] ?? 0) - Date.now()) : 0;
          return (
            <div key={slot} style={{ padding: 9, borderRadius: 7, border: '1px solid rgba(110,185,240,0.25)', background: 'rgba(18,38,62,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ color: '#7dd4f8', fontSize: 10 }}>Slot {slot}</span>
                <button type="button" disabled={!ability || turn.phase !== 'playing' || cooldown > 0} onClick={() => activateAbility(slot)} style={{ padding: '4px 7px', borderRadius: 5, border: '1px solid rgba(110,185,240,0.45)', background: 'rgba(78,160,220,0.18)', color: '#d8f0ff', cursor: !ability || cooldown > 0 ? 'not-allowed' : 'pointer', opacity: !ability || cooldown > 0 ? 0.45 : 1, fontSize: 9 }}>Use</button>
              </div>
              <div style={{ marginTop: 5, fontSize: 11 }}>{ability?.name ?? 'Empty slot'}</div>
              {ability && <div style={{ marginTop: 4, color: 'rgba(244,244,248,0.6)', fontSize: 9, lineHeight: 1.35 }}>{cooldown > 0 ? `Cooldown ${Math.ceil(cooldown / 1000)}s` : ability.description}</div>}
            </div>
          );
        })}
      </div>
      {turn.divineFieldUntil && turn.divineFieldUntil > Date.now() && (
        <div style={{ marginTop: 10, color: '#9be8a8', fontSize: 10 }}>Divine Field active: +50 Divine Light per card</div>
      )}
    </section>
  );
}
