import { useState } from 'react';
import { useStore } from '@/state/store';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { ELEMENT_COLORS, ELEMENT_SET_NAMES } from '@/data/elements';
import { CardRegistry } from '@/cards/CardRegistry';
import { warmTheme } from '@/ui/theme';
import PackOpeningModal from './PackOpeningModal';
import CollectionViewer from './CollectionViewer';
import HolofoilWorkshop from './HolofoilWorkshop';

const RARITY_COLORS: Record<string, string> = {
  Common: '#999', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12',
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 16% 8%, rgba(248, 203, 140, 0.16) 0%, rgba(248, 203, 140, 0) 34%), radial-gradient(circle at 84% 90%, rgba(110, 76, 38, 0.35) 0%, rgba(110, 76, 38, 0) 42%), repeating-linear-gradient(135deg, rgba(241, 191, 122, 0.06) 0px, rgba(241, 191, 122, 0.06) 2px, rgba(0, 0, 0, 0) 2px, rgba(0, 0, 0, 0) 22px), linear-gradient(180deg, rgba(24, 18, 13, 0.97) 0%, rgba(37, 27, 19, 0.97) 100%)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'auto',
    fontFamily: 'Georgia, serif',
    color: '#ead9c0',
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
  title: { fontSize: 20, fontWeight: 'bold', color: '#f0bd78', letterSpacing: 2 },
  score: { fontSize: 13, color: 'rgba(234, 217, 192, 0.82)' },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
    alignContent: 'flex-start',
    justifyContent: 'center',
  },
  packCard: {
    width: 280,
    background: 'linear-gradient(180deg, rgba(28, 22, 17, 0.94) 0%, rgba(37, 29, 22, 0.94) 100%)',
    border: '1px solid rgba(218, 167, 109, 0.34)',
    borderRadius: 16,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: warmTheme.shadow,
  },
  packLocked: {
    opacity: 0.5,
    filter: 'grayscale(0.6)',
  },
  packName: { fontSize: 16, fontWeight: 'bold', color: '#f1c486' },
  packDesc: { fontSize: 12, color: 'rgba(235, 220, 197, 0.84)', lineHeight: 1.5 },
  packCost: { fontSize: 13, color: '#f1c486' },
  openBtn: {
    padding: '8px 16px',
    borderRadius: 10,
    border: `1px solid ${warmTheme.borderStrong}`,
    background: warmTheme.button,
    color: warmTheme.accentDeep,
    fontSize: 12,
    fontFamily: 'Georgia, serif',
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
    padding: '2px 6px',
    borderRadius: 3,
    background: 'rgba(255, 241, 221, 0.9)',
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
    border: `1px solid ${warmTheme.border}`,
    background: 'rgba(255, 236, 209, 0.88)',
    color: '#61401d',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: '8px 20px',
    borderRadius: 10,
    border: `1px solid ${warmTheme.border}`,
    background: 'rgba(255, 237, 213, 0.94)',
    color: '#5f3a17',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
  },
  collectionBar: {
    fontSize: 11,
    color: 'rgba(234, 217, 192, 0.8)',
  },
};

interface Props { onClose: () => void }

export default function CardPackStore({ onClose }: Props) {
  const score = useStore(s => s.progress.oblivion);
  const shards = useStore(s => s.progress.aberratedShards);
  const collection = useStore(s => s.progress.collection);
  const [openingResult, setOpeningResult] = useState<{ cards: string[]; packName: string; newCards: Set<string> } | null>(null);
  const [showCollection, setShowCollection] = useState(false);
  const [activeTab, setActiveTab] = useState<'packs' | 'holofoils'>('packs');

  const handleOpen = (packId: string, tier: 'pack' | 'box' | 'case') => {
    const preOpenCollection = new Set(Object.keys(useStore.getState().progress.collection));
    const state = useStore.getState();
    const result = tier === 'pack' ? state.openPack(packId)
      : tier === 'box' ? state.openBox(packId)
      : state.openCase(packId);
    if (result) {
      const pack = PACK_DEFINITIONS.find(p => p.id === packId);
      const tierLabel = tier === 'pack' ? 'Pack' : tier === 'box' ? 'Box' : 'Case';
      const newCards = new Set(result.filter(id => !preOpenCollection.has(id)));
      setOpeningResult({ cards: result, packName: `${pack?.name ?? 'Pack'} ${tierLabel}`, newCards });
    }
  };

  const rarityCount = (poolIds: string[], rarity: string) =>
    poolIds.filter(id => CardRegistry.get(id)?.rarity === rarity).length;

  return (
    <div style={styles.overlay}>
      <div style={styles.header}>
        <div style={styles.title}>Card Store</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={styles.score}>Oblivion: {Math.floor(score).toLocaleString()}</div>
          <div style={styles.score}>Aberrated Shards: {shards.toLocaleString()}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <div style={styles.collectionBar}>{Object.keys(collection).length} unique cards collected</div>
            <button
              onClick={() => setShowCollection(true)}
              style={{
                padding: '4px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                fontFamily: 'Georgia, serif', letterSpacing: 1,
                background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.35)',
                color: 'rgba(255,215,0,0.8)',
              }}
            >
              View Collection
            </button>
          </div>
        </div>
      </div>

      <div style={styles.tabBar}>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'packs'
              ? { color: warmTheme.accentDeep, borderColor: warmTheme.borderStrong, background: 'rgba(255,215,0,0.08)' }
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
              ? { color: warmTheme.accentDeep, borderColor: warmTheme.borderStrong, background: 'rgba(255,215,0,0.08)' }
              : {}),
          }}
          onClick={() => setActiveTab('holofoils')}
        >
          Holofoils
        </button>
      </div>

      {activeTab === 'packs' ? (
        <div style={styles.body}>
          {PACK_DEFINITIONS.map(pack => {
          const elementColor = ELEMENT_COLORS[pack.element] ?? '#aaa';
          const setName = ELEMENT_SET_NAMES[pack.element] ?? pack.element;
          const boxCost = Math.round(pack.cost * 5 * 0.98);
          const caseCost = Math.round(boxCost * 2 * 0.96);

          // Compute effective locked state from oblivionUnlock milestone
          const isLocked = pack.oblivionUnlock !== undefined
            ? score < pack.oblivionUnlock
            : pack.locked;

          const tiers = [
            { tier: 'pack' as const, label: 'Pack',  cards: pack.cardsPerOpen,      cost: pack.cost, discount: '' },
            { tier: 'box'  as const, label: 'Box',   cards: pack.cardsPerOpen * 5,  cost: boxCost,   discount: '2% off' },
            { tier: 'case' as const, label: 'Case',  cards: pack.cardsPerOpen * 10, cost: caseCost,  discount: '4% off' },
          ];

          return (
            <div
              key={pack.id}
              style={{ ...styles.packCard, ...(isLocked ? styles.packLocked : {}) }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: elementColor, flexShrink: 0,
                  boxShadow: `0 0 8px ${elementColor}`,
                }} />
                <div style={styles.packName}>{pack.name}</div>
              </div>

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
                        🔒 {setName} — Earn {pack.oblivionUnlock.toLocaleString()} Oblivion to unlock
                      </div>
                      {score < pack.oblivionUnlock && (
                        <div style={{ fontSize: 11, color: 'rgba(255,180,80,0.6)' }}>
                          {(pack.oblivionUnlock - Math.floor(score)).toLocaleString()} more needed
                        </div>
                      )}
                    </>
                  ) : '🔒 Coming Soon'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tiers.map(({ tier, label, cards, cost, discount }) => {
                    const canAfford = score >= cost;
                    const deficit = cost - Math.floor(score);
                    return (
                      <button
                        key={tier}
                        style={{ ...styles.openBtn, ...(canAfford ? {} : styles.openBtnDisabled) }}
                        onClick={canAfford ? () => handleOpen(pack.id, tier) : undefined}
                      >
                        <span style={{ fontWeight: 'bold' }}>{label}</span>
                        <span style={{ color: 'rgba(255,215,0,0.7)', marginLeft: 6 }}>({cards} cards)</span>
                        <span style={{ float: 'right', fontSize: 11 }}>
                          {cost.toLocaleString()} score
                          {discount && <span style={{ color: 'rgba(100,220,100,0.8)', marginLeft: 5 }}>{discount}</span>}
                        </span>
                        {!canAfford && (
                          <div style={{ fontSize: 10, color: '#e86060', marginTop: 2 }}>
                            Need {deficit.toLocaleString()} more
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        </div>
      ) : (
        <HolofoilWorkshop />
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
    </div>
  );
}
