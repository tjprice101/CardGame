import { useState } from 'react';
import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { CardRegistry } from '@/cards/CardRegistry';
import { warmTheme, uiTypography } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import PackOpeningModal from './PackOpeningModal';
import CollectionViewer from './CollectionViewer';
import AbilityMaterialization from './AbilityMaterialization';
import { getSpotlightPackId, getSpotlightPackCost, SPOTLIGHT_DISCOUNT } from '@/systems/progression/spotlightPack';
import { getDailyDealPackId, getDailyDealCost, DAILY_DEAL_DISCOUNT } from '@/systems/progression/dailyDeal';
import { getLiveCardFaceBackgroundStyle, getLiveCardShimmerClassName, getCardFaceMetrics, getCardNameRibbonStyle } from '@/ui/cardBackgrounds';

const RARITY_COLORS: Record<string, string> = {
  Common: '#b8bcc6', Rare: '#7cbcff', Epic: '#c58bff', Legendary: '#ffd38a', Eternal: '#ff9f9f', Infinite: '#f2f4ff',
};
const PACK_EPIC_PITY_THRESHOLD = 10;
const BOX_LEGENDARY_PITY_MISS_THRESHOLD = 4;

const PACK_ART_BASE = `${import.meta.env.BASE_URL}assets/pack-art`;
const PACK_ART: Record<string, string> = {
  'pack-neutrality': `${PACK_ART_BASE}/NeutralityPackArt.png`,
  'pack-causality': `${import.meta.env.BASE_URL}assets/event-art/causality/Causality BANNER.png`,
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'var(--profile-app-background, linear-gradient(180deg, #090a10, #05060a))',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'auto',
    fontFamily: uiTypography.body,
    color: 'var(--profile-text, #f8faff)',
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--profile-border, rgba(226,235,255,0.2))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    background: `linear-gradient(90deg, rgba(5,6,12,0.96) 0%, rgba(7,8,16,0.82) 58%, rgba(7,8,16,0.48) 100%), url("${import.meta.env.BASE_URL}assets/menu-banners/updated/card-store-archive.png") right center / cover`,
    boxShadow: '0 8px 26px rgba(0,0,0,0.32), inset 0 -1px 0 color-mix(in srgb, var(--profile-accent) 16%, transparent)',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: 'var(--profile-accent-soft, #b39aff)', letterSpacing: 2.5, textShadow: '0 0 28px color-mix(in srgb, var(--profile-accent-soft) 42%, transparent), 0 2px 6px rgba(0,0,0,0.8)' },
  score: { fontSize: 13, color: 'var(--profile-text-muted, rgba(218,225,241,0.74))' },
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 288px))',
    gap: 14,
    alignItems: 'start',
    justifyContent: 'start',
  },
  packCard: {
    width: '100%',
    background: 'linear-gradient(180deg, var(--profile-surface-strong, rgba(22,24,37,0.98)) 0%, var(--profile-surface-muted, rgba(7,8,14,0.94)) 100%)',
    border: '1px solid var(--profile-border, rgba(226,235,255,0.2))',
    borderRadius: 16,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--profile-text) 8%, transparent), 0 2px 14px rgba(0,0,0,0.60)',
  },
  packLocked: {
    opacity: 0.5,
    filter: 'grayscale(0.6)',
  },
  packName: { fontSize: 14, fontWeight: 'bold', color: 'var(--profile-accent, #61d8ff)', letterSpacing: 0.4 },
  packDesc: { fontSize: 11, color: 'var(--profile-text-muted, rgba(218,225,241,0.74))', lineHeight: 1.42 },
  packCost: { fontSize: 13, color: 'var(--profile-accent-soft, #b39aff)' },
  openBtn: {
    padding: '6px 12px',
    borderRadius: 10,
    border: '1px solid var(--profile-border-strong, rgba(150,191,255,0.58))',
    background: 'var(--profile-button, linear-gradient(110deg, #60d9ff, #9085ff 54%, #54298f))',
    boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--profile-text) 15%, transparent), 0 2px 8px color-mix(in srgb, var(--profile-accent) 35%, transparent)',
    color: 'var(--profile-accent-deep, #21113c)',
    fontSize: 11,
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
    background: 'linear-gradient(180deg, var(--profile-surface-strong, rgba(22,24,37,0.98)) 0%, var(--profile-surface-muted, rgba(7,8,14,0.94)) 100%)',
    border: '1px solid var(--profile-border, rgba(226,235,255,0.2))',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
    letterSpacing: 1,
  },
  footer: {
    padding: '12px 24px',
    borderTop: '1px solid var(--profile-border, rgba(226,235,255,0.2))',
    display: 'flex',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  tabBar: {
    display: 'flex',
    gap: 8,
    padding: '12px 24px',
    borderBottom: '1px solid var(--profile-border, rgba(226,235,255,0.2))',
    flexShrink: 0,
    background: 'color-mix(in srgb, var(--profile-surface-muted) 82%, transparent)',
  },
  tabBtn: {
    padding: '6px 16px',
    borderRadius: 999,
    border: '1px solid var(--profile-border, rgba(226,235,255,0.2))',
    background: 'var(--profile-surface-strong, rgba(22,24,37,0.98))',
    color: 'var(--profile-text-soft, rgba(248,250,255,0.92))',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: uiTypography.body,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: '8px 20px',
    borderRadius: 10,
    border: '1px solid var(--profile-border-strong, rgba(150,191,255,0.58))',
    background: 'var(--profile-surface-strong, rgba(22,24,37,0.98))',
    color: 'var(--profile-text-soft, rgba(248,250,255,0.92))',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: uiTypography.body,
  },
  collectionBar: {
    fontSize: 11,
    color: 'var(--profile-text-muted, rgba(218,225,241,0.74))',
  },
  helpPanel: {
    width: '100%',
    background: 'linear-gradient(180deg, var(--profile-surface-strong, rgba(22,24,37,0.98)) 0%, var(--profile-surface-muted, rgba(7,8,14,0.94)) 100%)',
    border: '1px solid var(--profile-border, rgba(226,235,255,0.2))',
    boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--profile-text) 7%, transparent), 0 2px 12px rgba(0,0,0,0.55)',
    borderRadius: 14,
    padding: '10px 12px',
    fontSize: 10,
    color: 'var(--profile-text-soft, rgba(248,250,255,0.92))',
    lineHeight: 1.4,
  },
  helpGrid: {
    marginTop: 6,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 6,
  },
  helpItem: {
    border: '1px solid var(--profile-border, rgba(226,235,255,0.2))',
    borderRadius: 8,
    padding: '6px 8px',
    background: 'color-mix(in srgb, var(--profile-surface-muted) 75%, transparent)',
  },
  pityNote: {
    marginTop: 4,
    borderTop: '1px solid var(--profile-border, rgba(226,235,255,0.2))',
    paddingTop: 7,
    fontSize: 9,
    color: 'var(--profile-text-muted, rgba(218,225,241,0.74))',
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
    background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--profile-accent-soft) 50%, transparent), transparent)',
  } as React.CSSProperties,
  eventDividerLabel: {
    fontSize: 11,
    color: 'var(--profile-accent-soft, #b39aff)',
    letterSpacing: 2,
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '4px 12px',
    border: '1px solid var(--profile-border-strong, rgba(150,191,255,0.58))',
    borderRadius: 20,
    background: 'color-mix(in srgb, var(--profile-accent-soft) 12%, transparent)',
  } as React.CSSProperties,
};

function BulkHolofoilResult(props: {
  packName: string;
  totalCards: number;
  holoCards: Array<{ definitionId: string; count: number }>;
  onClose: () => void;
}) {
  const metrics = getCardFaceMetrics('grid');
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, background: 'rgba(3, 5, 12, 0.92)', backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        width: 'min(900px, 96vw)', maxHeight: '88vh', overflowY: 'auto', padding: 28,
        border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: 14,
        background: 'linear-gradient(145deg, rgba(255,255,255,0.16), rgba(24,7,12,0.96) 42%, rgba(5,5,10,0.98))',
        boxShadow: '0 0 55px rgba(255, 255, 255, 0.2), 0 18px 60px rgba(0,0,0,0.65)', color: '#fff',
        fontFamily: uiTypography.body,
      }}>
        <div style={{ fontFamily: uiTypography.display, fontSize: 13, letterSpacing: 3, color: '#fff', textTransform: 'uppercase' }}>
          Bulk Purchase Complete
        </div>
        <div style={{ marginTop: 8, fontFamily: uiTypography.display, fontSize: 28, letterSpacing: 1.2 }}>
          {props.packName}
        </div>
        <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.72)', fontSize: 13 }}>
          {props.totalCards.toLocaleString()} cards were added to your collection.
        </div>
        <div style={{ marginTop: 24, fontFamily: uiTypography.display, fontSize: 12, letterSpacing: 2, color: '#ffced8', textTransform: 'uppercase' }}>
          Holographic Cards Received
        </div>
        {props.holoCards.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginTop: 14 }}>
            {props.holoCards.map(card => {
              const definition = CardRegistry.get(card.definitionId);
              return (
                <div key={card.definitionId} className={definition ? getLiveCardShimmerClassName(definition, 'holo', 'front') : undefined} style={{ position: 'relative', minHeight: 190, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.92)', background: '#111' }}>
                  <div style={{ position: 'absolute', inset: 0, ...getLiveCardFaceBackgroundStyle(definition, 'holo', 'front'), backgroundSize: 'cover' }} />
                  <div style={{ position: 'relative', zIndex: 1, minHeight: 190, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 10, background: 'linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.76))' }}>
                    <div style={getCardNameRibbonStyle('pack')}>
                      <div style={{ fontSize: metrics.typeSize }}>{definition?.type ?? 'Card'}</div>
                      <div style={{ fontSize: metrics.nameSize }}>{definition?.name ?? card.definitionId}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 8, color: '#fff' }}>
                      <span style={{ fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase' }}>Holographic</span>
                      <strong style={{ fontSize: 20 }}>×{card.count}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ marginTop: 14, padding: 20, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: 'rgba(255,255,255,0.68)' }}>
            No holographic cards were rolled in this purchase.
          </div>
        )}
        <button type="button" onClick={props.onClose} style={{ marginTop: 24, padding: '10px 28px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.14)', color: '#fff', cursor: 'pointer', fontFamily: uiTypography.display, letterSpacing: 1 }}>
          Continue
        </button>
      </div>
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export default function CardPackStore({ onClose }: Props) {
  useThemeVersion();
  const divineLight = useStore(s => s.progress.divineLight);
  const shards = useStore(s => s.progress.aberratedShards);
  const collection = useStore(s => s.progress.collection);
  const pityCounters = useStore(s => s.progress.pityCounters);
  const packPityCounters = useStore(s => s.progress.packPityCounters ?? {});
  const [openingResult, setOpeningResult] = useState<{ cards: string[]; packName: string; newCards: Set<string>; holoIndices: Set<number> } | null>(null);
  const [bulkResult, setBulkResult] = useState<{ packName: string; totalCards: number; holoCards: Array<{ definitionId: string; count: number }> } | null>(null);
  const [showCollection, setShowCollection] = useState(false);
  const [activeTab, setActiveTab] = useState<'packs' | 'history' | 'abilities'>('packs');
  const [selectedPackId, setSelectedPackId] = useState('pack-neutrality');
  const [focusPackId, setFocusPackId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<1 | 5 | 100>(1);
  const packRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ packId: string }>;
      const packId = ce.detail?.packId;
      if (!packId) return;
      setShowCollection(false);
      setActiveTab('packs');
      setSelectedPackId(packId);
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
    const preOpenHolofoilCounts = { ...useStore.getState().progress.holoCollection };
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
      const currentHolofoilCounts = useStore.getState().progress.holoCollection;
      const remainingHoloByDefinition = new Map(
        Object.entries(currentHolofoilCounts).map(([definitionId, count]) => [
          definitionId,
          Math.max(0, count - (preOpenHolofoilCounts[definitionId] ?? 0)),
        ]),
      );
      const holoIndices = new Set<number>();
      aggregated.forEach((definitionId, index) => {
        const remaining = remainingHoloByDefinition.get(definitionId) ?? 0;
        if (remaining > 0) {
          holoIndices.add(index);
          remainingHoloByDefinition.set(definitionId, remaining - 1);
        }
      });
      const qtyLabel = quantity > 1 ? ` ×${quantity}` : '';
      const packName = `${pack?.name ?? 'Pack'} ${tierLabel}${qtyLabel}`;
      if (quantity > 1) {
        const holoCards = Object.entries(currentHolofoilCounts)
          .map(([definitionId, count]) => ({ definitionId, count: Math.max(0, count - (preOpenHolofoilCounts[definitionId] ?? 0)) }))
          .filter(card => card.count > 0)
          .sort((a, b) => b.count - a.count || a.definitionId.localeCompare(b.definitionId));
        setBulkResult({ packName, totalCards: aggregated.length, holoCards });
      } else {
        setOpeningResult({ cards: aggregated, packName, newCards, holoIndices });
      }
    }
  };

  const rarityCount = (poolIds: string[], rarity: string) =>
    poolIds.filter(id => CardRegistry.get(id)?.rarity === rarity).length;
  const selectedPack = PACK_DEFINITIONS.find(pack => pack.id === selectedPackId) ?? PACK_DEFINITIONS[0];
  const uniqueCardsCollected = Object.values(collection).filter(copies => copies > 0).length;
  const totalRegisteredCards = CardRegistry.getAll().length;

  const renderPackCard = (pack: typeof PACK_DEFINITIONS[0]) => {
    const setName = pack.setId;
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
    const boxGuaranteedNext = boxPityMisses >= BOX_LEGENDARY_PITY_MISS_THRESHOLD;
    const boxesUntilPity = Math.max(0, BOX_LEGENDARY_PITY_MISS_THRESHOLD - boxPityMisses);
    const packPityMisses = packPityCounters[pack.id] ?? 0;
    const packGuaranteedNext = packPityMisses + 1 >= PACK_EPIC_PITY_THRESHOLD;
    const packsUntilEpicPity = Math.max(0, PACK_EPIC_PITY_THRESHOLD - packPityMisses);

    // Compute effective locked state from oblivionUnlock milestone
    const isLocked = pack.divineLightUnlock !== undefined
      ? divineLight < pack.divineLightUnlock
      : pack.locked;

    const usesShards = (pack as typeof pack & { currencyType?: string }).currencyType === 'aberratedShards';
    const currencyLabel = usesShards ? 'Aberrated Shards' : 'Divine Light';

    const tiers = usesShards
      ? [{ tier: 'pack' as const, label: 'Pack', cards: pack.cardsPerOpen, cost: pack.cost, discount: '' }]
      : [
        { tier: 'pack' as const, label: 'Pack',  cards: pack.cardsPerOpen,      cost: featuredPackCost, discount: featuredDiscountLabel },
        { tier: 'box'  as const, label: 'Box',   cards: pack.cardsPerOpen * 5,  cost: boxCost,   discount: '2% off' },
        { tier: 'case' as const, label: 'Case',  cards: pack.cardsPerOpen * 10, cost: caseCost,  discount: '4% off' },
      ];

    const artSrc = PACK_ART[pack.id];
    const displayName = pack.name.replace(/^\[EVENT\]\s*/, '');

    const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary', 'Eternal', 'Infinite'] as const;
    const rarityCounts = rarityOrder.map(rarity => ({ rarity, count: rarityCount(pack.cardPool, rarity) })).filter(entry => entry.count > 0);
    const totalPoolCards = rarityCounts.reduce((total, entry) => total + entry.count, 0);

    return (
      <article
        key={pack.id}
        ref={(element) => { packRefs.current[pack.id] = element; }}
        className={`celestial-store-pack-detail${isLocked ? ' is-locked' : ''}${focusPackId === pack.id ? ' is-focused' : ''}`}
      >
        <header className="celestial-store-pack-banner" style={{
          backgroundImage: artSrc
            ? `linear-gradient(90deg, rgba(8,7,14,0.94), rgba(12,10,20,0.48) 68%, rgba(12,10,20,0.18)), url("${artSrc}")`
            : 'linear-gradient(120deg, rgba(30,22,48,0.95), rgba(9,8,15,0.95))',
        }}>
          <span className={`celestial-store-tag${usesShards ? ' is-event' : ' is-featured'}`}>{usesShards ? 'Event pack' : isDailyDeal ? 'Daily deal' : isSpotlight ? 'Featured' : 'Core set'}</span>
          <h2>{displayName}</h2>
          <p>{pack.description}</p>
        </header>

        <div className="celestial-store-pack-content">
          <section className="celestial-store-distribution" aria-label={`${setName} rarity distribution`}>
            <div className="celestial-store-distribution-bar">
              {rarityCounts.map(({ rarity, count }) => (
                <i key={rarity} title={`${count} ${rarity}`} style={{ flex: count, background: RARITY_COLORS[rarity] ?? '#9aa4b8' }} />
              ))}
            </div>
            <div className="celestial-store-rarity-list">
              {rarityCounts.map(({ rarity, count }) => (
                <span key={rarity} style={{ color: RARITY_COLORS[rarity] ?? '#9aa4b8' }}>{count} {rarity}</span>
              ))}
              <span className="celestial-store-pool-total">{totalPoolCards} unique cards in pool</span>
            </div>
          </section>

          <div className="celestial-store-pity-grid">
            <div className="celestial-store-pity-meter">
              <small><b>Pack Epic pity</b>{packGuaranteedNext ? ' · next pack guaranteed' : ` · ${packsUntilEpicPity} pack${packsUntilEpicPity === 1 ? '' : 's'} until guaranteed`}</small>
              <div><i style={{ width: `${Math.min(100, packPityMisses / PACK_EPIC_PITY_THRESHOLD * 100)}%` }} /></div>
            </div>
            {!usesShards && (
              <div className="celestial-store-pity-meter">
                <small><b>Box Legendary pity</b>{boxGuaranteedNext ? ' · next box guaranteed' : ` · ${boxesUntilPity} box${boxesUntilPity === 1 ? '' : 'es'} until guaranteed`}</small>
                <div><i style={{ width: `${Math.min(100, boxPityMisses / BOX_LEGENDARY_PITY_MISS_THRESHOLD * 100)}%` }} /></div>
              </div>
            )}
          </div>

          {isLocked ? (
            <div className="celestial-store-locked-copy">
              {pack.divineLightUnlock !== undefined ? `${setName} unlocks at ${pack.divineLightUnlock.toLocaleString()} Divine Light.` : 'This pack is not available yet.'}
            </div>
          ) : (
            <div className="celestial-store-offers">
              {tiers.map(({ tier, label, cards, cost, discount }) => {
                const totalCost = cost * quantity;
                const totalCards = cards * quantity;
                const canAfford = usesShards ? shards >= totalCost : divineLight >= totalCost;
                return (
                  <button
                    key={tier}
                    type="button"
                    data-sfx="claim"
                    className="celestial-store-offer"
                    disabled={!canAfford}
                    onClick={canAfford ? () => handleOpen(pack.id, tier) : undefined}
                  >
                    <span className="celestial-store-offer-title">{label}{quantity > 1 ? ` ×${quantity}` : ''}<small>{totalCards} cards</small></span>
                    <strong>{totalCost.toLocaleString()}<small> {currencyLabel}</small></strong>
                    {discount && <em>{discount}</em>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="ui-panel-intro celestial-store-screen" style={styles.overlay}>
      <div style={{ ...styles.header, position: 'relative' }}>
        <div>
          <div style={{ color: 'var(--profile-accent, #61d8ff)', fontFamily: uiTypography.display, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 5 }}>THE CELESTIAL ARCHIVE</div>
          <div className="ui-title-glow" style={styles.title}>Card Store</div>
          <div style={{ color: 'var(--profile-text-muted, rgba(218,225,241,0.74))', fontSize: 11, marginTop: 4 }}>Open sealed collections and trace new card identities.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={styles.score}>Divine Light: {Math.floor(divineLight).toLocaleString()}</div>
          <div style={styles.score}>Aberrated Shards: {shards.toLocaleString()}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <div style={styles.collectionBar}>{uniqueCardsCollected} / {totalRegisteredCards} unique cards</div>
            <button
              onClick={() => setShowCollection(true)}
              style={{
                padding: '4px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                fontFamily: uiTypography.body, letterSpacing: 1,
                background: 'color-mix(in srgb, var(--profile-accent) 10%, transparent)', border: '1px solid var(--profile-border-strong)',
                color: 'var(--profile-accent-soft)',
              }}
            >
              View Collection
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--profile-text-muted)', fontWeight: 700 }}>
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
                    background: active ? 'color-mix(in srgb, var(--profile-accent) 24%, transparent)' : 'color-mix(in srgb, var(--profile-accent) 6%, transparent)',
                    border: `1px solid ${active ? 'var(--profile-border-strong)' : 'var(--profile-border)'}`,
                    color: active ? 'var(--profile-text)' : 'var(--profile-text-muted)',
                    boxShadow: active ? '0 0 12px color-mix(in srgb, var(--profile-accent) 24%, transparent), inset 0 1px 0 color-mix(in srgb, var(--profile-text) 12%, transparent)' : 'none',
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
              ? { color: 'var(--profile-accent-deep)', borderColor: 'var(--profile-border-strong)', background: 'var(--profile-button)' }
              : {}),
          }}
          onClick={() => setActiveTab('packs')}
        >
          Packs
        </button>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'history'
              ? { color: 'var(--profile-accent-deep)', borderColor: 'var(--profile-border-strong)', background: 'var(--profile-button)' }
              : {}),
          }}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          style={{
            ...styles.tabBtn,
            padding: '10px 22px',
            fontSize: 13,
            fontWeight: 800,
            boxShadow: '0 0 22px rgba(255,255,255,0.18)',
            ...(activeTab === 'abilities'
              ? { color: 'var(--profile-accent-deep)', borderColor: 'var(--profile-border-strong)', background: 'var(--profile-button)' }
              : {}),
          }}
          onClick={() => setActiveTab('abilities')}
        >
          Abilities
        </button>
      </div>

      {activeTab === 'packs' ? (
        <div className="celestial-store-body">
          <aside className="celestial-store-set-rail" aria-label="Pack sets">
            <div className="celestial-store-rail-heading">Core sets</div>
            {PACK_DEFINITIONS.filter(pack => !pack.currencyType).map(pack => {
              const isSelected = pack.id === selectedPack?.id;
              return (
                <button key={pack.id} type="button" className={`celestial-store-set-button${isSelected ? ' is-selected' : ''}`} aria-pressed={isSelected} onClick={() => setSelectedPackId(pack.id)}>
                  <span className="celestial-store-set-art" style={{ backgroundImage: `url("${PACK_ART[pack.id] ?? ''}")` }} />
                  <span><strong>{pack.setId}</strong><small>{pack.id === getSpotlightPackId() || pack.id === getDailyDealPackId() ? 'Featured' : 'Core set'}</small></span>
                </button>
              );
            })}
            {PACK_DEFINITIONS.some(pack => pack.currencyType === 'aberratedShards') && (
              <>
                <div className="celestial-store-rail-heading is-event">Event packs</div>
                {PACK_DEFINITIONS.filter(pack => pack.currencyType === 'aberratedShards').map(pack => {
                  const isSelected = pack.id === selectedPack?.id;
                  return (
                    <button key={pack.id} type="button" className={`celestial-store-set-button${isSelected ? ' is-selected' : ''}`} aria-pressed={isSelected} onClick={() => setSelectedPackId(pack.id)}>
                      <span className="celestial-store-set-art" style={{ backgroundImage: `url("${PACK_ART[pack.id] ?? ''}")` }} />
                      <span><strong>{pack.setId}</strong><small>Event pack</small></span>
                    </button>
                  );
                })}
              </>
            )}
          </aside>

          <section className="celestial-store-stage" aria-label={selectedPack ? `${selectedPack.name} details` : 'Pack details'}>
            {selectedPack ? renderPackCard(selectedPack) : <div style={styles.empty}>No packs are available.</div>}
          </section>

          <aside className="celestial-store-guide" aria-label="Pack opening rules">
            <div className="celestial-store-guide-title">Opening rules</div>
            <div className="celestial-store-guide-item"><strong>Pack</strong><span>5 cards</span></div>
            <div className="celestial-store-guide-item"><strong>Box</strong><span>25 cards · 5 packs · 2% discount</span></div>
            <div className="celestial-store-guide-item"><strong>Case</strong><span>50 cards · 10 packs · 4% discount</span></div>
            <div className="celestial-store-guide-item"><strong>Holofoil</strong><span>2% per card; every Box and Case guarantees at least one.</span></div>
            <div className="celestial-store-guide-item"><strong>Epic pity</strong><span>10 single Packs without an Epic+ guarantees the next.</span></div>
            <div className="celestial-store-guide-item"><strong>Legendary pity</strong><span>After 4 consecutive Boxes without a Legendary, the next Box guarantees one.</span></div>
            <div className="celestial-store-collection-progress">
              <span>Collection</span>
              <strong>{uniqueCardsCollected} / {totalRegisteredCards}</strong>
              <div><i style={{ width: `${totalRegisteredCards ? Math.min(100, uniqueCardsCollected / totalRegisteredCards * 100) : 0}%` }} /></div>
            </div>
          </aside>
        </div>
      ) : activeTab === 'history' ? (
        <PackHistoryPanel />
      ) : (
        <AbilityMaterialization />
      )}

      <div style={styles.footer}>
        <button style={styles.closeBtn} onClick={onClose}>Close</button>
      </div>

      {openingResult && (
        <PackOpeningModal
          cards={openingResult.cards}
          packName={openingResult.packName}
          newCards={openingResult.newCards}
          holoIndices={openingResult.holoIndices}
          onClose={() => setOpeningResult(null)}
        />
      )}

      {showCollection && <CollectionViewer onClose={() => setShowCollection(false)} />}

      {bulkResult && (
        <BulkHolofoilResult
          packName={bulkResult.packName}
          totalCards={bulkResult.totalCards}
          holoCards={bulkResult.holoCards}
          onClose={() => setBulkResult(null)}
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

  const totalCardsByRarity: Record<string, number> = {};
  for (const entry of history) {
    for (const [r, n] of Object.entries(entry.rarityCounts)) {
      totalCardsByRarity[r] = (totalCardsByRarity[r] ?? 0) + n;
    }
  }
  const totalRecordedCards = Object.values(totalCardsByRarity).reduce((total, count) => total + count, 0);
  const packStreaks = PACK_DEFINITIONS.map(pack => ({
    pack,
    epicMisses: packPityCounters[pack.id] ?? 0,
    boxMisses: boxPityCounters[pack.id] ?? 0,
  }));
  const formatTs = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="pack-history-view">
      <div className="pack-history-content">
        <div className="pack-history-summary-grid">
          <section className="pack-history-panel pack-history-streak-panel" aria-labelledby="pack-history-streak-title">
            <h2 className="pack-history-panel-title" id="pack-history-streak-title">Pity Progress</h2>
            <div className="pack-history-streak-grid">
              {packStreaks.map(({ pack, epicMisses, boxMisses }) => (
                <div className="pack-history-streak-set" key={pack.id}>
                  <h3>{pack.setId}</h3>
                  <div className="pack-history-pity-metric is-epic">
                    <div><span>Epic+ · single packs</span><strong>{epicMisses}/{PACK_EPIC_PITY_THRESHOLD}</strong></div>
                    <div className="pack-history-meter" role="progressbar" aria-label={`${pack.setId} Epic pity`} aria-valuemin={0} aria-valuemax={PACK_EPIC_PITY_THRESHOLD} aria-valuenow={Math.min(PACK_EPIC_PITY_THRESHOLD, epicMisses)}>
                      <i style={{ width: `${Math.min(100, epicMisses / PACK_EPIC_PITY_THRESHOLD * 100)}%` }} />
                    </div>
                    <small>{epicMisses + 1 >= PACK_EPIC_PITY_THRESHOLD ? 'Next single pack guaranteed' : `${PACK_EPIC_PITY_THRESHOLD - epicMisses} single pack${PACK_EPIC_PITY_THRESHOLD - epicMisses === 1 ? '' : 's'} until guarantee`}</small>
                  </div>
                  {pack.currencyType !== 'aberratedShards' && (
                    <div className="pack-history-pity-metric is-legendary">
                      <div><span>Legendary · boxes</span><strong>{boxMisses}/{BOX_LEGENDARY_PITY_MISS_THRESHOLD}</strong></div>
                      <div className="pack-history-meter" role="progressbar" aria-label={`${pack.setId} Legendary pity`} aria-valuemin={0} aria-valuemax={BOX_LEGENDARY_PITY_MISS_THRESHOLD} aria-valuenow={Math.min(BOX_LEGENDARY_PITY_MISS_THRESHOLD, boxMisses)}>
                        <i style={{ width: `${Math.min(100, boxMisses / BOX_LEGENDARY_PITY_MISS_THRESHOLD * 100)}%` }} />
                      </div>
                      <small>{boxMisses >= BOX_LEGENDARY_PITY_MISS_THRESHOLD ? 'Next box guaranteed' : `${BOX_LEGENDARY_PITY_MISS_THRESHOLD - boxMisses} failed box${BOX_LEGENDARY_PITY_MISS_THRESHOLD - boxMisses === 1 ? '' : 'es'} until guarantee`}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="pack-history-panel pack-history-total-panel" aria-labelledby="pack-history-totals-title">
            <h2 className="pack-history-panel-title" id="pack-history-totals-title">
              Last {history.length} Opens · Totals
            </h2>
            {totalRecordedCards > 0 ? (
              <div className="pack-history-total-grid">
                {RARITY_DISPLAY_ORDER.map(rarity => {
                  const count = totalCardsByRarity[rarity] ?? 0;
                  if (count === 0) return null;
                  return (
                    <div className="pack-history-total" key={rarity} style={{ '--history-rarity': RARITY_COLORS[rarity] ?? '#9aa4b8' } as React.CSSProperties}>
                      <strong>{count.toLocaleString()}</strong>
                      <span>{rarity}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pack-history-empty">Open packs to build your rarity totals.</div>
            )}
          </section>
        </div>

        <section className="pack-history-panel pack-history-log-panel" aria-labelledby="pack-history-log-title">
          <h2 className="pack-history-panel-title" id="pack-history-log-title">Open History ({history.length})</h2>
          {history.length === 0 ? (
            <div className="pack-history-empty">No pack opens recorded yet.</div>
          ) : (
            <div className="pack-history-log">
              {history.map((entry, idx) => {
                const pack = PACK_DEFINITIONS.find(definition => definition.id === entry.packId);
                const tierLabel = entry.tier === 'pack' ? 'Pack' : entry.tier === 'box' ? 'Box' : 'Case';
                return (
                  <article className="pack-history-row" key={`${entry.ts}-${entry.packId}-${entry.tier}-${idx}`}>
                    <div className="pack-history-row-main">
                      <strong>{pack?.name ?? entry.packId} · {tierLabel}</strong>
                      <time dateTime={new Date(entry.ts).toISOString()}>{formatTs(entry.ts)}</time>
                    </div>
                    <div className="pack-history-rarities" aria-label="Cards by rarity">
                      {RARITY_DISPLAY_ORDER.map(rarity => {
                        const count = entry.rarityCounts[rarity] ?? 0;
                        if (count === 0) return null;
                        return (
                          <span key={rarity} style={{ '--history-rarity': RARITY_COLORS[rarity] ?? '#9aa4b8' } as React.CSSProperties}>
                            <b>{count}×</b> {rarity}
                          </span>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
