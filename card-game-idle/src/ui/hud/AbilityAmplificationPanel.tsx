import { useEffect, useState } from 'react';
import { ABILITY_REGISTRY } from '@/data/abilities/abilityDefinitions';
import { useStore, selectProgress, selectTurn } from '@/state/store';
import { uiTypography } from '@/ui/theme';

const PLACEHOLDER_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23ffffff'/%3E%3C/svg%3E";
const abilityIconUrl = (key: string) => key === 'whiteout-domain'
  ? `${import.meta.env.BASE_URL}assets/ability-icons/whiteout-domain.png`
  : `${import.meta.env.BASE_URL}assets/ability-icons/${key}.png`;
const buffIconUrl = (key: string) => `${import.meta.env.BASE_URL}assets/buff-icons/${key.replace(/^buff_/, '').replace(/_/g, '-')}.png`;

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
  const activeBuff = turn.divineFieldUntil && turn.divineFieldUntil > Date.now()
    ? ABILITY_REGISTRY.get('nullified-barricade')?.buff
    : undefined;
  const activeWhiteout = turn.whiteoutDomainUntil && turn.whiteoutDomainUntil > Date.now()
    ? ABILITY_REGISTRY.get('whiteout-domain')?.buff
    : undefined;

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
                {ability && <img src={abilityIconUrl(ability.iconAssetKey)} alt="" aria-hidden="true" width={30} height={30} style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 5, marginRight: 2 }} />}
                <span style={{ color: '#7dd4f8', fontSize: 10 }}>Slot {slot}</span>
                <button type="button" disabled={!ability || turn.phase !== 'playing' || cooldown > 0} onClick={() => activateAbility(slot)} style={{ padding: '4px 7px', borderRadius: 5, border: '1px solid rgba(110,185,240,0.45)', background: 'rgba(78,160,220,0.18)', color: '#d8f0ff', cursor: !ability || cooldown > 0 ? 'not-allowed' : 'pointer', opacity: !ability || cooldown > 0 ? 0.45 : 1, fontSize: 9 }}>Use</button>
              </div>
              <div style={{ marginTop: 5, fontSize: 11 }}>{ability?.name ?? 'Empty slot'}</div>
              {ability && <div style={{ marginTop: 4, color: 'rgba(244,244,248,0.6)', fontSize: 9, lineHeight: 1.35 }}>{cooldown > 0 ? `Cooldown ${Math.ceil(cooldown / 1000)}s` : ability.description}</div>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(110,185,240,0.22)' }}>
        <div style={{ color: '#d8f0ff', fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 0.8 }}>Active Buffs</div>
        {[activeBuff && turn.divineFieldUntil ? { buff: activeBuff, until: turn.divineFieldUntil, color: '#9be8a8' } : null, activeWhiteout && turn.whiteoutDomainUntil ? { buff: activeWhiteout, until: turn.whiteoutDomainUntil, color: '#f1f3ff' } : null].filter(Boolean).map(entry => entry && (
          <div key={entry.buff.id} style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8, padding: 8, borderRadius: 7, border: `1px solid ${entry.color}73`, background: 'rgba(255,255,255,0.06)' }}>
            <img src={buffIconUrl(entry.buff.iconAssetKey) || PLACEHOLDER_ICON} alt="" aria-hidden="true" width={32} height={32} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 5, opacity: 0.85 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: entry.color, fontSize: 10 }}>{entry.buff.name}</div>
              <div style={{ marginTop: 2, color: 'rgba(244,244,248,0.62)', fontSize: 9 }}>{Math.ceil(Math.max(0, entry.until - Date.now()) / 1000)}s remaining · {entry.buff.description}</div>
            </div>
          </div>
        ))}
        {!activeBuff && !activeWhiteout && <div style={{ marginTop: 7, color: 'rgba(244,244,248,0.42)', fontSize: 9 }}>No active buffs.</div>}
      </div>
    </section>
  );
}
