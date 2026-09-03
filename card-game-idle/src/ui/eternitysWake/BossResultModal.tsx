import { useEffect } from 'react';
import { useStore, selectBossFight } from '@/state/store';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  getBossFightMasteryPerCard,
} from '@/systems/progression/cardMastery';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import {
  cardFacePalette,
  getCardArtTopBottomBorderOverlayStyleForCard,
  getCardBackgroundUrl,
  getCardFaceMetrics,
  getDenseCardFaceBackgroundStyle,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { SfxManager } from '@/audio/SfxManager';

// ── Cosmic palette (shared with BossFightArena) ──────────────────────────────
const EW_TEXT         = 'rgba(244,244,248,0.95)';
const EW_TEXT_MUTED   = 'rgba(244,244,248,0.42)';
const EW_PANEL_BORDER = 'rgba(255,80,80,0.55)';
const EW_PANEL_TINT   = 'rgba(2,2,4,0.97)';

const VICTORY_ACCENT  = '#ffd87a';
const VICTORY_GLOW    = 'rgba(255,216,122,0.22)';
const DEFEAT_ACCENT   = '#ff6b6b';
const DEFEAT_GLOW     = 'rgba(255,80,80,0.16)';

const RARITY_COLORS: Record<string, string> = {
  Common: '#a8a8b8', Rare: '#5b9bd5', Epic: '#b87be8', Legendary: '#f39c12',
  Eternal: '#ff6b6b', Infinite: '#e8e8f0',
};

// Deterministic ember seeds for victory particle field
const VICTORY_EMBERS = [
  { x: 12, drift: 9,   dur: 2.8, delay: 0    },
  { x: 24, drift: -7,  dur: 3.2, delay: 0.55 },
  { x: 38, drift: 12,  dur: 2.6, delay: 1.1  },
  { x: 51, drift: -10, dur: 3.5, delay: 0.3  },
  { x: 62, drift: 8,   dur: 2.9, delay: 0.85 },
  { x: 74, drift: -6,  dur: 3.1, delay: 1.4  },
  { x: 85, drift: 11,  dur: 2.7, delay: 0.6  },
  { x: 93, drift: -9,  dur: 3.3, delay: 0.15 },
];

const REWARD_FACE_WIDTH = 116;
const REWARD_FACE_HEIGHT = 164;

export default function BossResultModal() {
  const bossFight = useStore(selectBossFight);
  const dismissBossResult = useStore(s => s.dismissBossResult);

  const isVictory = bossFight.mode === 'victory';
  const isVisible = bossFight.mode === 'victory' || bossFight.mode === 'defeat';

  // Play result sound once when result screen appears
  useEffect(() => {
    if (!isVisible) return;
    if (isVictory) {
      SfxManager.positive();
    } else {
      SfxManager.negative();
    }
  }, [isVisible, isVictory]);

  if (!isVisible) return null;

  const boss = BOSS_DEFINITIONS.find(b => b.id === bossFight.activeBossId);
  const kind = bossFight.kind ?? 'normal';
  const normalFightCount = kind === 'normal' ? Math.max(1, Math.min(3, bossFight.fightCount ?? 1)) : 1;

  let masteryPerCard: number | null = null;
  if (isVictory && boss) {
    const bossIdx = Math.max(0, BOSS_DEFINITIONS.findIndex(b => b.id === boss.id));
    const baseMasteryPerCard = getBossFightMasteryPerCard(
      bossIdx,
      BOSS_DEFINITIONS.length,
    );
    masteryPerCard = baseMasteryPerCard * normalFightCount;
  }
  const rewardDef = isVictory && boss ? CardRegistry.get(boss.rewardCardId) : undefined;
  const rewardPreviewText = rewardDef
    ? getCardPreviewLines(rewardDef, rewardDef.type === 'Angel' ? 3 : 2).join(' ')
    : '';
  const rewardFaceMetrics = getCardFaceMetrics('grid');

  const ACCENT       = isVictory ? VICTORY_ACCENT : DEFEAT_ACCENT;
  const GLOW_COLOR   = isVictory ? VICTORY_GLOW   : DEFEAT_GLOW;
  const PANEL_BORDER = isVictory ? `rgba(255,216,122,0.5)` : EW_PANEL_BORDER;

  return (
    <div
      aria-modal="true"
      role="dialog"
      style={{
        position: 'absolute', inset: 0, zIndex: 60,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        overflow: 'hidden',
        // Deep void base
        background: `linear-gradient(180deg, rgba(2,2,8,0.99) 0%, rgba(5,3,14,0.995) 100%)`,
      }}
    >
      {/* ── Radial atmospheric bloom ───────────────────────────────────────── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: isVictory
          ? `radial-gradient(ellipse 80% 55% at 50% 36%, rgba(255,205,80,0.20) 0%, rgba(255,160,40,0.10) 35%, transparent 62%),
             radial-gradient(ellipse 50% 30% at 50% 90%, rgba(255,180,60,0.08) 0%, transparent 60%)`
          : `radial-gradient(ellipse 80% 55% at 50% 36%, rgba(255,60,60,0.18) 0%, rgba(180,20,30,0.08) 40%, transparent 64%),
             radial-gradient(ellipse 60% 30% at 50% 90%, rgba(120,10,20,0.12) 0%, transparent 60%)`,
      }} />

      {/* ── Star scatter micro-constellation ──────────────────────────────── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(255,255,255,0.72) 1px, transparent 1px)',
        backgroundSize: '54px 54px',
        opacity: 0.065,
        animation: 'voidStarDrift 90s linear infinite',
      }} />

      {/* ── Edge accent lines (top + bottom) ──────────────────────────────── */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: '20%', right: '20%', height: 2,
        background: `linear-gradient(90deg, transparent, ${ACCENT}cc, transparent)`,
        boxShadow: `0 0 18px ${ACCENT}66`,
        pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1,
        background: `linear-gradient(90deg, transparent, ${ACCENT}66, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* ── Victory golden ember particles ──────────────────────────────────── */}
      {isVictory && VICTORY_EMBERS.map((e, i) => (
        <div key={i} aria-hidden style={{
          position: 'absolute',
          bottom: '18%',
          left: `${e.x}%`,
          width: 4, height: 4,
          borderRadius: '50%',
          background: `radial-gradient(circle, #ffe08a 30%, rgba(255,180,50,0.4) 100%)`,
          boxShadow: '0 0 6px rgba(255,200,80,0.85)',
          pointerEvents: 'none',
          ['--ember-drift' as string]: `${e.drift}px`,
          animation: `resultEmberRise ${e.dur}s ease-out ${e.delay}s infinite`,
        }} />
      ))}

      {/* ── Defeat low crimson vignette at screen edges ──────────────────── */}
      {!isVictory && (
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 52%, rgba(180,20,20,0.28) 100%)',
          animation: 'resultDefeatCrimsonPulse 3s ease-in-out infinite',
        }} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT — scrollable inner column
          ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 28, width: '100%', maxWidth: 840,
        maxHeight: '100vh', overflowY: 'auto',
        padding: '48px 32px 48px',
        boxSizing: 'border-box',
      }}>
        {/* ── Headline ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          animation: 'resultHeadlineReveal 0.75s cubic-bezier(.22,.61,.36,1) both',
        }}>
          <div style={{
            fontSize: 'clamp(52px, 9vw, 76px)',
            fontWeight: 'bold',
            letterSpacing: 14,
            textTransform: 'uppercase',
            color: ACCENT,
            textShadow: `0 0 32px ${ACCENT}cc, 0 0 72px ${ACCENT}44, 0 4px 12px rgba(0,0,0,0.95)`,
            lineHeight: 1,
            userSelect: 'none',
          }}>
            {isVictory ? 'VICTORY' : 'DEFEATED'}
          </div>

          {boss && (
            <div style={{
              fontSize: 13, letterSpacing: 4, textTransform: 'uppercase',
              color: EW_TEXT_MUTED,
            }}>
              {isVictory ? `${boss.name} vanquished` : `${boss.name} endured`}
            </div>
          )}
        </div>

        {/* ── Chrome divider ────────────────────────────────────────────── */}
        <div aria-hidden style={{
          width: 220, height: 1,
          background: `linear-gradient(90deg, transparent, ${ACCENT}aa, transparent)`,
          boxShadow: `0 0 10px ${ACCENT}44`,
          animation: 'resultPanelSlideUp 0.6s 0.25s ease both',
        }} />

        {/* ── Stats panel ───────────────────────────────────────────────── */}
        <div style={{
          width: '100%',
          background: `linear-gradient(180deg, ${EW_PANEL_TINT} 0%, rgba(8,4,16,0.96) 100%)`,
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: 16,
          padding: '18px 24px',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '14px 20px',
          animation: 'resultPanelSlideUp 0.6s 0.35s ease both',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Star scatter inside panel */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '42px 42px', opacity: 0.055,
          }} />

          <StatCell label="DAMAGE DEALT" value={bossFight.damageDealtThisFight.toLocaleString()} accent={ACCENT} />
          <StatCell label="BOSS MAX HP" value={bossFight.bossMaxHp.toLocaleString()} accent={EW_TEXT_MUTED} />
          {boss && (
            <StatCell label="BOSS" value={boss.name} accent={EW_TEXT} span />
          )}
          {masteryPerCard !== null && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 8.5, letterSpacing: 1.5, color: EW_TEXT_MUTED, textTransform: 'uppercase' }}>
                Card-light Awarded
              </span>
              <span style={{ fontSize: 18, fontWeight: 'bold', color: '#7de8a0', textShadow: '0 0 14px rgba(125,232,160,0.5)' }}>
                Awards +{masteryPerCard} Card-light for each card in your deck upon completion.
              </span>
            </div>
          )}
        </div>

        {/* ── Reward card panel (victory only) ──────────────────────────── */}
        {isVictory && rewardDef && (
          <div style={{
            width: '100%',
            background: `linear-gradient(180deg, rgba(4,3,10,0.98) 0%, rgba(8,5,18,0.97) 100%)`,
            border: `1px solid ${VICTORY_ACCENT}66`,
            borderRadius: 16, padding: '20px 20px',
            display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start',
            boxShadow: `0 0 24px ${VICTORY_GLOW}, inset 0 0 0 1px rgba(255,216,122,0.06)`,
            animation: 'resultPanelSlideUp 0.6s 0.45s ease both',
          }}>
            <div style={{
              fontSize: 9, letterSpacing: 3, color: VICTORY_ACCENT,
              textTransform: 'uppercase', marginBottom: 2,
            }}>
              Card Awarded
            </div>

            <div style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: `${REWARD_FACE_WIDTH}px minmax(0, 1fr)`,
              gap: 10,
              alignItems: 'start',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
              }}>
                <div
                  className={rewardDef.rarity === 'Infinite' || rewardDef.rarity === 'Eternal' || rewardDef.rarity === 'Enigmatic'
                    ? `holofoil-menu-card${rewardDef.rarity === 'Infinite' ? ' infinite-holo-bw-hover' : ''}${rewardDef.rarity === 'Eternal' ? ' eternal-holo-red-hover' : ''}${rewardDef.rarity === 'Enigmatic' ? ' enigmatic-holo-violet-hover' : ''}`
                    : undefined}
                  style={{
                    width: REWARD_FACE_WIDTH,
                    height: REWARD_FACE_HEIGHT,
                    ...getDenseCardFaceBackgroundStyle(rewardDef, 'normal', 'front', true),
                    borderRadius: 10,
                    border: `1px solid ${VICTORY_ACCENT}55`,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}
                >
                  {getCardBackgroundUrl(rewardDef) && <img src={getCardBackgroundUrl(rewardDef)!} alt="" loading="eager" decoding="async" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} />}
                  <div style={getCardArtTopBottomBorderOverlayStyleForCard(rewardDef)} />
                  <div style={getCardNameRibbonStyle('grid')}>
                    <div style={{
                      color: cardFacePalette.textMuted,
                      letterSpacing: 1.4,
                      marginBottom: 4,
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      fontSize: rewardFaceMetrics.typeSize,
                    }}>
                      {getDisplayCardTypeLabel(rewardDef.type)}
                    </div>
                    <div style={{
                      color: cardFacePalette.text,
                      fontSize: rewardFaceMetrics.nameSize,
                      fontWeight: 'bold',
                      lineHeight: 1.25,
                      textAlign: 'center',
                      minHeight: 24,
                    }}>
                      {rewardDef.name}
                    </div>
                  </div>
                  <div style={getCardRulesPanelStyle('grid')}>
                    <div style={{
                      color: cardFacePalette.textSoft,
                      display: '-webkit-box',
                      fontSize: rewardFaceMetrics.descSize,
                      lineHeight: rewardFaceMetrics.descLineHeight,
                      overflow: 'hidden',
                      textAlign: 'center',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: rewardDef.type === 'Angel' ? 3 : 2,
                    }}>
                      {rewardPreviewText}
                    </div>
                    {rewardDef.type === 'Angel' && (
                      <div style={{
                        fontSize: 6,
                        color: cardFacePalette.textMuted,
                        marginTop: 5,
                        textAlign: 'center',
                      }}>
                        Cost: {rewardDef.summonCost.length} materials
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                minWidth: 0,
                background: 'rgba(7, 4, 14, 0.76)',
                border: `1px solid ${VICTORY_ACCENT}2a`,
                borderRadius: 12,
                padding: '11px 11px 10px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: EW_TEXT, letterSpacing: 1 }}>
                    {rewardDef.name}
                  </div>
                  <div style={{ fontSize: 11, color: RARITY_COLORS[rewardDef.rarity] ?? EW_TEXT_MUTED, letterSpacing: 1 }}>
                    {rewardDef.rarity} · {rewardDef.type}
                  </div>
                </div>

                <div style={{ width: '100%', marginTop: 1 }}>
                  <CardRulesDigest
                    card={rewardDef}
                    variant="preview"
                    maxSections={6}
                    maxLinesPerSection={9}
                    lineClamp={6}
                    labelColor={EW_TEXT_MUTED}
                    textColor={EW_TEXT}
                    sectionBackground="transparent"
                    sectionBorder="transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Cooldown notice ───────────────────────────────────────────── */}
        <div style={{
          fontSize: 10, letterSpacing: 1, color: EW_TEXT_MUTED,
          animation: 'resultPanelSlideUp 0.6s 0.55s ease both',
        }}>
          Boss cooldown: 60 seconds
        </div>

        {/* ── Dismiss button ────────────────────────────────────────────── */}
        <button
          onClick={dismissBossResult}
          style={{
            background: `linear-gradient(180deg, ${GLOW_COLOR} 0%, rgba(0,0,0,0.3) 100%)`,
            border: `1px solid ${ACCENT}`,
            color: ACCENT,
            padding: '13px 52px',
            borderRadius: 10,
            cursor: 'pointer',
            fontFamily: 'Georgia, serif',
            fontSize: 15,
            letterSpacing: 4,
            textTransform: 'uppercase',
            boxShadow: `0 0 20px ${ACCENT}33, inset 0 1px 0 rgba(255,255,255,0.06)`,
            transition: 'box-shadow 160ms ease, transform 160ms ease',
            animation: 'resultPanelSlideUp 0.6s 0.62s ease both',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 32px ${ACCENT}66, inset 0 1px 0 rgba(255,255,255,0.1)`;
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${ACCENT}33, inset 0 1px 0 rgba(255,255,255,0.06)`;
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          {isVictory ? 'Collect' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

function StatCell({
  label, value, accent, span,
}: {
  label: string;
  value: string;
  accent: string;
  span?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 3,
      gridColumn: span ? '1 / -1' : undefined,
    }}>
      <span style={{ fontSize: 8.5, letterSpacing: 1.5, color: EW_TEXT_MUTED, textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{
        fontSize: span ? 13 : 18, fontWeight: 'bold',
        color: accent,
        textShadow: accent !== EW_TEXT_MUTED ? `0 0 14px ${accent}66` : undefined,
        letterSpacing: span ? 0.5 : 0,
      }}>
        {value}
      </span>
    </div>
  );
}
