import { useEffect, useState } from 'react';
import { useStore } from '@/state/store';
import { getCardSetColor, getCardSetLabel } from '@/data/elements';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { getLiveCardFaceBackgroundStyle, getLiveCardShimmerClassName, getCardBackBackgroundStyle } from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardFinishKey, getCardFinishLabel, isHoloOnlyCard } from '@/systems/progression/HolofoilSystem';
import { getReadableUiColor, warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import './CollectionViewer.css';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import type { CardDefinition } from '@/types/cards';
import type { LegacyCosmeticCard } from '@/data/cards/eternalCards';

interface Props {
  card: CardDefinition | LegacyCosmeticCard;
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

function findPacksForCard(cardId: string): Array<{ packId: string; packName: string; setId: string }> {
  const packs: Array<{ packId: string; packName: string; setId: string }> = [];
  for (const pack of PACK_DEFINITIONS) {
    if (pack.cardPool.includes(cardId)) {
      packs.push({ packId: pack.id, packName: pack.name, setId: pack.setId ?? 'Neutrality' });
    }
  }
  return packs;
}

export default function CollectionCardDetail({ card, finish, owned, onClose, actionLabel, onAction, actionDisabled }: Props) {
  useThemeVersion();
  const lightBg = useStore(s => s.settings.buttonColorMode === 'light');
  const favoriteCollection = useStore(s => s.progress.favoriteCollection);
  const toggleFavoriteCard = useStore(s => s.toggleFavoriteCard);
  const [favoriteFeedback, setFavoriteFeedback] = useState<string | null>(null);

  const isLegacyInfinite = !('type' in card);
  const displayCard = isLegacyInfinite
    ? { ...card, type: 'Light' } as unknown as CardDefinition
    : card;
  const isFavorite = favoriteCollection[getCardFinishKey(card.definitionId, finish)] ?? false;
  const isRevealed = owned > 0;
  const packs = findPacksForCard(card.definitionId);
  const elementColor = getReadableUiColor(getCardSetColor(card.definitionId), warmTheme.surfaceStrong);
  const rarityColor = getReadableUiColor(RARITY_COLORS[card.rarity] ?? '#888', warmTheme.surfaceStrong);
  const finishLabel = isLegacyInfinite || isHoloOnlyCard(card) ? 'Intrinsic Foil' : getCardFinishLabel(finish);
  const flavorObtain = card.rarity === 'Infinite'
    ? 'Crafted through Infinitude recipes.'
    : card.rarity === 'Eternal'
      ? "Awarded for defeating mighty foes. (Eternity's Wake)"
      : card.rarity === 'Transcendent'
        ? 'Beat every event boss, then acquire it in the Forge of Transcendence with Shards of Transcendence.'
        : card.rarity === 'Enigmatic'
          ? 'Earned by completing Enigmas.'
          : null;

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
      className="collection-detail"
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name} collection details`}
      style={{
        position: 'absolute',
        inset: 0,
        background: warmTheme.backdrop,
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
        className="collection-detail-panel"
        style={{
          border: `1px solid ${warmTheme.border}`,
          borderRadius: 16,
          display: 'flex',
          width: '90%',
          maxWidth: 1000,
          height: '85vh',
          maxHeight: 700,
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left: Large card art */}
        <div
          className="collection-detail-art"
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
            className={isRevealed ? getLiveCardShimmerClassName(displayCard, finish, 'front') : undefined}
            style={{
              width: '100%',
              aspectRatio: '148 / 204',
              ...(isRevealed ? getLiveCardFaceBackgroundStyle(displayCard, finish, 'front') : getCardBackBackgroundStyle(displayCard, { dimmed: false })),
              backgroundColor: warmTheme.surfaceStrong,
              borderRadius: 14,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
          </div>
        </div>

        {/* Right: Info panel */}
        <div
          className="collection-detail-info"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '32px 28px',
            overflowY: 'auto',
            color: 'var(--profile-text)',
            fontFamily: 'Georgia, serif',
            gap: 16,
          }}
        >
          {/* Close button */}
          <button
            aria-label="Close card details"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              borderRadius: 999,
              background: 'var(--profile-surface-muted)',
              border: `1px solid ${warmTheme.border}`,
              color: 'var(--profile-text)',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              zIndex: 10,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--profile-surface)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--profile-surface-muted)';
            }}
          >
            X
          </button>

          {/* Card name */}
          <div>
            <div className="ui-title-glow collection-detail-title" style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: 2, lineHeight: 1.2 }}>
              {card.name}
            </div>
          </div>

          {/* Type & Element */}
          <div
            className="collection-detail-fields"
            style={{
              display: 'flex',
              gap: 16,
              paddingBottom: 12,
              borderBottom: `1px solid ${warmTheme.border}`,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: 'var(--profile-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Card Type
              </div>
              <div style={{ fontSize: 14, color: 'var(--profile-text)', fontWeight: 500 }}>
                {isLegacyInfinite ? 'Archived Infinite' : getDisplayCardTypeLabel(card.type)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--profile-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Element
              </div>
              <div style={{ fontSize: 14, color: elementColor, fontWeight: 500 }}>
                {getCardSetLabel(card.definitionId)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--profile-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Finish
              </div>
              <div style={{ fontSize: 14, color: 'var(--profile-text)', fontWeight: 500 }}>
                {finishLabel}
              </div>
            </div>
          </div>

          {/* Rarity & Owned */}
          <div
            className="collection-detail-fields"
            style={{
              display: 'flex',
              gap: 16,
              paddingBottom: 12,
              borderBottom: `1px solid ${warmTheme.border}`,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: 'var(--profile-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Rarity
              </div>
              <div style={{ fontSize: 14, color: rarityColor, fontWeight: 'bold', textTransform: 'uppercase' }}>
                {card.rarity}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--profile-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Owned
              </div>
              <div style={{ fontSize: 14, color: 'var(--profile-text)', fontWeight: 500 }}>
                {owned > 0 ? `x${owned}` : 'Not owned'}
              </div>
            </div>
          </div>

          {/* Full stats and abilities */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--profile-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Card Rules
            </div>
            {isRevealed && isLegacyInfinite ? (
              <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--profile-text-soft)', background: 'var(--profile-surface-muted)', border: '1px solid var(--profile-border)', borderRadius: 8, padding: '10px 12px' }}>
                Archived Infinite collection record. This legacy card is not playable in the current card registry.
              </div>
            ) : isRevealed ? (
              <CardRulesDigest
                card={displayCard}
                variant="detail"
                lightBg={lightBg}
                labelColor="var(--profile-text-muted)"
                textColor="var(--profile-text-soft)"
                sectionBackground="var(--profile-surface-muted)"
                sectionBorder="var(--profile-border)"
              />
            ) : (
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: 'var(--profile-text-soft)',
                  background: 'var(--profile-surface-muted)',
                  border: '1px solid var(--profile-border)',
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
            <div style={{ fontSize: 10, color: 'var(--profile-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
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
                      color: 'var(--profile-text)',
                      padding: '6px 10px',
                      background: 'var(--profile-surface-muted)',
                      borderRadius: 4,
                      border: '1px solid var(--profile-border)',
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
                    <span style={{ fontSize: 10, color: 'var(--profile-text-muted)' }}>→ Store</span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--profile-text-muted)', fontStyle: 'italic' }}>
                {flavorObtain ?? '(Obtained through other means)'}
              </div>
            )}
          </div>

          {/* Action CTA (e.g. Summon Angel) — only shown when caller provides it */}
          {actionLabel && onAction && (
            <button
              className="menu-tactile-btn"
              onClick={() => { onAction(); onClose(); }}
              disabled={actionDisabled}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                marginBottom: 10,
                background: actionDisabled ? 'var(--profile-surface-muted)' : 'var(--profile-button)',
                border: '1px solid var(--profile-border-strong)',
                color: 'var(--profile-text)',
                fontSize: 13,
                fontFamily: 'Georgia, serif',
                cursor: actionDisabled ? 'not-allowed' : 'pointer',
                letterSpacing: 2.5,
                textTransform: 'uppercase',
                boxShadow: actionDisabled ? 'none' : warmTheme.glow,
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
            >
              <span className="ui-button-title">{actionLabel}</span>
            </button>
          )}

          {/* Favorite button */}
          {owned > 0 && (
            <button
              aria-pressed={isFavorite}
              onClick={handleFavoriteToggle}
              style={{
                width: '100%',
                padding: '10px 12px',
                marginTop: 12,
                borderRadius: 6,
                border: isFavorite
                  ? '1px solid var(--profile-accent)'
                  : '1px solid var(--profile-border)',
                background: 'var(--profile-surface-muted)',
                color: 'var(--profile-text)',
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
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--profile-surface)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = isFavorite
                  ? '0 0 12px rgba(255, 215, 100, 0.4)'
                  : 'none';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--profile-surface-muted)';
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
                color: 'var(--profile-text)',
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
