import { useState } from 'react';
import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { ELEMENT_COLORS, ELEMENT_SET_NAMES } from '@/data/elements';
import { CardRegistry } from '@/cards/CardRegistry';
import { getTrialDeckDefinition } from '@/data/trialDecks';
import { warmTheme, uiTypography } from '@/ui/theme';
import PackOpeningModal from './PackOpeningModal';
import CollectionViewer from './CollectionViewer';
import HolofoilWorkshop from './HolofoilWorkshop';
import CoreMechanicEngineModal from './CoreMechanicEngineModal';
import { getSpotlightPackId, getSpotlightPackCost, SPOTLIGHT_DISCOUNT } from '@/systems/progression/spotlightPack';
import { getDailyDealPackId, getDailyDealCost, DAILY_DEAL_DISCOUNT } from '@/systems/progression/dailyDeal';

const RARITY_COLORS: Record<string, string> = {
  Common: '#b8bcc6', Rare: '#7cbcff', Epic: '#c58bff', Legendary: '#ffd38a', Eternal: '#ff9f9f', Infinite: '#f2f4ff',
};

const PACK_ART_BASE = `${import.meta.env.BASE_URL}assets/pack-art`;
const PACK_ART: Record<string, string> = {
  'pack-neutrality': `${PACK_ART_BASE}/NeutralityPackArt.png`,
  'pack-pyroabyss': `${PACK_ART_BASE}/PyroabyssPackArt.png`,
  'pack-heavenly-light': `${PACK_ART_BASE}/HeavenlyLightPackArt.png`,
  'pack-thornbound-plains': `${PACK_ART_BASE}/ThornboundPlainsPackArt.png`,
  'pack-mechanical-dreams': `${PACK_ART_BASE}/MechanicalDreamsPackArt.png`,
  'pack-prismatic-accord': `${PACK_ART_BASE}/PrismaticAccordPackArt.png`,
  'pack-black-glass-inferno': `${PACK_ART_BASE}/BlackGlassPackArt.png`,
  'pack-snowbound-voltage': `${PACK_ART_BASE}/SnowboundVoltagePackArt.png`,
  'pack-glass-absolute': `${PACK_ART_BASE}/GlassAbsolutePackArt.png`,
  'pack-blazing-garden': `${PACK_ART_BASE}/BlazingGardenPackArt.png`,
  'pack-age-of-the-butterfly': `${PACK_ART_BASE}/AgeOfTheButterflyPackArt.png`,
  'pack-eternal-seas': `${PACK_ART_BASE}/EternalSeasPackArt.png`,
  'pack-abyssal-forge': `${PACK_ART_BASE}/AbyssalForgePackArt.png`,
  'pack-death-flamed-hell': `${PACK_ART_BASE}/Death-flamedHellPackArt.png`,
  'pack-wished-upon-a-star': `${PACK_ART_BASE}/WishedUponAStarEVENTPackArt.png`,
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 16% 8%, rgba(78,158,220,0.18) 0%, rgba(78,158,220,0) 34%), radial-gradient(circle at 84% 90%, rgba(20,55,180,0.28) 0%, rgba(20,55,180,0) 42%), repeating-linear-gradient(135deg, rgba(88,170,218,0.04) 0px, rgba(88,170,218,0.04) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 22px), linear-gradient(180deg, rgba(3,8,18,0.98) 0%, rgba(5,11,24,0.98) 100%)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'auto',
    fontFamily: uiTypography.body,
    color: '#c8dff2',
  },
  header: {
    padding: '16px 24px',
    borderBottom: `1px solid ${warmTheme.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    background: 'rgba(9, 12, 16, 0.42)',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#7dd4f8', letterSpacing: 2, textShadow: '0 0 28px rgba(88,180,235,0.55), 0 2px 6px rgba(0,0,0,0.8)' },
  score: { fontSize: 13, color: 'rgba(210,235,255,0.82)' },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 18px 18px',
    display: 'flex',
    justifyContent: 'center',
  },
  packsColumn: {
    width: 'min(1220px, 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  packGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
    gap: 12,
    alignItems: 'start',
  },
  packCard: {
    width: '100%',
    background: 'linear-gradient(180deg, rgba(4,10,24,0.97) 0%, rgba(6,14,30,0.97) 100%)',
    border: '1px solid rgba(110,160,215,0.34)',
    borderRadius: 16,
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    boxShadow: 'inset 0 1px 0 rgba(140,210,255,0.08), 0 2px 14px rgba(0,0,0,0.60)',
  },
  packLocked: {
    opacity: 0.5,
    filter: 'grayscale(0.6)',
  },
  packName: { fontSize: 16, fontWeight: 'bold', color: '#96daff' },
  packDesc: { fontSize: 11, color: 'rgba(205,228,255,0.78)', lineHeight: 1.42 },
  packCost: { fontSize: 13, color: '#90d0f8' },
  openBtn: {
    padding: '8px 16px',
    borderRadius: 10,
    border: `1px solid rgba(72,148,210,0.60)`,
    background: 'linear-gradient(180deg, #6ec8f0 0%, #4298d8 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(60,140,210,0.35)',
    color: '#05111f',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: uiTypography.body,
    cursor: 'pointer',
    letterSpacing: 1,
    transition: 'background 0.15s',
    textAlign: 'left' as const,
    width: '100%',
  },
  openBtnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  lockedLabel: {
    fontSize: 12,
    color: warmTheme.textMuted,
    fontStyle: 'italic',
    textAlign: 'center' as const,
  },
  cardPreview: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  rarityChip: {
    fontSize: 9,
    padding: '2px 7px',
    borderRadius: 3,
    background: 'linear-gradient(180deg, rgba(5,11,24,0.94) 0%, rgba(4,8,18,0.94) 100%)',
    border: '1px solid rgba(110,165,220,0.34)',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
    letterSpacing: 1,
  },
  footer: {
    padding: '12px 24px',
    borderTop: `1px solid ${warmTheme.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  tabBar: {
    display: 'flex',
    gap: 8,
    padding: '12px 24px',
    borderBottom: `1px solid ${warmTheme.border}`,
    flexShrink: 0,
    background: 'rgba(9, 12, 16, 0.32)',
  },
  tabBtn: {
    padding: '6px 16px',
    borderRadius: 999,
    border: `1px solid rgba(100,140,188,0.28)`,
    background: 'rgba(5,18,36,0.85)',
    color: '#c8dff2',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: uiTypography.body,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: '8px 20px',
    borderRadius: 10,
    border: `1px solid rgba(100,140,188,0.28)`,
    background: 'rgba(5,18,36,0.85)',
    color: '#c8dff2',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: uiTypography.body,
  },
  collectionBar: {
    fontSize: 11,
    color: 'rgba(190,215,245,0.72)',
  },
  helpPanel: {
    width: '100%',
    background: 'linear-gradient(180deg, rgba(4,10,24,0.93) 0%, rgba(3,8,18,0.93) 100%)',
    border: '1px solid rgba(110,160,215,0.34)',
    boxShadow: 'inset 0 1px 0 rgba(140,210,255,0.07), 0 2px 12px rgba(0,0,0,0.55)',
    borderRadius: 14,
    padding: '10px 12px',
    fontSize: 10,
    color: 'rgba(205,228,255,0.82)',
    lineHeight: 1.4,
  },
  helpGrid: {
    marginTop: 6,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 6,
  },
  helpItem: {
    border: '1px solid rgba(110,165,220,0.24)',
    borderRadius: 8,
    padding: '6px 8px',
    background: 'rgba(3,8,20,0.40)',
  },
  pityNote: {
    marginTop: 4,
    borderTop: '1px solid rgba(110,165,220,0.26)',
    paddingTop: 7,
    fontSize: 9,
    color: 'rgba(190,215,245,0.80)',
    lineHeight: 1.45,
  },
  eventDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 0',
  } as React.CSSProperties,
  eventDividerLine: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(180, 130, 255, 0.5), transparent)',
  } as React.CSSProperties,
  eventDividerLabel: {
    fontSize: 11,
    color: '#d9a6f5',
    letterSpacing: 2,
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '4px 12px',
    border: '1px solid rgba(200, 130, 240, 0.4)',
    borderRadius: 20,
    background: 'rgba(190, 110, 230, 0.12)',
  } as React.CSSProperties,
};

interface Props { onClose: () => void; onStartTrial: (packId: string) => void }

export default function CardPackStore({ onClose, onStartTrial }: Props) {
  const oblivion = useStore(s => s.progress.oblivion);
  const shards = useStore(s => s.progress.aberratedShards);
  const collection = useStore(s => s.progress.collection);
  const pityCounters = useStore(s => s.progress.pityCounters);
  const packPityCounters = useStore(s => s.progress.packPityCounters ?? {});
  const [openingResult, setOpeningResult] = useState<{ cards: string[]; packName: string; newCards: Set<string> } | null>(null);
  const [showCollection, setShowCollection] = useState(false);
  const [coreEnginePackId, setCoreEnginePackId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'packs' | 'holofoils' | 'history'>('packs');
  const [focusPackId, setFocusPackId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<1 | 5 | 100>(1);
  const packRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ packId: string }>;
      const packId = ce.detail?.packId;
      if (!packId) return;
      setShowCollection(false);
      setActiveTab('packs');
      setFocusPackId(packId);
      window.setTimeout(() => {
        const el = packRefs.current[packId];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => setFocusPackId(null), 2200);
      }, 100);
    };
    window.addEventListener('focusPackInStore', handler);
    return () => window.removeEventListener('focusPackInStore', handler);
  }, []);

  const handleOpen = (packId: string, tier: 'pack' | 'box' | 'case') => {
    const preOpenCollection = new Set(Object.keys(useStore.getState().progress.collection));
    const aggregated: string[] = [];
    for (let i = 0; i < quantity; i++) {
      const state = useStore.getState();
      const result = tier === 'pack' ? state.openPack(packId)
        : tier === 'box' ? state.openBox(packId)
        : state.openCase(packId);
      if (!result) break;
      aggregated.push(...result);
    }
    if (aggregated.length > 0) {
      const pack = PACK_DEFINITIONS.find(p => p.id === packId);
      const tierLabel = tier === 'pack' ? 'Pack' : tier === 'box' ? 'Box' : 'Case';
      const newCards = new Set(aggregated.filter(id => !preOpenCollection.has(id)));
      const qtyLabel = quantity > 1 ? ` ×${quantity}` : '';
      setOpeningResult({ cards: aggregated, packName: `${pack?.name ?? 'Pack'} ${tierLabel}${qtyLabel}`, newCards });
    }
  };

  const rarityCount = (poolIds: string[], rarity: string) =>
    poolIds.filter(id => CardRegistry.get(id)?.rarity === rarity).length;

  const renderPackCard = (pack: typeof PACK_DEFINITIONS[0]) => {
    const elementColor = ELEMENT_COLORS[pack.element] ?? '#aaa';
    const setName = ELEMENT_SET_NAMES[pack.element] ?? pack.element;
    const isSpotlight = pack.id === getSpotlightPackId();
    const isDailyDeal = pack.id === getDailyDealPackId();
    // Daily Deal stacks first (cheaper), spotlight as fallback.
    const featuredPackCost = isDailyDeal
      ? getDailyDealCost(pack.cost)
      : (isSpotlight ? getSpotlightPackCost(pack.cost) : pack.cost);
    const featuredDiscountLabel = isDailyDeal
      ? `${Math.round(DAILY_DEAL_DISCOUNT * 100)}% off · Daily Deal`
      : (isSpotlight ? `${Math.round(SPOTLIGHT_DISCOUNT * 100)}% off` : '');
    const boxCost = Math.round(pack.cost * 5 * 0.98);
    const caseCost = Math.round(boxCost * 2 * 0.96);
    const boxPityMisses = pityCounters[pack.id] ?? 0;
    const boxGuaranteedNext = boxPityMisses >= 2;
    const boxesUntilPity = Math.max(0, 3 - boxPityMisses);
    const packPityMisses = packPityCounters[pack.id] ?? 0;
    const packEpicPityThreshold = 10;
    const packGuaranteedNext = packPityMisses + 1 >= packEpicPityThreshold;
    const packsUntilEpicPity = Math.max(0, packEpicPityThreshold - packPityMisses);

    // Compute effective locked state from oblivionUnlock milestone
    const isLocked = pack.oblivionUnlock !== undefined
      ? oblivion < pack.oblivionUnlock
      : pack.locked;

    const usesShards = (pack as typeof pack & { currencyType?: string }).currencyType === 'aberratedShards';
    const currencyLabel = usesShards ? 'Aberrated Shards' : 'Oblivion';

    const tiers = usesShards
      ? [{ tier: 'pack' as const, label: 'Pack', cards: pack.cardsPerOpen, cost: pack.cost, discount: '' }]
      : [
        { tier: 'pack' as const, label: 'Pack',  cards: pack.cardsPerOpen,      cost: featuredPackCost, discount: featuredDiscountLabel },
        { tier: 'box'  as const, label: 'Box',   cards: pack.cardsPerOpen * 5,  cost: boxCost,   discount: '2% off' },
        { tier: 'case' as const, label: 'Case',  cards: pack.cardsPerOpen * 10, cost: caseCost,  discount: '4% off' },
      ];

    const artSrc = PACK_ART[pack.id];
    const displayName = pack.name.replace(/^\[EVENT\]\s*/, '');
    const hasTrial = !isLocked && getTrialDeckDefinition(pack.id) !== null;

    return (
      <div
        key={pack.id}
        ref={(el) => { packRefs.current[pack.id] = el; }}
        className={isLocked ? undefined : 'ui-tile-hover'}
        style={{
          ...styles.packCard,
          ...(isLocked ? styles.packLocked : {}),
          ...(focusPackId === pack.id ? {
            outline: '2px solid #ffd86b',
            outlineOffset: 4,
            boxShadow: '0 0 36px rgba(255, 216, 107, 0.7)',
            transition: 'box-shadow 220ms ease, outline-color 220ms ease',
          } : {}),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: elementColor, flexShrink: 0,
            boxShadow: `0 0 8px ${elementColor}`,
          }} />
          <div style={styles.packName}>{displayName}</div>
          {isSpotlight && (
            <div style={{
              fontSize: 9,
              letterSpacing: 1.2,
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: 4,
              background: warmTheme.accent,
              color: '#fff',
              marginLeft: 'auto',
            }}>FEATURED</div>
          )}
        </div>

        {artSrc && (
          <img
            src={artSrc}
            alt={displayName}
            style={{ width: '100%', height: 130, borderRadius: 8, objectFit: 'cover', display: 'block' }}
          />
        )}

        <div style={styles.packDesc}>{pack.description}</div>

        <div style={styles.cardPreview}>
          {(['Common', 'Rare', 'Epic', 'Legendary'] as const).map(r => {
            const count = rarityCount(pack.cardPool, r);
            if (count === 0) return null;
            return (
              <span key={r} style={{ ...styles.rarityChip, color: RARITY_COLORS[r] }}>
                {count} {r}
              </span>
            );
          })}
        </div>

        {isLocked ? (
          <div style={styles.lockedLabel}>
            {pack.oblivionUnlock !== undefined ? (
              <>
                <div style={{ marginBottom: 4 }}>
                  🔒 {setName} — Unlocks at {pack.oblivionUnlock.toLocaleString()} Oblivion
                </div>
              </>
            ) : '🔒 Coming Soon'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tiers.map(({ tier, label, cards, cost, discount }) => {
              const totalCost = cost * quantity;
              const totalCards = cards * quantity;
              const canAfford = usesShards ? shards >= totalCost : oblivion >= totalCost;
              return (
                <button
                  key={tier}
                  data-sfx="claim"
                  style={{ ...styles.openBtn, ...(canAfford ? {} : styles.openBtnDisabled) }}
                  onClick={canAfford ? () => handleOpen(pack.id, tier) : undefined}
                >
                  <span style={{ fontWeight: 'bold' }}>
                    {label}{quantity > 1 && <span style={{ color: 'rgba(12,30,52,0.65)', marginLeft: 4 }}>×{quantity}</span>}
                  </span>
                  <span style={{ color: 'rgba(12,30,52,0.55)', marginLeft: 6, fontWeight: 700 }}>({totalCards} cards)</span>
                  <span style={{ float: 'right', fontSize: 11, color: 'rgba(12,30,52,0.80)', fontWeight: 700 }}>
                    {totalCost.toLocaleString()} {currencyLabel}
                    {discount && <span style={{ color: 'rgba(100,220,100,0.8)', marginLeft: 5 }}>{discount}</span>}
                  </span>
                </button>
              );
            })}

            <div style={styles.pityNote}>
              {packGuaranteedNext && (
                <div style={{
                  marginBottom: 5,
                  padding: '4px 7px',
                  borderRadius: 4,
                  background: 'rgba(190, 110, 230, 0.18)',
                  border: '1px solid rgba(200, 130, 240, 0.55)',
                  color: '#e6b3ff',
                  fontWeight: 700,
                  letterSpacing: 0.4,
                }}>
                  🎯 Next Pack guaranteed Epic+
                </div>
              )}
              {!usesShards && boxGuaranteedNext && (
                <div style={{
                  marginBottom: 5,
                  padding: '4px 7px',
                  borderRadius: 4,
                  background: 'rgba(255, 170, 60, 0.20)',
                  border: '1px solid rgba(255, 200, 100, 0.6)',
                  color: '#ffd07a',
                  fontWeight: 700,
                  letterSpacing: 0.4,
                }}>
                  🌟 Next Box guaranteed Legendary
                </div>
              )}
              <div>
                <span style={{ color: '#d9a6f5' }}>Pack Epic Pity:</span>{' '}
                {packGuaranteedNext
                  ? 'Next Pack guaranteed.'
                  : `${packsUntilEpicPity} Pack${packsUntilEpicPity === 1 ? '' : 's'} until guaranteed Epic+.`}
              </div>
              {!usesShards && (
                <div>
                  <span style={{ color: '#7bbde8' }}>Box Legendary Pity:</span>{' '}
                  {boxGuaranteedNext
                    ? 'Next Box guaranteed.'
                    : `${boxesUntilPity} Box${boxesUntilPity === 1 ? '' : 'es'} until guaranteed.`}
                </div>
              )}
            </div>
          </div>
        )}
        {hasTrial && (
          <button
            data-sfx="click"
            onClick={() => setCoreEnginePackId(pack.id)}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid rgba(120, 200, 140, 0.50)',
              background: 'linear-gradient(180deg, rgba(60,140,80,0.28) 0%, rgba(40,100,60,0.28) 100%)',
              color: '#8de8a8',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: uiTypography.body,
              cursor: 'pointer',
              letterSpacing: 1,
              textAlign: 'center' as const,
              width: '100%',
            }}
          >
            Core Mechanic Engine
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="ui-panel-intro" style={{ ...styles.overlay, ['--ui-accent' as any]: '240, 189, 120', ['--ui-accent-soft' as any]: '250, 224, 184' } as React.CSSProperties}>
      <div style={{ ...styles.header, position: 'relative' }}>
        <div className="ui-title-glow" style={styles.title}>Card Store</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={styles.score}>Oblivion: {Math.floor(oblivion).toLocaleString()}</div>
          <div style={styles.score}>Aberrated Shards: {shards.toLocaleString()}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <div style={styles.collectionBar}>{Object.keys(collection).length} unique cards collected</div>
            <button
              onClick={() => setShowCollection(true)}
              style={{
                padding: '4px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                fontFamily: uiTypography.body, letterSpacing: 1,
                background: 'rgba(58,142,200,0.10)', border: '1px solid rgba(88,170,218,0.35)',
                color: '#7bbde8',
              }}
            >
              View Collection
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(205,228,255,0.72)', fontWeight: 700 }}>
              Buy Qty
            </span>
            {([1, 5, 100] as const).map(q => {
              const active = quantity === q;
              return (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 5,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: uiTypography.body,
                    letterSpacing: 1,
                    fontWeight: 700,
                    background: active ? 'rgba(78,160,220,0.32)' : 'rgba(58,142,200,0.07)',
                    border: `1px solid ${active ? 'rgba(110,185,240,0.78)' : 'rgba(88,170,218,0.26)'}`,
                    color: active ? '#d8f0ff' : 'rgba(110,185,240,0.72)',
                    boxShadow: active ? '0 0 12px rgba(78,160,220,0.40), inset 0 1px 0 rgba(200,235,255,0.12)' : 'none',
                  }}
                >
                  ×{q}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={styles.tabBar}>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'packs'
              ? { color: '#0c1e34', borderColor: 'rgba(88,170,218,0.70)', background: 'rgba(88,170,218,0.88)' }
              : {}),
          }}
          onClick={() => setActiveTab('packs')}
        >
          Packs
        </button>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'holofoils'
              ? { color: '#0c1e34', borderColor: 'rgba(88,170,218,0.70)', background: 'rgba(88,170,218,0.88)' }
              : {}),
          }}
          onClick={() => setActiveTab('holofoils')}
        >
          Holofoils
        </button>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'history'
              ? { color: '#0c1e34', borderColor: 'rgba(88,170,218,0.70)', background: 'rgba(88,170,218,0.88)' }
              : {}),
          }}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {activeTab === 'packs' ? (
        <div style={styles.body}>
          <div style={styles.packsColumn}>
            <div style={styles.helpPanel}>
              <strong style={{ color: '#7dd4f8', letterSpacing: 1 }}>How Opening Works</strong>
              <div style={styles.helpGrid}>
                <div style={styles.helpItem}><strong>Pack:</strong> 5 cards with normal rarity odds.</div>
                <div style={styles.helpItem}><strong>Box:</strong> 25 cards (5 packs), 2% discount, Legendary pity for that set.</div>
                <div style={styles.helpItem}><strong>Case:</strong> 50 cards (10 packs), 4% discount, at least 1 guaranteed Legendary.</div>
                <div style={styles.helpItem}>
                  <strong>Legendary Box Pity:</strong> 2 no-Legendary Boxes in a set makes the next Box guaranteed.
                </div>
                <div style={styles.helpItem}>
                  <strong>Epic Pack Pity:</strong> 10 single Packs without an Epic+ guarantees the next.
                </div>
              </div>
            </div>

            <div className="ui-grid-stagger" style={styles.packGrid}>
            {PACK_DEFINITIONS.filter(p => !(p as typeof p & { currencyType?: string }).currencyType).map(renderPackCard)}
            </div>

            {PACK_DEFINITIONS.some(p => (p as typeof p & { currencyType?: string }).currencyType) && (
              <>
                <div style={styles.eventDivider}>
                  <div style={styles.eventDividerLine} />
                  <span style={styles.eventDividerLabel}>⭐  Event Packs</span>
                  <div style={styles.eventDividerLine} />
                </div>
                <div className="ui-grid-stagger" style={{ ...styles.packGrid, gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 320px))', justifyContent: 'start' }}>
                {PACK_DEFINITIONS.filter(p => (p as typeof p & { currencyType?: string }).currencyType === 'aberratedShards').map(renderPackCard)}
                </div>
              </>
            )}

          </div>
        </div>
      ) : activeTab === 'holofoils' ? (
        <HolofoilWorkshop />
      ) : (
        <PackHistoryPanel />
      )}

      <div style={styles.footer}>
        <button style={styles.closeBtn} onClick={onClose}>Close</button>
      </div>

      {openingResult && (
        <PackOpeningModal
          cards={openingResult.cards}
          packName={openingResult.packName}
          newCards={openingResult.newCards}
          onClose={() => setOpeningResult(null)}
        />
      )}

      {showCollection && <CollectionViewer onClose={() => setShowCollection(false)} />}

      {coreEnginePackId && (
        <CoreMechanicEngineModal
          packId={coreEnginePackId}
          packName={PACK_DEFINITIONS.find(p => p.id === coreEnginePackId)?.name.replace(/^\[EVENT\]\s*/, '') ?? coreEnginePackId}
          cardPool={PACK_DEFINITIONS.find(p => p.id === coreEnginePackId)?.cardPool ?? []}
          onStartTrial={onStartTrial}
          onClose={() => setCoreEnginePackId(null)}
        />
      )}
    </div>
  );
}

const RARITY_DISPLAY_ORDER = ['Legendary', 'Eternal', 'Infinite', 'Epic', 'Rare', 'Common'] as const;

function PackHistoryPanel() {
  const history = useStore(s => s.progress.packOpenHistory ?? []);
  const packPityCounters = useStore(s => s.progress.packPityCounters ?? {});
  const boxPityCounters = useStore(s => s.progress.pityCounters ?? {});

  // Aggregate totals across history
  const totalCardsByRarity: Record<string, number> = {};
  for (const entry of history) {
    for (const [r, n] of Object.entries(entry.rarityCounts)) {
      totalCardsByRarity[r] = (totalCardsByRarity[r] ?? 0) + n;
    }
  }
  const formatTs = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 24px 18px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          padding: 14, borderRadius: 12,
          background: 'rgba(5,12,28,0.70)',
          border: `1px solid rgba(62,112,168,0.28)`,
        }}>
          <div style={{ fontSize: 13, color: '#58aada', letterSpacing: 1, marginBottom: 8 }}>Recent Streaks</div>
          {Object.keys(packPityCounters).length === 0 && Object.keys(boxPityCounters).length === 0 ? (
            <div style={{ fontSize: 12, color: 'rgba(190,215,245,0.60)' }}>No active streaks.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(packPityCounters).filter(([, v]) => v > 0).map(([packId, n]) => {
                const pack = PACK_DEFINITIONS.find(p => p.id === packId);
                return (
                  <div key={`epic-${packId}`} style={{ fontSize: 11, color: '#c58bff' }}>
                    {pack?.name ?? packId}: {n} pack{n === 1 ? '' : 's'} without Epic+ ({10 - n} until guarantee)
                  </div>
                );
              })}
              {Object.entries(boxPityCounters).filter(([, v]) => v > 0).map(([packId, n]) => {
                const pack = PACK_DEFINITIONS.find(p => p.id === packId);
                return (
                  <div key={`leg-${packId}`} style={{ fontSize: 11, color: '#ffd38a' }}>
                    {pack?.name ?? packId}: {n} box{n === 1 ? '' : 'es'} without Legendary ({Math.max(0, 3 - n)} until guarantee)
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div style={{
            padding: 14, borderRadius: 12,
            background: 'rgba(5,12,28,0.70)',
            border: `1px solid rgba(62,112,168,0.28)`,
          }}>
            <div style={{ fontSize: 13, color: '#58aada', letterSpacing: 1, marginBottom: 8 }}>
              Last {history.length} opens · totals
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12 }}>
              {RARITY_DISPLAY_ORDER.map(r => {
                const n = totalCardsByRarity[r] ?? 0;
                if (n === 0) return null;
                return (
                  <div key={r} style={{ color: RARITY_COLORS[r] ?? '#ccc' }}>
                    {r}: <strong>{n}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{
          padding: 14, borderRadius: 12,
          background: 'rgba(5,12,28,0.70)',
          border: `1px solid rgba(62,112,168,0.28)`,
        }}>
          <div style={{ fontSize: 13, color: '#58aada', letterSpacing: 1, marginBottom: 8 }}>
            Open History ({history.length})
          </div>
          {history.length === 0 ? (
            <div style={{ fontSize: 12, color: 'rgba(190,215,245,0.60)' }}>No pack opens recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.map((entry, idx) => {
                const pack = PACK_DEFINITIONS.find(p => p.id === entry.packId);
                const tierLabel = entry.tier === 'pack' ? 'Pack' : entry.tier === 'box' ? 'Box' : 'Case';
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 11, padding: '6px 10px',
                    background: 'rgba(9, 12, 16, 0.45)',
                    border: '1px solid rgba(62,112,168,0.20)',
                    borderRadius: 6,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ color: '#7bbde8', fontWeight: 600 }}>{pack?.name ?? entry.packId} · {tierLabel}</span>
                      <span style={{ color: 'rgba(190,215,245,0.50)', fontSize: 10 }}>{formatTs(entry.ts)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {RARITY_DISPLAY_ORDER.map(r => {
                        const n = entry.rarityCounts[r] ?? 0;
                        if (n === 0) return null;
                        return (
                          <span key={r} style={{ color: RARITY_COLORS[r] ?? '#ccc', fontWeight: 600 }}>
                            {n}× {r}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
