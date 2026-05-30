/**
 * Wished Upon A Star — Event Landing Page
 *
 * Presents the set story, pack purchase tile (using Aberrated Shards),
 * a Starlight/Dream Lattice mechanic primer, and quick-links to the
 * relevant Eternity's Wake bosses.
 */

import React, { useState } from 'react';
import { useStore } from '@/state/store';
import { uiTypography } from '@/ui/theme';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';

interface Props {
  onClose: () => void;
  onCardStore: () => void;
  onEternitysWake: () => void;
}

const STARBLUE = '#b8c8ff';
const STARGLOW = '0 0 32px rgba(160,190,255,0.35), 0 0 64px rgba(130,160,255,0.18)';
const STAR_BORDER = 'rgba(184,200,232,0.7)';

const MECHANIC_ROWS: { label: string; desc: string }[] = [
  { label: 'Starlight Charges', desc: 'Built up by playing cards. Drives every cashout in the set — Nova Wish Burst, Crown release, and Infinite Starbirth all scale with your Starlight total.' },
  { label: 'Dream Lattice',     desc: 'A secondary amplifier. Multiplies Nova Wish Burst output by (1 + Dream × 0.4) and feeds chain bonuses on several cards. Resets each turn unless a Ward preserves it.' },
  { label: 'Nova Wish Burst',   desc: 'A massive single-shot cashout: Oblivion = Starlight × (1 + Dream Lattice × 0.4). Triggered by Ophanim cards (Aeolian Nova) and Angel activated abilities (Eclipse Decree, Wishwright Absolute).' },
  { label: 'Constellation Lock', desc: 'The Eternal Crown cashout lane. Bank Star Crowns with Eternal and Infinite cards, then release them for high-value Oblivion bursts.' },
  { label: 'Star Crowns',       desc: 'The Eternal-tier resource. Aethervex banks a huge stockpile (no cashout); Selenira detonates it alongside a Nova Wish Burst; Draethos waits for a 3-card window then cashes out at the highest rate.' },
  { label: 'Infinite Starbirth', desc: 'The Infinite-tier cashout: Oblivion = Seraphim on board × Starlight × coefficient. Stellarborn Throne is the pure Starbirth specialist; Wishwright Absolute folds Starbirth into a triple-cashout finisher.' },
];

const overlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 30,
  background: 'linear-gradient(180deg, rgba(4,5,18,0.97) 0%, rgba(8,10,24,0.98) 40%, rgba(4,5,14,0.99) 100%)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: uiTypography.body,
};

export default function WishedUponAStarEvent({ onClose, onCardStore, onEternitysWake }: Props) {
  const shards = useStore(s => s.progress.aberratedShards);
  const [activeTab, setActiveTab] = useState<'story' | 'mechanic' | 'packs' | 'bosses'>('story');

  const wuasPack = PACK_DEFINITIONS.find(p => p.id === 'pack-wished-upon-a-star');
  const wuasBosses = BOSS_DEFINITIONS.filter(b => b.category === '[EVENT] Wished Upon A Star');

  return (
    <div style={overlay}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 28px',
        borderBottom: `1px solid ${STAR_BORDER}`,
        background: 'rgba(8,10,24,0.85)',
        backdropFilter: 'blur(6px)',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: uiTypography.display, fontSize: 22, letterSpacing: 3, textTransform: 'uppercase', color: STARBLUE, textShadow: STARGLOW }}>
            ✦ Wished Upon A Star ✦
          </div>
          <div style={{ fontSize: 11, color: 'rgba(184,200,255,0.6)', letterSpacing: 1.2, marginTop: 3 }}>
            [EVENT SET] · The Wishwright's Age · Stellar Wish System
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ fontSize: 13, color: 'rgba(184,200,255,0.8)', letterSpacing: 0.8 }}>
            Aberrated Shards: <span style={{ color: STARBLUE, fontWeight: 700 }}>{shards.toLocaleString()}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 18px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              fontFamily: uiTypography.body, letterSpacing: 0.8,
              background: 'rgba(184,200,255,0.08)', border: `1px solid ${STAR_BORDER}`,
              color: STARBLUE,
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${STAR_BORDER}`, background: 'rgba(8,10,24,0.7)', flexShrink: 0 }}>
        {(['story', 'mechanic', 'packs', 'bosses'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 24px', fontSize: 12, cursor: 'pointer', border: 'none', outline: 'none',
              fontFamily: uiTypography.display, letterSpacing: 1.4, textTransform: 'uppercase',
              background: activeTab === tab ? 'rgba(184,200,255,0.12)' : 'transparent',
              color: activeTab === tab ? STARBLUE : 'rgba(184,200,255,0.5)',
              borderBottom: activeTab === tab ? `2px solid ${STARBLUE}` : '2px solid transparent',
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
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(210,220,255,0.88)', marginBottom: 20 }}>
              Before stars learned to fall, they made wishes of their own.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(184,200,255,0.75)', marginBottom: 16 }}>
              In the age before the first light cooled, three cosmic beings stood sentinel at the edge of
              creation: <em>Selenira</em>, whose vigil kept darkness patient; <em>Draethos</em>, whose gravity
              bent time into loops of longing; and <em>Aethervex</em>, the Wishwright, whose wings were made
              of galaxy-thread and whose eyes swallowed dead suns.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(184,200,255,0.75)', marginBottom: 16 }}>
              When the Wishwright's Age ended — not with a collapse but with a wish unfulfilled — their power
              scattered as <strong style={{ color: STARBLUE }}>Starlight Charges</strong> across every card
              played in the arena. Now their children walk as cards. Those who master the{' '}
              <strong style={{ color: STARBLUE }}>Dream Lattice</strong> can bend their wishes into
              oblivion nova-bursts capable of erasing entire boss phases.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(184,200,255,0.75)' }}>
              The three Eternal forms — <em>Aethervex the Wishwright</em>, <em>Selenira Voidbane</em>, and{' '}
              <em>Draethos the Unforgotten</em> — now serve as the event's boss guardians. Defeat them in
              Eternity's Wake to claim their Eternal card rewards.
            </p>
          </div>
        )}

        {activeTab === 'mechanic' && (
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <div style={{ fontSize: 13, color: 'rgba(184,200,255,0.6)', letterSpacing: 0.8, marginBottom: 20 }}>
              The Wished Upon A Star set runs on two stacking counters and two big cashouts. Build Starlight Charges and Dream Lattice through play, then spend them in a single decisive turn.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MECHANIC_ROWS.map(({ label, desc }) => (
                <div key={label} style={{
                  padding: '14px 18px', borderRadius: 10,
                  border: `1px solid rgba(184,200,232,0.28)`,
                  background: 'rgba(12,15,36,0.72)',
                }}>
                  <div style={{ fontSize: 14, fontFamily: uiTypography.display, letterSpacing: 1.2, color: STARBLUE, marginBottom: 5 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(184,200,255,0.75)', lineHeight: 1.7 }}>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, padding: '14px 18px', borderRadius: 10, border: `1px solid rgba(184,200,232,0.4)`, background: 'rgba(8,12,30,0.82)' }}>
              <div style={{ fontSize: 13, fontFamily: uiTypography.display, letterSpacing: 1, color: '#e0ecff', marginBottom: 6 }}>Key Synergies</div>
              <ul style={{ fontSize: 12, color: 'rgba(184,200,255,0.7)', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                <li><strong>Aethervex (Eternal)</strong> banks 15 Star Crowns without spending them — set up the stockpile, then detonate it with Selenira Voidbane or Wishwright Absolute on a later turn.</li>
                <li><strong>Wishwright Absolute (Infinite)</strong> is the only card that fires Nova Wish Burst, Star Crown cashout, AND Infinite Starbirth in a single play — save it for after Aethervex banks crowns and Lune Choir preserves Dream Lattice.</li>
                <li><strong>Solarvex Fragment</strong> (Seraphim) and <strong>Wishwright's Pulse</strong> (Cherubim) each grant +1 Starlight Charge per card played while on the board — stack them to flood Starlight quickly.</li>
                <li><strong>Solarvex Ward</strong> (Cherubim) and <strong>Lune Choir Ascension</strong> (Infinite) keep Dream Lattice alive between turns, enabling long combo windows.</li>
                <li><strong>Starlace Binding</strong> (Cherubim) buffs every Seraphim and Angel attack by +55 Oblivion and +0.06 chain once Starlight reaches 5.</li>
                <li><strong>Selenira's Vigil</strong> (Seraphim) turns Dream Lattice stacks into chain growth — pair with Wards for runaway chains.</li>
                <li><strong>Nullspire Monolith</strong> frontloads both Starlight and Dream while adding board power amplification, making it a reliable bridge into Crown release turns.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'packs' && (
          <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {wuasPack ? (
              <div style={{
                padding: '22px 24px', borderRadius: 14,
                border: `1px solid ${STAR_BORDER}`,
                background: 'rgba(10,12,28,0.88)',
                boxShadow: STARGLOW,
              }}>
                <div style={{ fontFamily: uiTypography.display, fontSize: 17, letterSpacing: 1.6, color: STARBLUE, marginBottom: 6 }}>
                  {wuasPack.name}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(184,200,255,0.7)', marginBottom: 16, lineHeight: 1.7 }}>
                  {wuasPack.description}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(184,200,255,0.55)', marginBottom: 16 }}>
                  5 cards per pack · {wuasPack.cardPool.length} unique cards in the pool
                </div>
                <div style={{ fontSize: 13, color: 'rgba(184,200,255,0.8)', marginBottom: 16 }}>
                  Cost: <strong style={{ color: STARBLUE }}>{wuasPack.cost.toLocaleString()} Aberrated Shards</strong>
                  {' · '}
                  <span style={{ color: shards >= wuasPack.cost ? '#7cdd9d' : '#e88' }}>
                    {shards >= wuasPack.cost ? `You can afford this (${shards.toLocaleString()} shards)` : `Need ${(wuasPack.cost - shards).toLocaleString()} more shards`}
                  </span>
                </div>
                <button
                  onClick={onCardStore}
                  style={{
                    padding: '10px 22px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                    fontFamily: uiTypography.display, letterSpacing: 1.2,
                    background: 'rgba(184,200,255,0.12)', border: `1px solid ${STAR_BORDER}`,
                    color: STARBLUE, width: '100%',
                  }}
                >
                  Open in Card Store →
                </button>
              </div>
            ) : (
              <div style={{ color: 'rgba(184,200,255,0.5)', fontSize: 13 }}>
                Pack data not yet available.
              </div>
            )}
            <div style={{ padding: '14px 18px', borderRadius: 10, border: `1px solid rgba(184,200,232,0.28)`, background: 'rgba(8,10,24,0.7)', fontSize: 12, color: 'rgba(184,200,255,0.6)', lineHeight: 1.7 }}>
              <strong style={{ color: STARBLUE }}>Earning Aberrated Shards:</strong> Shards are awarded from boss fights, daily rewards, achievement completions, and event milestones. They are an event-exclusive currency and do not interact with the standard Oblivion economy.
            </div>
          </div>
        )}

        {activeTab === 'bosses' && (
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'rgba(184,200,255,0.55)', marginBottom: 4 }}>
              Defeat these bosses in Eternity's Wake to claim their Eternal card rewards.
            </div>
            {wuasBosses.length === 0 ? (
              <div style={{ color: 'rgba(184,200,255,0.45)', fontSize: 13 }}>
                No bosses registered for this event yet.
              </div>
            ) : (
              wuasBosses.map(boss => (
                <div key={boss.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 18px', borderRadius: 10,
                  border: `1px solid rgba(184,200,232,0.3)`,
                  background: 'rgba(10,12,28,0.8)',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: uiTypography.display, fontSize: 14, letterSpacing: 1.2, color: STARBLUE, marginBottom: 4 }}>
                      {boss.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(184,200,255,0.65)', lineHeight: 1.6 }}>
                      {boss.description}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(184,200,255,0.5)', textAlign: 'right', flexShrink: 0 }}>
                    <div>HP: {boss.hp.toLocaleString()}</div>
                    <div style={{ color: '#ffd070', marginTop: 2 }}>+{boss.firstClearShards} shards (first clear)</div>
                    <div style={{ color: 'rgba(255,208,112,0.6)' }}>+{boss.repeatClearShards} shards (repeat)</div>
                  </div>
                </div>
              ))
            )}
            <button
              onClick={onEternitysWake}
              style={{
                marginTop: 8, padding: '10px 22px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                fontFamily: uiTypography.display, letterSpacing: 1.2,
                background: 'rgba(184,200,255,0.08)', border: `1px solid ${STAR_BORDER}`,
                color: STARBLUE,
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
