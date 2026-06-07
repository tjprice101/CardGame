import { useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography, warmTheme } from '@/ui/theme';
import { CardRegistry } from '@/cards/CardRegistry';
import { MASTERY_TIERS, getMasteryClaimKey } from '@/systems/progression/cardMastery';
import { getDenseCardFaceBackgroundStyle } from '@/ui/cardBackgrounds';
import VirtualizedList from '@/ui/components/VirtualizedList';
import type { CardRarity } from '@/types/cards';
import { STARTER_COLLECTION } from '@/systems/progression/StarterDeck';

function withAlpha(color: string, alpha: number): string {
  // Works for both hex and rgb() values.
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}

interface Props {
  onClose: () => void;
}

const FRACTURE_SHARD_YIELD: Record<CardRarity, number> = {
  Common: 1, Rare: 3, Epic: 7, Legendary: 12, Eternal: 22, Infinite: 35,
};

const RARITY_COLOR: Record<CardRarity, string> = {
  Common: '#adb5bd',
  Rare: '#74b8ff',
  Epic: '#cf9fff',
  Legendary: '#ffd700',
  Eternal: '#ffb347',
  Infinite: '#f9e4ff',
};

const SPEND_PRESETS = [1, 5, 10, 25, 100];

export default function FractureModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const { fractureCard, spendFractureShards } = useStore.getState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const [spendAmount, setSpendAmount] = useState(1);
  const [filterHasDupe, setFilterHasDupe] = useState(false);
  const [justFractured, setJustFractured] = useState(false);

  const fractureShards = progress.fractureShards ?? 0;

  // Build list of all owned cards, enriched with mastery info.
  const rows = useMemo(() => {
    const result: {
      id: string;
      name: string;
      rarity: CardRarity;
      element: string;
      owned: number;
      fracturable: number;
      cardLight: number;
      shardYield: number;
      currentTier: number;
      nextTierThreshold: number | null;
    }[] = [];

    for (const [id, owned] of Object.entries(progress.collection ?? {})) {
      if ((owned ?? 0) <= 0) continue;
      const def = CardRegistry.get(id);
      if (!def) continue;
      const rarity = def.rarity as CardRarity;
      const starterLocked = STARTER_COLLECTION[id] ?? 0;
      const userLocked = progress.cardLocks?.[id] ?? 0;
      const lockedCopies = starterLocked + userLocked;
      // Must own MORE than 4 to fracture; floor is max(lockedCopies, 4).
      const fractureFloor = Math.max(lockedCopies, 4);
      const fracturable = Math.max(0, (owned ?? 0) - fractureFloor);
      const cardLight = progress.cardPlayCounts?.[id] ?? 0;
      const shardYield = FRACTURE_SHARD_YIELD[rarity] ?? 1;

      // Find highest claimed tier.
      let currentTier = 0;
      for (const t of MASTERY_TIERS) {
        const key = getMasteryClaimKey(id, t.tier);
        if (progress.cardMasteryClaims?.[key]) currentTier = t.tier;
      }
      const nextTierDef = MASTERY_TIERS.find(t => t.tier > currentTier);
      const nextTierThreshold = nextTierDef ? nextTierDef.threshold : null;

      if (filterHasDupe && fracturable <= 0) continue;

      result.push({
        id,
        name: def.name,
        rarity,
        element: def.element,
        owned: owned ?? 0,
        fracturable,
        cardLight,
        shardYield,
        currentTier,
        nextTierThreshold,
      });
    }

    result.sort((a, b) => b.fracturable - a.fracturable || a.name.localeCompare(b.name));
    return result;
  }, [progress, filterHasDupe]);

  const selectedRow = rows.find(r => r.id === selectedId) ?? null;
  const selectedDef = selectedId ? CardRegistry.get(selectedId) : null;

  function doFracture() {
    if (!selectedId) return;
    const gained = fractureCard(selectedId);
    if (gained > 0) {
      setFlashMsg(`+${gained} Fracture Shards`);
      setJustFractured(true);
      setTimeout(() => { setFlashMsg(null); setJustFractured(false); }, 1400);
    }
  }

  function doSpend() {
    if (!selectedId || spendAmount <= 0) return;
    const spent = spendFractureShards(selectedId, spendAmount);
    if (spent > 0) {
      setFlashMsg(`+${spent} Card-light → ${selectedDef?.name ?? selectedId}`);
      setTimeout(() => setFlashMsg(null), 1600);
    }
  }

  const P = {
    bg: warmTheme.surface,
    panel: warmTheme.surfaceStrong,
    border: warmTheme.border,
    borderStrong: warmTheme.borderStrong,
    accent: warmTheme.accent,
    text: warmTheme.text,
    textMuted: warmTheme.textMuted,
    textFaint: warmTheme.textFaint,
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 35,
      background: `linear-gradient(160deg, ${warmTheme.surfaceMuted} 0%, ${P.bg} 50%, ${warmTheme.surfaceStrong} 100%)`,
      display: 'flex', flexDirection: 'column', fontFamily: uiTypography.body,
      color: P.text,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px 14px',
        borderBottom: `1px solid ${P.border}`,
        background: withAlpha(P.panel, 0.85),
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <div style={{ fontSize: 18, letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: uiTypography.display, color: P.text }}>
              Fracture
            </div>
            <div style={{ fontSize: 11, color: P.textMuted, letterSpacing: 1, marginTop: 2 }}>
              Destroy duplicate copies · convert to Card-light
            </div>
          </div>
          {/* Global shard counter */}
          <div style={{
            padding: '6px 16px', borderRadius: 8,
            border: `1px solid ${withAlpha(P.accent, 0.4)}`,
            background: withAlpha(P.accent, 0.08),
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16, color: P.accent }}>✦</span>
            <div>
              <div style={{ fontSize: 16, fontFamily: uiTypography.display, color: P.accent }}>{fractureShards.toLocaleString()}</div>
              <div style={{ fontSize: 9, color: P.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Fracture Shards</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowHowItWorks(h => !h)}
            style={{
              fontSize: 11, padding: '6px 14px', borderRadius: 6,
              border: `1px solid ${P.border}`, background: 'transparent',
              color: P.textMuted, cursor: 'pointer', letterSpacing: 1,
            }}
          >
            {showHowItWorks ? 'Hide' : 'How it works'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              fontSize: 13, padding: '6px 18px', borderRadius: 6,
              border: `1px solid ${P.border}`, background: P.panel,
              color: P.text, cursor: 'pointer', letterSpacing: 1,
            }}
          >Close</button>
        </div>
      </div>

      {/* How it works panel */}
      {showHowItWorks && (
        <div style={{
          padding: '14px 28px', background: withAlpha(P.panel, 0.7),
          borderBottom: `1px solid ${P.border}`,
          fontSize: 12, color: P.textMuted, lineHeight: 1.7,
        }}>
          <span style={{ color: P.accent, fontWeight: 700 }}>Fracture</span> destroys one duplicate copy of a card (beyond starter-locked copies) and gives you{' '}
          <span style={{ color: P.accent }}>Fracture Shards</span> based on its rarity —{' '}
          Common <span style={{ color: RARITY_COLOR.Common }}>1</span>,{' '}
          Rare <span style={{ color: RARITY_COLOR.Rare }}>3</span>,{' '}
          Epic <span style={{ color: RARITY_COLOR.Epic }}>7</span>,{' '}
          Legendary <span style={{ color: RARITY_COLOR.Legendary }}>12</span>,{' '}
          Eternal <span style={{ color: RARITY_COLOR.Eternal }}>22</span>,{' '}
          Infinite <span style={{ color: RARITY_COLOR.Infinite }}>35</span>.{' '}
          Shards pool universally. <span style={{ color: P.accent, fontWeight: 700 }}>Spend Shards</span> to inject Card-light directly into any card — advancing it toward Card-Born Tier milestones and their Resonance rewards,{' '}
          exactly as if you had played that card that many times.
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left: card list */}
        <div style={{
          width: 280, flexShrink: 0,
          borderRight: `1px solid ${P.border}`,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Filter bar */}
          <div style={{
            padding: '10px 14px', borderBottom: `1px solid ${P.border}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: P.textMuted, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterHasDupe}
                onChange={e => setFilterHasDupe(e.target.checked)}
              />
              Fracturable only
            </label>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: P.textFaint }}>{rows.length} cards</div>
          </div>

          {/* Virtualized list */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <VirtualizedList<typeof rows[0]>
              items={rows}
              getItemKey={(row) => row.id}
              getItemHeight={() => 52}
              renderItem={(row) => {
                const isSelected = row.id === selectedId;
                const rarityColor = RARITY_COLOR[row.rarity] ?? P.text;
                return (
                  <div
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    style={{
                      padding: '8px 14px',
                      borderBottom: `1px solid ${P.border}`,
                      background: isSelected ? withAlpha(P.accent, 0.12) : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    {/* Tiny card art */}
                    <div style={{
                      width: 32, height: 42, borderRadius: 4, flexShrink: 0,
                      ...getDenseCardFaceBackgroundStyle(CardRegistry.get(row.id)!),
                      border: `1px solid ${withAlpha(rarityColor, 0.5)}`,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: P.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.name}
                      </div>
                      <div style={{ fontSize: 10, color: rarityColor, letterSpacing: 0.5 }}>{row.rarity}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 9, color: row.fracturable > 0 ? P.accent : P.textFaint }}>
                          {row.fracturable > 0 ? `✦ ${row.fracturable} fracturable` : `✦ 0 (locked)`}
                        </span>
                        <span style={{ fontSize: 9, color: P.textFaint }}>◈ {row.cardLight} CL</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </div>

        {/* Right: detail panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 20, overflowY: 'auto' }}>
          {!selectedRow || !selectedDef ? (
            <div style={{ margin: 'auto', color: P.textFaint, fontSize: 13, textAlign: 'center' }}>
              Select a card to fracture or spend shards
            </div>
          ) : (
            <>
              {/* Card art + name header */}
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{
                  width: 90, height: 126, borderRadius: 10, flexShrink: 0,
                  ...getDenseCardFaceBackgroundStyle(selectedDef),
                  border: `2px solid ${withAlpha(RARITY_COLOR[selectedRow.rarity] ?? P.accent, 0.7)}`,
                  boxShadow: justFractured
                    ? `0 0 0 3px ${withAlpha(P.accent, 0.6)}, 0 0 30px ${withAlpha(P.accent, 0.5)}`
                    : `0 4px 20px rgba(0,0,0,0.6)`,
                  transition: 'box-shadow 0.3s',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontFamily: uiTypography.display, color: P.text, letterSpacing: 1 }}>{selectedDef.name}</div>
                  <div style={{ fontSize: 11, color: RARITY_COLOR[selectedRow.rarity] ?? P.textMuted, marginTop: 3, letterSpacing: 0.5 }}>
                    {selectedRow.rarity} · {selectedRow.element}
                  </div>
                  <div style={{ fontSize: 11, color: P.textMuted, marginTop: 8 }}>
                    Owned: {selectedRow.owned} · Fracturable: {selectedRow.fracturable}
                  </div>
                  <div style={{ fontSize: 11, color: P.textMuted }}>
                    Shard yield per fracture: <span style={{ color: P.accent }}>+{selectedRow.shardYield}</span>
                  </div>

                  {/* Flash message */}
                  {flashMsg && (
                    <div style={{
                      marginTop: 8, padding: '4px 12px', borderRadius: 6,
                      background: withAlpha(P.accent, 0.15),
                      border: `1px solid ${withAlpha(P.accent, 0.4)}`,
                      fontSize: 12, color: P.accent, fontFamily: uiTypography.display,
                      letterSpacing: 1,
                    }}>
                      {flashMsg}
                    </div>
                  )}
                </div>
              </div>

              {/* Fracture button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: P.textMuted }}>
                  Fracture a duplicate
                </div>
                <button
                  type="button"
                  disabled={selectedRow.fracturable <= 0}
                  onClick={doFracture}
                  style={{
                    padding: '10px 24px', borderRadius: 8,
                    border: selectedRow.fracturable > 0
                      ? `1px solid ${withAlpha(P.accent, 0.6)}`
                      : `1px solid ${withAlpha(P.textFaint, 0.3)}`,
                    background: selectedRow.fracturable > 0
                      ? withAlpha(P.accent, 0.15)
                      : withAlpha(P.textFaint, 0.06),
                    color: selectedRow.fracturable > 0 ? P.accent : P.textFaint,
                    fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase',
                    cursor: selectedRow.fracturable > 0 ? 'pointer' : 'not-allowed',
                    fontFamily: uiTypography.display,
                    transition: 'all 0.2s',
                  }}
                >
                  {selectedRow.fracturable > 0
                    ? `✦ Fracture → +${selectedRow.shardYield} Shards`
                    : 'No duplicates to fracture'}
                </button>
              </div>

              {/* Card-light & tier progress */}
              <div style={{
                background: P.panel, borderRadius: 10,
                border: `1px solid ${P.border}`,
                padding: '16px 18px',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: P.textMuted }}>
                  Card-Born Tier Progress
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 22, fontFamily: uiTypography.display, color: P.accent }}>
                    {selectedRow.cardLight.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 11, color: P.textMuted }}>Card-light</span>
                </div>

                {/* Tier pips */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {MASTERY_TIERS.map(t => {
                    const claimKey = getMasteryClaimKey(selectedRow.id, t.tier);
                    const claimed = progress.cardMasteryClaims?.[claimKey] ?? false;
                    const reached = selectedRow.cardLight >= t.threshold;
                    return (
                      <div key={t.tier} style={{
                        padding: '4px 10px', borderRadius: 6,
                        background: claimed
                          ? withAlpha('#ffd700', 0.18)
                          : reached
                            ? withAlpha(P.accent, 0.12)
                            : withAlpha(P.textFaint, 0.08),
                        border: claimed
                          ? '1px solid rgba(255,215,0,0.5)'
                          : reached
                            ? `1px solid ${withAlpha(P.accent, 0.4)}`
                            : `1px solid ${withAlpha(P.textFaint, 0.2)}`,
                        fontSize: 10, textAlign: 'center',
                        color: claimed ? '#ffd700' : reached ? P.accent : P.textFaint,
                      }}>
                        <div style={{ fontFamily: uiTypography.display }}>{t.label}</div>
                        <div style={{ opacity: 0.7 }}>{t.threshold.toLocaleString()} CL</div>
                      </div>
                    );
                  })}
                </div>

                {selectedRow.nextTierThreshold !== null && (
                  <div style={{ fontSize: 11, color: P.textMuted }}>
                    Next tier at <span style={{ color: P.accent }}>{selectedRow.nextTierThreshold.toLocaleString()}</span> Card-light
                    {' '}— <span style={{ color: P.accent }}>
                      {Math.max(0, selectedRow.nextTierThreshold - selectedRow.cardLight).toLocaleString()}
                    </span> to go
                  </div>
                )}
              </div>

              {/* Spend shards section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: P.textMuted }}>
                  Spend Fracture Shards as Card-light
                </div>
                <div style={{ fontSize: 11, color: P.textFaint }}>
                  Pool: <span style={{ color: P.accent }}>✦ {fractureShards.toLocaleString()} shards</span>
                </div>

                {/* Preset buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SPEND_PRESETS.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSpendAmount(n)}
                      style={{
                        padding: '4px 12px', borderRadius: 6,
                        border: spendAmount === n
                          ? `1px solid ${withAlpha(P.accent, 0.7)}`
                          : `1px solid ${withAlpha(P.textFaint, 0.3)}`,
                        background: spendAmount === n ? withAlpha(P.accent, 0.15) : 'transparent',
                        color: spendAmount === n ? P.accent : P.textMuted,
                        fontSize: 11, cursor: 'pointer',
                      }}
                    >{n}</button>
                  ))}
                  {/* Max button */}
                  <button
                    type="button"
                    onClick={() => setSpendAmount(fractureShards)}
                    style={{
                      padding: '4px 12px', borderRadius: 6,
                      border: `1px solid ${withAlpha(P.textFaint, 0.3)}`,
                      background: 'transparent',
                      color: P.textMuted, fontSize: 11, cursor: 'pointer',
                    }}
                  >Max ({fractureShards})</button>
                </div>

                {/* Custom input */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="number"
                    min={1}
                    max={fractureShards}
                    value={spendAmount}
                    onChange={e => setSpendAmount(Math.max(1, Math.min(fractureShards, parseInt(e.target.value) || 1)))}
                    style={{
                      width: 80, padding: '6px 10px', borderRadius: 6,
                      border: `1px solid ${P.border}`, background: P.panel,
                      color: P.text, fontSize: 12, outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    disabled={fractureShards <= 0 || spendAmount <= 0}
                    onClick={doSpend}
                    style={{
                      padding: '8px 20px', borderRadius: 8,
                      border: fractureShards > 0 && spendAmount > 0
                        ? `1px solid rgba(140,220,140,0.6)`
                        : `1px solid ${withAlpha(P.textFaint, 0.3)}`,
                      background: fractureShards > 0 && spendAmount > 0
                        ? 'rgba(20,50,20,0.7)'
                        : withAlpha(P.textFaint, 0.06),
                      color: fractureShards > 0 && spendAmount > 0 ? '#8de68d' : P.textFaint,
                      fontSize: 12, letterSpacing: 1, textTransform: 'uppercase',
                      cursor: fractureShards > 0 && spendAmount > 0 ? 'pointer' : 'not-allowed',
                      fontFamily: uiTypography.display,
                    }}
                  >
                    Spend {Math.min(spendAmount, fractureShards)} → +{Math.min(spendAmount, fractureShards)} Card-light
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
