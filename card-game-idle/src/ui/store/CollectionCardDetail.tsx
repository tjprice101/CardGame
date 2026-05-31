import { useEffect, useState } from 'react';
import { useStore } from '@/state/store';
import { ELEMENT_SET_NAMES, ELEMENT_COLORS } from '@/data/elements';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { getCardFaceBackgroundStyle, getCardBackBackgroundStyle, getCardArtTopBottomBorderOverlayStyleForCard } from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardFinishLabel, isHoloOnlyCard } from '@/systems/progression/HolofoilSystem';
import { getActionClassLabel, getCardActionClass } from '@/systems/cards/ActionClass';
import { warmTheme } from '@/ui/theme';
import CardEngineCallout from '@/ui/components/CardEngineCallout';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import type { CardType, AngelDefinition, SeraphimDefinition } from '@/types/cards';

interface Props {
  card: ReturnType<(typeof import('@/cards/CardRegistry'))['CardRegistry']['getAll']>[number];
  finish: 'normal' | 'holo';
  owned: number;
  onClose: () => void;
  /** Optional CTA rendered above the favorite button — e.g. "Summon Angel". */
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

const RARITY_COLORS: Record<string, string> = {
  Common: '#888', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12', Eternal: '#ff6b6b', Infinite: '#e8e8f0',
};

const TYPE_DESCRIPTIONS: Record<CardType, string> = {
  Ophanim: 'Direct Attack Actions: none. Uses play effects only.',
  Cherubim: 'Direct Attack Actions: none. Uses passive and on-play effects only.',
  Seraphim: 'Direct Attack Actions: 2 (Unsynergized, Synergized).',
  Angel: 'Direct Attack Actions: 2 (Primary, Exalted).',
};

function formatAttackCosts(costs: ReadonlyArray<{ type: string; value: number }> | undefined): string {
  if (!costs || costs.length === 0) return 'No additional cost';
  return costs
    .map(cost => `${cost.type.replace(/_/g, ' ')} ${cost.value}`)
    .join(', ');
}

function renderCombatOverview(card: Props['card']) {
  if (card.type === 'Seraphim') {
    const attacks = (card as SeraphimDefinition).attacks;
    if (!attacks) return 'Direct Attack Actions: none (attack set not defined).';
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ padding: '8px 10px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: 11, color: '#f0bd78', textTransform: 'uppercase', letterSpacing: 0.8 }}>Unsynergized · {attacks.unsynergized.name}</div>
          <div style={{ fontSize: 11, color: '#cfd8e6', marginTop: 6 }}>
            Oblivion {attacks.unsynergized.baseOblivion} · Cooldown {attacks.unsynergized.cooldownCards} cards
          </div>
          <div style={{ fontSize: 11, color: '#cfd8e6', marginTop: 4 }}>
            Cost: {formatAttackCosts(attacks.unsynergized.costs)}
          </div>
        </div>
        <div style={{ padding: '8px 10px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: 11, color: '#f0bd78', textTransform: 'uppercase', letterSpacing: 0.8 }}>Synergized · {attacks.synergized.name}</div>
          <div style={{ fontSize: 11, color: '#cfd8e6', marginTop: 6 }}>
            Oblivion {attacks.synergized.baseOblivion} · Cooldown {attacks.synergized.cooldownCards} cards
          </div>
          <div style={{ fontSize: 11, color: '#cfd8e6', marginTop: 4 }}>
            Requires Angel: {attacks.synergized.requiresAngelOnBoard ? 'Yes' : 'No'} · Cost: {formatAttackCosts(attacks.synergized.costs)}
          </div>
          {card.element === 'Fire' && (
            <div style={{ fontSize: 11, color: '#cfd8e6', marginTop: 4 }}>
              Fire attacks: +2.5% per Heat (max +75%) and spend up to 5 Heat for +1% per Heat spent (max +5%).
            </div>
          )}
        </div>
      </div>
    );
  }

  if (card.type === 'Angel') {
    const attacks = (card as AngelDefinition).attacks;
    if (!attacks) return 'Direct Attack Actions: none (attack set not defined).';
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ padding: '8px 10px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: 11, color: '#f0bd78', textTransform: 'uppercase', letterSpacing: 0.8 }}>Primary · {attacks.primary.name}</div>
          <div style={{ fontSize: 11, color: '#cfd8e6', marginTop: 6 }}>
            Oblivion {attacks.primary.baseOblivion} · Cooldown {attacks.primary.cooldownCards} cards
          </div>
        </div>
        <div style={{ padding: '8px 10px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: 11, color: '#f0bd78', textTransform: 'uppercase', letterSpacing: 0.8 }}>Exalted · {attacks.exalted.name}</div>
          <div style={{ fontSize: 11, color: '#cfd8e6', marginTop: 6 }}>
            Oblivion {attacks.exalted.baseOblivion} · Cooldown {attacks.exalted.cooldownCards} cards
          </div>
          <div style={{ fontSize: 11, color: '#cfd8e6', marginTop: 4 }}>
            Cost: {formatAttackCosts(attacks.exalted.costs)}
          </div>
          {card.element === 'Fire' && (
            <div style={{ fontSize: 11, color: '#cfd8e6', marginTop: 4 }}>
              Fire attacks: +2.5% per Heat (max +75%) and spend up to 5 Heat for +1% per Heat spent (max +5%).
            </div>
          )}
        </div>
      </div>
    );
  }

  return TYPE_DESCRIPTIONS[card.type];
}

function findPacksForCard(cardId: string): Array<{ packId: string; packName: string; element: string }> {
  const packs: Array<{ packId: string; packName: string; element: string }> = [];
  for (const pack of PACK_DEFINITIONS) {
    if (pack.cardPool.includes(cardId)) {
      packs.push({ packId: pack.id, packName: pack.name, element: pack.element ?? 'Neutrality' });
    }
  }
  return packs;
}

export default function CollectionCardDetail({ card, finish, owned, onClose, actionLabel, onAction, actionDisabled }: Props) {
  const favoriteCollection = useStore(s => s.progress.favoriteCollection);
  const toggleFavoriteCard = useStore(s => s.toggleFavoriteCard);
  const [favoriteFeedback, setFavoriteFeedback] = useState<string | null>(null);

  const isFavorite = favoriteCollection[`${card.definitionId}:${finish}`] ?? false;
  const packs = findPacksForCard(card.definitionId);
  const elementColor = ELEMENT_COLORS[card.element] ?? '#aaa';
  const rarityColor = RARITY_COLORS[card.rarity] ?? '#888';
  const actionClassLabel = getActionClassLabel(getCardActionClass(card));
  const finishLabel = isHoloOnlyCard(card) ? 'Intrinsic Foil' : getCardFinishLabel(finish);

  useEffect(() => {
    if (!favoriteFeedback) return;
    const timeoutId = window.setTimeout(() => setFavoriteFeedback(null), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [favoriteFeedback]);

  const handleFavoriteToggle = () => {
    const wasFavorite = isFavorite;
    toggleFavoriteCard(card.definitionId, finish);
    setFavoriteFeedback(wasFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      {/* Detail card container */}
      <div
        style={{
          background: 'radial-gradient(circle at 18% 10%, rgba(236, 192, 128, 0.14) 0%, rgba(236, 192, 128, 0) 38%), linear-gradient(180deg, #0c0f15 0%, #10151e 100%)',
          border: `1px solid ${warmTheme.border}`,
          borderRadius: 16,
          display: 'flex',
          width: '90%',
          maxWidth: 1000,
          height: '85vh',
          maxHeight: 700,
          overflow: 'hidden',
          pointerEvents: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left: Large card art */}
        <div
          style={{
            flex: '0 0 320px',
            borderRight: `1px solid ${warmTheme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: warmTheme.surface,
            padding: '20px 16px',
          }}
        >
          <div
            className={finish === 'holo' || card.rarity === 'Infinite' || card.rarity === 'Eternal'
              ? `holofoil-menu-card${card.rarity === 'Infinite' ? ' infinite-holo-bw-hover' : ''}${card.rarity === 'Eternal' ? ' eternal-holo-red-hover' : ''}`
              : undefined}
            style={{
              width: '100%',
              aspectRatio: '148 / 204',
              ...(owned > 0 ? getCardFaceBackgroundStyle(card, finish) : getCardBackBackgroundStyle(card, { dimmed: false })),
              backgroundColor: warmTheme.surfaceStrong,
              borderRadius: 14,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={getCardArtTopBottomBorderOverlayStyleForCard(card)} />
          </div>
        </div>

        {/* Right: Info panel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '32px 28px',
            overflowY: 'auto',
            color: '#ead9c0',
            fontFamily: 'Georgia, serif',
            gap: 16,
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              borderRadius: 999,
              background: 'rgba(255, 237, 213, 0.1)',
              border: `1px solid ${warmTheme.border}`,
              color: '#ead9c0',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              zIndex: 10,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 237, 213, 0.2)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 8px rgba(255, 237, 213, 0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 237, 213, 0.1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            X
          </button>

          {/* Card name */}
          <div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#f0bd78', letterSpacing: 2, lineHeight: 1.2 }}>
              {card.name}
            </div>
          </div>

          {/* Type & Element */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              paddingBottom: 12,
              borderBottom: `1px solid ${warmTheme.border}`,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Card Type
              </div>
              <div style={{ fontSize: 14, color: '#ead9c0', fontWeight: 500 }}>
                {getDisplayCardTypeLabel(card.type)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Element
              </div>
              <div style={{ fontSize: 14, color: elementColor, fontWeight: 500 }}>
                {ELEMENT_SET_NAMES[card.element] ?? card.element}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Finish
              </div>
              <div style={{ fontSize: 14, color: '#ead9c0', fontWeight: 500 }}>
                {finishLabel}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Action Class
              </div>
              <div style={{ fontSize: 14, color: '#ead9c0', fontWeight: 500 }}>
                {actionClassLabel}
              </div>
            </div>
          </div>

          {/* Rarity & Owned */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              paddingBottom: 12,
              borderBottom: `1px solid ${warmTheme.border}`,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Rarity
              </div>
              <div style={{ fontSize: 14, color: rarityColor, fontWeight: 'bold', textTransform: 'uppercase' }}>
                {card.rarity}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Owned
              </div>
              <div style={{ fontSize: 14, color: owned > 0 ? '#a8d86d' : '#888', fontWeight: 500 }}>
                {owned > 0 ? `x${owned}` : 'Not owned'}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Engine Role
            </div>
            <CardEngineCallout card={card} variant="detail" />
          </div>

          {/* Type explanation */}
          <div>
            <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {getDisplayCardTypeLabel(card.type)} Ability
            </div>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.5,
                color: 'rgba(234, 217, 192, 0.9)',
              }}
            >
              {renderCombatOverview(card)}
            </div>
          </div>

          {/* Full stats and abilities */}
          <div>
            <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Card Rules
            </div>
            {owned > 0 ? (
              <CardRulesDigest
                card={card}
                variant="detail"
                labelColor="rgba(234, 217, 192, 0.52)"
                textColor="rgba(234, 217, 192, 0.92)"
                sectionBackground="rgba(255,255,255,0.03)"
                sectionBorder="rgba(255,255,255,0.12)"
              />
            ) : (
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: 'rgba(234, 217, 192, 0.92)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                Card not owned
              </div>
            )}
          </div>

          {/* How to obtain */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: 12,
              borderTop: `1px solid ${warmTheme.border}`,
            }}
          >
            <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              How to Obtain
            </div>
            {packs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {packs.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      // Close the detail + collection viewer, then signal the store to focus this pack.
                      onClose();
                      window.setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('focusPackInStore', { detail: { packId: p.packId } }));
                      }, 50);
                    }}
                    style={{
                      fontSize: 12,
                      color: '#ffd86b',
                      padding: '6px 10px',
                      background: 'rgba(212, 175, 143, 0.12)',
                      borderRadius: 4,
                      border: '1px solid rgba(212, 175, 143, 0.4)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'Georgia, serif',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    title="Jump to this pack in the store"
                  >
                    <span>{p.packName}</span>
                    <span style={{ fontSize: 10, color: '#caa57a' }}>→ Store</span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>
                (Obtained through other means)
              </div>
            )}
          </div>

          {/* Action CTA (e.g. Summon Angel) — only shown when caller provides it */}
          {actionLabel && onAction && (
            <button
              onClick={() => { onAction(); onClose(); }}
              disabled={actionDisabled}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                marginBottom: 10,
                background: actionDisabled
                  ? 'rgba(244,244,248,0.05)'
                  : 'linear-gradient(180deg, rgba(50,50,80,0.98) 0%, rgba(18,18,32,0.98) 100%)',
                border: actionDisabled
                  ? '1px solid rgba(244,244,248,0.15)'
                  : '1px solid rgba(200,180,255,0.6)',
                color: actionDisabled ? 'rgba(244,244,248,0.3)' : 'rgba(244,244,248,0.98)',
                fontSize: 13,
                fontFamily: 'Georgia, serif',
                cursor: actionDisabled ? 'not-allowed' : 'pointer',
                letterSpacing: 2.5,
                textTransform: 'uppercase',
                boxShadow: actionDisabled
                  ? 'none'
                  : '0 0 22px rgba(180,160,255,0.28), 0 4px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
            >
              {actionLabel}
            </button>
          )}

          {/* Favorite button */}
          {owned > 0 && (
            <button
              onClick={handleFavoriteToggle}
              style={{
                width: '100%',
                padding: '10px 12px',
                marginTop: 12,
                borderRadius: 6,
                border: isFavorite
                  ? '1px solid rgba(255, 215, 100, 0.9)'
                  : '1px solid rgba(255, 238, 212, 0.5)',
                background: isFavorite
                  ? 'rgba(120, 84, 36, 0.6)'
                  : 'rgba(42, 27, 14, 0.5)',
                color: isFavorite ? '#ffd86b' : 'rgba(255, 241, 220, 0.8)',
                fontSize: 12,
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontWeight: isFavorite ? 'bold' : 'normal',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = isFavorite
                  ? 'rgba(120, 84, 36, 0.8)'
                  : 'rgba(42, 27, 14, 0.7)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = isFavorite
                  ? '0 0 12px rgba(255, 215, 100, 0.4)'
                  : 'none';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = isFavorite
                  ? 'rgba(120, 84, 36, 0.6)'
                  : 'rgba(42, 27, 14, 0.5)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              <span>{isFavorite ? '*' : '+'}</span>
              <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
            </button>
          )}

          {owned > 0 && favoriteFeedback && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: favoriteFeedback.includes('Added') ? '#a8d86d' : '#f0bd78',
                textAlign: 'center',
                letterSpacing: 0.4,
              }}
            >
              {favoriteFeedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
