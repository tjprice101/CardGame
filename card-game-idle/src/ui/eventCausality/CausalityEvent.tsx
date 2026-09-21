/**
 * Causality — Event Landing Page
 *
 * Presents the set story, pack purchase tile (using Aberrated Shards),
 * a Starlight/Dream Lattice mechanic primer, and quick-links to the
 * relevant Eternity's Wake bosses.
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '@/state/store';
import { uiTypography } from '@/ui/theme';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { BOSS_DEFINITIONS, getBossDisplayHp } from '@/data/bosses/bossDefinitions';
import { formatCountdown, getCausalityEventCountdown, CAUSALITY_EVENT_ENDS_LABEL } from '@/ui/eventCausality/eventTimer';
import { hasBeatenAllForgeEventBosses } from '@/data/forge/forgeDefinitions';

interface Props {
  onClose: () => void;
  onCardStore: () => void;
  onEternitysWake: () => void;
}

function getEventTheme() {
  return {
    background:
      `linear-gradient(180deg, rgba(2,3,8,0.42), rgba(2,3,8,0.9)), url("${import.meta.env.BASE_URL}assets/event-art/causality/Causality BACKGROUND.png")`,
    accent: '#8de6ff',
    accentSoft: '#d7b7ff',
    border: 'rgba(138, 221, 255, 0.58)',
    panel: 'rgba(8, 14, 36, 0.86)',
    panelStrong: 'rgba(12, 18, 46, 0.94)',
    text: '#eef4ff',
    textMuted: 'rgba(211, 223, 250, 0.84)',
    textFaint: 'rgba(183, 200, 236, 0.66)',
    glowShadow: '0 14px 32px rgba(84, 186, 255, 0.24)',
    glowColor: 'rgba(141, 230, 255, 0.42)',
    success: '#90e9ba',
    danger: '#ff9fb6',
    reward: '#ffd58c',
  };
}

const MECHANIC_ROWS: { label: string; desc: string }[] = [
  { label: 'Limitless Cosmos', desc: 'A turn-scoped Causality resource. Individual cards decide how they grant, convert, consume, or scale from Cosmos.' },
  { label: 'Card-born Stacks', desc: 'Causality-specific counters appear in the Card-born Stacks panel whenever a Causality card is present in the active deck.' },
  { label: 'Event Horizons', desc: 'Causality cards bend board placement, Limitless Light, and Cosmos into alternate payoff lines. Card text is authoritative.' },
  { label: 'Black-hole Conversions', desc: 'Some cards transform existing Limitless Light Stack resources into Limitless Cosmos; conversion rates are authored per card.' },
  { label: 'Manuscript Accents', desc: 'Causality uses monochrome cosmic manuscript art with vivid signature accents breaking through the black-and-white field.' },
  { label: 'Causality Windows', desc: 'Build a board state, convert the right resources, then cash out with a card-authored horizon effect.' },
];

const overlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 30,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: uiTypography.body,
};

export default function CausalityEvent({ onClose, onCardStore, onEternitysWake }: Props) {
  const C = getEventTheme();
  const shards = useStore(s => s.progress.aberratedShards);
  const progress = useStore(s => s.progress);
  const claimForgeKeyReward = useStore(s => s.claimForgeKeyReward);
  const [activeTab, setActiveTab] = useState<'story' | 'mechanic' | 'packs' | 'bosses'>('story');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const eventCountdown = formatCountdown(getCausalityEventCountdown(nowMs));
  const allCausalityBossesDefeated = hasBeatenAllForgeEventBosses(progress.bossCodex);
  const keyRewardClaimed = progress.forgeKeyRewardClaimed === true;

  const causalityPack = PACK_DEFINITIONS.find(p => p.id === 'pack-causality');
  const causalityBosses = BOSS_DEFINITIONS.filter(boss => boss.category === 'Causality');

  return (
    <div style={{ ...overlay, background: C.background }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 28px',
        borderBottom: `1px solid ${C.border}`,
        background: C.panelStrong,
        backdropFilter: 'blur(6px)',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: uiTypography.display, fontSize: 22, letterSpacing: 3, textTransform: 'uppercase', color: C.accent, textShadow: `0 0 26px ${C.glowColor}` }}>
            ✦ Causality ✦
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: 1.2, marginTop: 3 }}>
            [EVENT SET] · The Causality Manuscript · Event Horizon System
          </div>
          <div style={{ fontSize: 11, color: C.accentSoft, letterSpacing: 1, marginTop: 4 }}>
            Ends {CAUSALITY_EVENT_ENDS_LABEL}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            padding: '7px 12px',
            borderRadius: 999,
            border: `1px solid ${C.border}`,
            background: C.panel,
            fontSize: 11,
            fontFamily: uiTypography.display,
            letterSpacing: 1.1,
            color: C.accent,
            boxShadow: C.glowShadow,
          }}>
            Ends In {eventCountdown}
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, letterSpacing: 0.8 }}>
            Aberrated Shards: <span style={{ color: C.accentSoft, fontWeight: 700 }}>{shards.toLocaleString()}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 18px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              fontFamily: uiTypography.body, letterSpacing: 0.8,
              background: C.panel, border: `1px solid ${C.border}`,
              color: C.accent,
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.panel, flexShrink: 0 }}>
        {(['story', 'mechanic', 'packs', 'bosses'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 24px', fontSize: 12, cursor: 'pointer', border: 'none', outline: 'none',
              fontFamily: uiTypography.display, letterSpacing: 1.4, textTransform: 'uppercase',
              background: activeTab === tab ? C.panelStrong : 'transparent',
              color: activeTab === tab ? C.accent : C.textFaint,
              borderBottom: activeTab === tab ? `2px solid ${C.accent}` : '2px solid transparent',
              transition: 'color 160ms, background 160ms',
            }}
          >
            {tab === 'story' ? 'Story' : tab === 'mechanic' ? 'Mechanic' : tab === 'packs' ? 'Pack' : 'Bosses'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '28px clamp(20px, 5vw, 64px)' }}>

        {activeTab === 'story' && (
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: C.text, marginBottom: 20 }}>
              Before the first horizon opened, the universe folded its laws into a manuscript of cause and effect.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted, marginBottom: 16 }}>
              Causality begins at the edge of a black hole: a celestial archive where event horizons, heavenly
              beasts, and impossible manuscripts record every choice before it happens.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted, marginBottom: 16 }}>
              Its cards are written on black-and-white paper, then punctured by vivid accents that mark the
              moments where reality diverges. Some cards convert Limitless Light into <strong style={{ color: C.accent }}>Limitless Cosmos</strong>;
              others consume Cosmos to force a different outcome.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted }}>
              The first Causality manuscript is an event set of Light, Dark, and Ain Soph Aur cards. The pack
              pool is currently the active source of its fragments; future pages will expand the archive.
            </p>
          </div>
        )}

        {activeTab === 'mechanic' && (
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <div style={{ fontSize: 13, color: C.textMuted, letterSpacing: 0.8, marginBottom: 20 }}>
              Causality is a setup-to-conversion engine. Build your board, manage Limitless Light, and use card-authored Limitless Cosmos effects. For exact formulas, trust the live card text shown in your collection and on card panels.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MECHANIC_ROWS.map(({ label, desc }) => (
                <div key={label} style={{
                  padding: '14px 18px', borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.panel,
                }}>
                  <div style={{ fontSize: 14, fontFamily: uiTypography.display, letterSpacing: 1.2, color: C.accent, marginBottom: 5 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.7 }}>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, padding: '14px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.panelStrong }}>
              <div style={{ fontSize: 13, fontFamily: uiTypography.display, letterSpacing: 1, color: C.text, marginBottom: 6 }}>Key Synergies</div>
              <ul style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                <li><strong>Light cards</strong> generate Limitless Cosmos directly or convert prepared Limitless Light into a larger Cosmos reserve.</li>
                <li><strong>Dark cards</strong> consume held Cosmos for Divine Light, draw utility, or renewed Limitless Light Stacks.</li>
                <li><strong>Ain Soph Aur cards</strong> either extend the conversion line or cash out Cosmos through a stronger board payoff.</li>
                <li><strong>Sequence deliberately:</strong> build Limitless Light, convert it, then spend Cosmos only after the required condition is secured.</li>
                <li><strong>Card-born Stacks</strong> are turn-scoped and reset when the turn ends, so unused Cosmos is lost.</li>
                <li><strong>If a card text conflicts with this guide</strong>, the card text is authoritative and should be treated as the source of truth.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'packs' && (
          <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {causalityPack ? (
              <div style={{
                padding: '22px 24px', borderRadius: 14,
                border: `1px solid ${C.border}`,
                background: C.panel,
                boxShadow: C.glowShadow,
              }}>
                <div style={{ fontFamily: uiTypography.display, fontSize: 17, letterSpacing: 1.6, color: C.accent, marginBottom: 6 }}>
                  {causalityPack.name}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, lineHeight: 1.7 }}>
                  {causalityPack.description}
                </div>
                <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 16 }}>
                  5 cards per pack · {causalityPack.cardPool.length} unique cards in the pool
                </div>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
                  Cost: <strong style={{ color: C.accent }}>{causalityPack.cost.toLocaleString()} Aberrated Shards</strong>
                  {' · '}
                  <span style={{ color: shards >= causalityPack.cost ? C.success : C.danger }}>
                    {shards >= causalityPack.cost ? `You can afford this (${shards.toLocaleString()} shards)` : `Need ${(causalityPack.cost - shards).toLocaleString()} more shards`}
                  </span>
                </div>
                <div style={{ marginBottom: 14, fontSize: 11, color: C.accentSoft, letterSpacing: 0.7 }}>
                  Event End: {CAUSALITY_EVENT_ENDS_LABEL} · Time Left: {eventCountdown}
                </div>
                <button
                  onClick={onCardStore}
                  style={{
                    padding: '10px 22px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                    fontFamily: uiTypography.display, letterSpacing: 1.2,
                    background: C.panelStrong, border: `1px solid ${C.border}`,
                    color: C.accent, width: '100%',
                  }}
                >
                  Open in Card Store →
                </button>
              </div>
            ) : (
              <div style={{ color: C.textFaint, fontSize: 13 }}>
                Pack data not yet available.
              </div>
            )}
            <div style={{ padding: '14px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.panelStrong, fontSize: 12, color: C.textMuted, lineHeight: 1.7 }}>
              <strong style={{ color: C.accent }}>Earning Aberrated Shards:</strong> Shards are awarded from boss fights, daily rewards, achievement completions, and event milestones. They are an event-exclusive currency and do not interact with the standard Divine Light economy.
            </div>
          </div>
        )}

        {activeTab === 'bosses' && (
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 4 }}>
              Defeat these bosses in Eternity's Wake to claim their Eternal card rewards.
            </div>
            {causalityBosses.length === 0 ? (
              <div style={{ color: C.textFaint, fontSize: 13 }}>
                No bosses registered for this event yet.
              </div>
            ) : (
              causalityBosses.map(boss => (
                <div key={boss.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 18px', borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.panel,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: uiTypography.display, fontSize: 14, letterSpacing: 1.2, color: C.accent, marginBottom: 4 }}>
                      {boss.name}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
                      {boss.description}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.textFaint, textAlign: 'right', flexShrink: 0 }}>
                    <div>HP: {getBossDisplayHp(progress, boss).toLocaleString()}</div>
                    <div style={{ color: C.reward, marginTop: 2 }}>+{boss.firstClearShards} shards (first clear)</div>
                    <div style={{ color: C.textMuted }}>+{boss.repeatClearShards} shards (repeat)</div>
                  </div>
                </div>
              ))
            )}
            {allCausalityBossesDefeated && !keyRewardClaimed && (
              <button
                onClick={() => claimForgeKeyReward()}
                style={{
                  marginTop: 8, padding: '10px 22px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  fontFamily: uiTypography.display, letterSpacing: 1.2,
                  background: 'linear-gradient(135deg, rgba(255,232,160,0.5), rgba(255,140,196,0.4))',
                  border: `1px solid ${C.accent}`,
                  color: '#fffdf8',
                  boxShadow: '0 0 18px rgba(255, 222, 112, 0.58)',
                  animation: 'pulseGlow 1.4s ease-in-out infinite',
                }}
              >
                Claim the “Key of Transcendence”
              </button>
            )}
            {allCausalityBossesDefeated && keyRewardClaimed && (
              <div style={{ marginTop: 8, color: C.success, fontSize: 13, letterSpacing: 1.1, textTransform: 'uppercase' }}>
                Key of Transcendence claimed
              </div>
            )}
            <button
              onClick={onEternitysWake}
              style={{
                marginTop: 8, padding: '10px 22px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                fontFamily: uiTypography.display, letterSpacing: 1.2,
                background: C.panelStrong, border: `1px solid ${C.border}`,
                color: C.accent,
              }}
            >
              Go to Eternity's Wake →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
