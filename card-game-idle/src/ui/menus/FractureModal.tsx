import { useEffect, useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography } from '@/ui/theme';
import { CardRegistry } from '@/cards/CardRegistry';
import { MASTERY_TIERS, getMasteryClaimKey } from '@/systems/progression/cardMastery';
import { getDenseCardFaceBackgroundStyle, getCardBackgroundUrl } from '@/ui/cardBackgrounds';
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

type FractureMenuMode = 'fracture' | 'shards';

interface FractureCardRow {
  id: string;
  name: string;
  rarity: CardRarity;
  owned: number;
  fracturable: number;
  cardLight: number;
  shardYield: number;
  currentTier: number;
  nextTierThreshold: number | null;
}

const FRACTURE_SHARD_YIELD: Record<CardRarity, number> = {
  Common: 1, Rare: 3, Epic: 7, Legendary: 12, Eternal: 22, Infinite: 35,
};

const RARITY_COLOR: Record<CardRarity, string> = {
  Common: '#d7e1eb',
  Rare: '#74b8ff',
  Epic: '#cf9fff',
  Legendary: '#ffd700',
  Eternal: '#ffb347',
  Infinite: '#ffeaff',
};

const FRACTURE_PRESETS = [1, 5, 10, 15] as const;
const SPEND_PRESETS = [1, 5, 10, 25, 100];

export default function FractureModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const { fractureCard, spendFractureShards } = useStore.getState();
  const [menuMode, setMenuMode] = useState<FractureMenuMode>('fracture');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const [spendAmount, setSpendAmount] = useState(1);
  const [justFractured, setJustFractured] = useState(false);

  const fractureShards = progress.fractureShards ?? 0;

  // Build list of all owned cards, enriched with mastery info.
  const rows = useMemo(() => {
    const result: FractureCardRow[] = [];

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

      result.push({
        id,
        name: def.name,
        rarity,
        owned: owned ?? 0,
        fracturable,
        cardLight,
        shardYield,
        currentTier,
        nextTierThreshold,
      });
    }

    return result;
  }, [progress]);

  const fractureRows = useMemo(
    () => [...rows].filter(r => r.fracturable > 0)
      .sort((a, b) => b.fracturable - a.fracturable || a.name.localeCompare(b.name)),
    [rows],
  );
  const shardRows = useMemo(
    () => [...rows].sort((a, b) => a.currentTier - b.currentTier || a.cardLight - b.cardLight || a.name.localeCompare(b.name)),
    [rows],
  );
  const activeRows = menuMode === 'fracture' ? fractureRows : shardRows;

  useEffect(() => {
    if (activeRows.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !activeRows.some(r => r.id === selectedId)) {
      setSelectedId(activeRows[0].id);
    }
  }, [activeRows, selectedId]);

  const selectedRow = activeRows.find(r => r.id === selectedId) ?? null;
  const selectedDef = selectedRow ? CardRegistry.get(selectedRow.id) : null;

  function doFracture(count: number) {
    if (!selectedId) return;
    const gained = fractureCard(selectedId, count);
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
    bg: '#0d1726',
    panel: '#203247',
    border: '#5b7690',
    borderStrong: '#86a6c5',
    accent: '#9ed8ff',
    text: '#f3f8ff',
    textMuted: '#d3e2f2',
    textFaint: '#a7bdd3',
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 35,
      background: 'linear-gradient(160deg, #0a1320 0%, #101c2d 50%, #15243a 100%)',
      display: 'flex', flexDirection: 'column', fontFamily: uiTypography.body,
      color: P.text,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px 14px',
        borderBottom: `1px solid ${P.border}`,
        background: withAlpha(P.panel, 0.96),
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <div style={{ fontSize: 18, letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: uiTypography.display, color: P.text }}>
              Fracture
            </div>
            <div style={{ fontSize: 11, color: P.textMuted, letterSpacing: 1, marginTop: 2 }}>
              {menuMode === 'fracture'
                ? 'Destroy duplicate copies for shards'
                : 'Spend shards to increase Card-light'}
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
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setMenuMode('fracture')}
              style={{
                fontSize: 11, padding: '6px 12px', borderRadius: 6,
                border: menuMode === 'fracture'
                  ? `1px solid ${withAlpha(P.accent, 0.7)}`
                  : `1px solid ${P.border}`,
                background: menuMode === 'fracture' ? withAlpha(P.accent, 0.15) : 'transparent',
                color: menuMode === 'fracture' ? P.accent : P.textMuted,
                cursor: 'pointer', letterSpacing: 1,
              }}
            >Fracture Menu</button>
            <button
              type="button"
              onClick={() => setMenuMode('shards')}
              style={{
                fontSize: 11, padding: '6px 12px', borderRadius: 6,
                border: menuMode === 'shards'
                  ? `1px solid ${withAlpha(P.accent, 0.7)}`
                  : `1px solid ${P.border}`,
                background: menuMode === 'shards' ? withAlpha(P.accent, 0.15) : 'transparent',
                color: menuMode === 'shards' ? P.accent : P.textMuted,
                cursor: 'pointer', letterSpacing: 1,
              }}
            >Shard Menu</button>
          </div>
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
          padding: '14px 28px', background: withAlpha(P.panel, 0.9),
          borderBottom: `1px solid ${P.border}`,
          fontSize: 12, color: P.textMuted, lineHeight: 1.7,
        }}>
          <span style={{ color: P.accent, fontWeight: 700 }}>Fracture Menu</span> displays cards currently available to fracture.{' '}
          <span style={{ color: P.accent, fontWeight: 700 }}>Shard Menu</span> displays every owned card so you can route Card-light exactly where you want.{' '}
          Fracturing gives{' '}
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
          {/* Menu info bar */}
          <div style={{
            padding: '10px 14px', borderBottom: `1px solid ${P.border}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ fontSize: 11, color: P.textMuted, letterSpacing: 0.6 }}>
              {menuMode === 'fracture' ? 'Available to Fracture' : 'All Owned Cards'}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: P.textMuted }}>{activeRows.length} cards</div>
          </div>

          {/* Virtualized list */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <VirtualizedList<FractureCardRow>
              items={activeRows}
              getItemKey={(row) => row.id}
              getItemHeight={() => 52}
              style={{ flex: 1, height: '100%' }}
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
                      background: isSelected ? 'linear-gradient(90deg, rgba(46, 84, 116, 0.82) 0%, rgba(29, 52, 74, 0.76) 100%)' : 'transparent',
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
                        {menuMode === 'fracture' ? (
                          <span style={{ fontSize: 9, color: P.accent }}>
                            {`✦ ${row.fracturable} fracturable`}
                          </span>
                        ) : (
                          <span style={{ fontSize: 9, color: row.fracturable > 0 ? P.accent : P.textFaint }}>
                            {row.fracturable > 0 ? `✦ ${row.fracturable} fracturable` : '✦ none'}
                          </span>
                        )}
                        <span style={{ fontSize: 9, color: P.textMuted }}>◈ {row.cardLight} CL</span>
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
            <div style={{ margin: 'auto', color: P.textMuted, fontSize: 13, textAlign: 'center' }}>
              {menuMode === 'fracture'
                ? 'No cards are currently available to fracture'
                : 'Select a card to spend shards'}
            </div>
          ) : (
            <>
              {/* Card art + name header */}
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{
                  width: 90, height: 126, borderRadius: 10, flexShrink: 0,
                  position: 'relative', overflow: 'hidden',
                  ...getDenseCardFaceBackgroundStyle(selectedDef, 'normal', 'front', true),
                  border: `2px solid ${withAlpha(RARITY_COLOR[selectedRow.rarity] ?? P.accent, 0.7)}`,
                  boxShadow: justFractured
                    ? `0 0 0 3px ${withAlpha(P.accent, 0.6)}, 0 0 30px ${withAlpha(P.accent, 0.5)}`
                    : `0 4px 20px rgba(0,0,0,0.6)`,
                  transition: 'box-shadow 0.3s',
                }}>
                  {getCardBackgroundUrl(selectedDef) && <img src={getCardBackgroundUrl(selectedDef)!} alt="" loading="eager" decoding="async" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontFamily: uiTypography.display, color: P.text, letterSpacing: 1 }}>{selectedDef.name}</div>
                  <div style={{ fontSize: 11, color: RARITY_COLOR[selectedRow.rarity] ?? P.textMuted, marginTop: 3, letterSpacing: 0.5 }}>
                    {selectedRow.rarity}
                  </div>
                  <div style={{ fontSize: 11, color: P.textMuted, marginTop: 8 }}>
                    Owned: {selectedRow.owned} · Fracturable: {selectedRow.fracturable}
                  </div>
                  {menuMode === 'fracture' && (
                    <div style={{ fontSize: 11, color: P.textMuted }}>
                      Shard yield per fracture: <span style={{ color: P.accent }}>+{selectedRow.shardYield}</span>
                    </div>
                  )}

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

              {menuMode === 'fracture' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: P.textMuted }}>
                    Fracture duplicates
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {FRACTURE_PRESETS.map((preset) => {
                      const canUse = selectedRow.fracturable >= preset;
                      const gained = selectedRow.shardYield * preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          disabled={!canUse}
                          onClick={() => doFracture(preset)}
                          style={{
                            padding: '8px 14px', borderRadius: 8,
                            border: canUse
                              ? `1px solid ${withAlpha(P.accent, 0.6)}`
                              : `1px solid ${withAlpha(P.textFaint, 0.3)}`,
                            background: canUse
                              ? withAlpha(P.accent, 0.15)
                              : withAlpha(P.textFaint, 0.06),
                            color: canUse ? P.accent : P.textFaint,
                            fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase',
                            cursor: canUse ? 'pointer' : 'not-allowed',
                            fontFamily: uiTypography.display,
                          }}
                        >
                          {preset} ({gained})
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={selectedRow.fracturable <= 0}
                      onClick={() => doFracture(selectedRow.fracturable)}
                      style={{
                        padding: '8px 14px', borderRadius: 8,
                        border: selectedRow.fracturable > 0
                          ? `1px solid ${withAlpha(P.accent, 0.6)}`
                          : `1px solid ${withAlpha(P.textFaint, 0.3)}`,
                        background: selectedRow.fracturable > 0
                          ? withAlpha(P.accent, 0.15)
                          : withAlpha(P.textFaint, 0.06),
                        color: selectedRow.fracturable > 0 ? P.accent : P.textFaint,
                        fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase',
                        cursor: selectedRow.fracturable > 0 ? 'pointer' : 'not-allowed',
                        fontFamily: uiTypography.display,
                      }}
                    >
                      MAX ({selectedRow.fracturable * selectedRow.shardYield})
                    </button>
                  </div>
                </div>
              )}

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
                            : withAlpha('#172a40', 0.88),
                        border: claimed
                          ? '1px solid rgba(255,215,0,0.5)'
                          : reached
                            ? `1px solid ${withAlpha(P.accent, 0.4)}`
                            : `1px solid ${withAlpha(P.borderStrong, 0.5)}`,
                        fontSize: 10, textAlign: 'center',
                        color: claimed ? '#ffd700' : reached ? P.accent : P.textMuted,
                      }}>
                        <div style={{ fontFamily: uiTypography.display }}>{t.label}</div>
                        <div style={{ opacity: 0.92 }}>{t.threshold.toLocaleString()} CL</div>
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

              {menuMode === 'shards' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: P.textMuted }}>
                    Spend Fracture Shards as Card-light
                  </div>
                  <div style={{ fontSize: 11, color: P.textMuted }}>
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
