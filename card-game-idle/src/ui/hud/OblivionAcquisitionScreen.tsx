/**
 * OblivionAcquisitionScreen — full-screen reference overlay explaining every
 * source of Oblivion in the game.  Opened via the ◈ button in TopStatusBar.
 *
 * Four tabs:
 *   Overview  – live board stats (earned this turn, active bonuses)
 *   Attacks   – Seraphim / Angel attack breakdown
 *   Bonuses   – Board bonuses, global mult, Cherubim passives
 *   Tips      – Prioritised strategy tips
 */

import { useState, useEffect } from 'react';
import {
  useStore,
  selectTurn,
  selectComputedStats,
  selectOblivion,
  selectBoard,
  selectBossFight,
} from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { formatNumber } from '@/utils/bignum';
import { uiTypography } from '@/ui/theme';
import type { SeraphimDefinition, AngelDefinition, SeraphimInstance, AngelInstance } from '@/types/cards';

// ─── constants ───────────────────────────────────────────────────────────────

const DF = uiTypography.display;
const BF = uiTypography.body;

const C = {
  backdrop:    'rgba(3,2,6,0.90)',
  panelBg:     'linear-gradient(155deg, rgba(11,9,18,0.98) 0%, rgba(17,13,28,0.97) 100%)',
  panelBorder: '1px solid rgba(190,150,100,0.24)',
  panelShadow: '0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(200,160,110,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
  dimLine:     'rgba(255,255,255,0.07)',

  gold:   { fg: '#f7c04a', bg: 'rgba(247,192,74,0.09)',  br: 'rgba(247,192,74,0.25)' },
  blue:   { fg: '#68b3f0', bg: 'rgba(104,179,240,0.09)', br: 'rgba(104,179,240,0.25)' },
  green:  { fg: '#5cb87a', bg: 'rgba(92,184,122,0.09)',  br: 'rgba(92,184,122,0.25)' },
  purple: { fg: '#b87de8', bg: 'rgba(184,125,232,0.09)', br: 'rgba(184,125,232,0.25)' },
  red:    { fg: '#f07878', bg: 'rgba(240,120,120,0.09)', br: 'rgba(240,120,120,0.25)' },
  dim:    { fg: 'rgba(244,244,248,0.45)', bg: 'rgba(255,255,255,0.04)', br: 'rgba(255,255,255,0.10)' },
} as const;

// ─── sub-components ──────────────────────────────────────────────────────────

function TabButton({
  label, active, accent, onClick,
}: { label: string; active: boolean; accent: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 18px',
        borderRadius: 999,
        border: `1px solid ${active ? accent + '60' : 'rgba(255,255,255,0.11)'}`,
        background: active
          ? `linear-gradient(135deg, ${accent}22 0%, ${accent}0a 100%)`
          : 'rgba(255,255,255,0.04)',
        color: active ? accent : 'rgba(244,244,248,0.52)',
        fontSize: 11,
        letterSpacing: 1.4,
        textTransform: 'uppercase' as const,
        fontFamily: DF,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: active ? `0 0 14px ${accent}28` : 'none',
      }}
    >
      {label}
    </button>
  );
}

interface StatPillProps { label: string; value: string | number; accent?: string; glow?: boolean }
function StatPill({ label, value, accent = '#f7c04a', glow }: StatPillProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '12px 20px',
      borderRadius: 16,
      border: `1px solid ${accent}33`,
      background: `linear-gradient(150deg, ${accent}12 0%, ${accent}06 100%)`,
      boxShadow: glow ? `0 0 20px ${accent}28` : 'none',
      minWidth: 120, flex: 1,
      animation: glow ? 'obAcqPillGlow 2.8s ease-in-out infinite' : undefined,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent, fontFamily: DF, letterSpacing: 1 }}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </div>
      <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(244,244,248,0.45)', marginTop: 4, fontFamily: BF }}>
        {label}
      </div>
    </div>
  );
}

interface SourceCardProps {
  icon: string;
  title: string;
  subtitle: string;
  value?: string;
  accent?: { fg: string; bg: string; br: string };
  tags?: string[];
}
function SourceCard({ icon, title, subtitle, value, accent = C.gold, tags }: SourceCardProps) {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'flex-start',
      padding: '14px 16px',
      borderRadius: 14,
      border: `1px solid ${accent.br}`,
      background: accent.bg,
      transition: 'box-shadow 0.18s ease',
    }}>
      <div style={{
        fontSize: 22, lineHeight: 1,
        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 10, background: `${accent.fg}18`, border: `1px solid ${accent.br}`,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: accent.fg, fontFamily: DF, letterSpacing: 0.4 }}>{title}</div>
          {value && (
            <div style={{
              fontSize: 13, fontWeight: 800, color: accent.fg, fontFamily: DF,
              background: `${accent.fg}18`, border: `1px solid ${accent.br}`,
              borderRadius: 8, padding: '2px 10px', whiteSpace: 'nowrap' as const, flexShrink: 0,
            }}>
              {value}
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(244,244,248,0.6)', lineHeight: 1.55, fontFamily: BF }}>{subtitle}</div>
        {tags && tags.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginTop: 8 }}>
            {tags.map(t => (
              <span key={t} style={{
                fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' as const,
                background: `${accent.fg}16`, border: `1px solid ${accent.br}`,
                borderRadius: 999, padding: '2px 8px', color: accent.fg, fontFamily: BF,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TipCardProps { rank: number; title: string; detail: string; accent: string }
function TipCard({ rank, title, detail, accent }: TipCardProps) {
  return (
    <div style={{
      display: 'flex', gap: 16, alignItems: 'flex-start',
      padding: '16px 18px',
      borderRadius: 14,
      border: `1px solid ${accent}28`,
      background: `linear-gradient(135deg, ${accent}0e 0%, ${accent}06 100%)`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: `${accent}28`, border: `1px solid ${accent}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 800, color: accent, fontFamily: DF, flexShrink: 0,
      }}>
        {rank}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(244,244,248,0.95)', fontFamily: DF, marginBottom: 5, letterSpacing: 0.3 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(244,244,248,0.62)', lineHeight: 1.6, fontFamily: BF }}>{detail}</div>
      </div>
    </div>
  );
}

function SectionTitle({ label, accent }: { label: string; accent: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
    }}>
      <div style={{ width: 3, height: 18, borderRadius: 99, background: accent }} />
      <span style={{
        fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase' as const,
        color: accent, fontFamily: DF, fontWeight: 700,
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${accent}30, transparent)` }} />
    </div>
  );
}

// ─── attack card (live board data) ───────────────────────────────────────────

function SeraphimAttackRow({ instance, def }: {
  instance: SeraphimInstance; def: SeraphimDefinition;
}) {
  const attacks = def.attacks;
  if (!attacks) return null;

  const unsyn = attacks.unsynergized;
  const syn   = attacks.synergized;
  const unsyncedCd = instance.attackCooldowns?.[unsyn.id] ?? 0;
  const syncedCd   = instance.attackCooldowns?.[syn.id]  ?? 0;

  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${C.blue.br}`,
      background: C.blue.bg, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${C.dimLine}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.blue.fg, fontFamily: DF }}>{def.name}</div>
          <div style={{ fontSize: 10, color: 'rgba(244,244,248,0.4)', fontFamily: BF, letterSpacing: 0.5 }}>
            {instance.isActive ? '✦ Synergy Active' : '○ Synergy Offline'}
          </div>
        </div>
      </div>
      {/* Attacks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {[
          { label: 'Unsynergized', base: unsyn.baseOblivion, cd: unsyncedCd, ready: unsyncedCd <= 0 },
          { label: 'Synergized',   base: syn.baseOblivion,   cd: syncedCd,   ready: syncedCd <= 0 && instance.isActive },
        ].map((a, i) => (
          <div key={a.label} style={{
            padding: '10px 14px',
            borderLeft: i === 1 ? `1px solid ${C.dimLine}` : undefined,
          }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(244,244,248,0.38)', fontFamily: DF, marginBottom: 4 }}>{a.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: a.ready ? C.blue.fg : 'rgba(244,244,248,0.35)', fontFamily: DF }}>
              {formatNumber(a.base)}
            </div>
            <div style={{ fontSize: 9, color: a.ready ? C.green.fg : 'rgba(244,244,248,0.35)', marginTop: 4, fontFamily: BF }}>
              {a.ready ? '● Ready' : `Cooldown: ${a.cd} cards`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AngelAttackRow({ instance, def }: { instance: AngelInstance; def: AngelDefinition }) {
  const attacks = def.attacks;
  if (!attacks) return null;

  const primary = attacks.primary;
  const exalted = attacks.exalted;
  const primaryCd = instance.attackCooldowns?.[primary.id] ?? 0;
  const exaltedCd = instance.attackCooldowns?.[exalted.id] ?? 0;

  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${C.gold.br}`,
      background: C.gold.bg, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${C.dimLine}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold.fg, fontFamily: DF }}>{def.name}</div>
          <div style={{ fontSize: 10, color: 'rgba(244,244,248,0.4)', fontFamily: BF }}>Angel · {def.rarity}</div>
        </div>
        <div style={{
          fontSize: 9, padding: '3px 8px', borderRadius: 999,
          background: `${C.gold.fg}1a`, border: `1px solid ${C.gold.br}`,
          color: C.gold.fg, letterSpacing: 0.8, fontFamily: BF,
        }}>
          Exalted ~3× Seraphim
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {[
          { label: 'Primary',  base: primary.baseOblivion, cd: primaryCd, ready: primaryCd <= 0 },
          { label: 'Exalted',  base: exalted.baseOblivion, cd: exaltedCd, ready: exaltedCd <= 0 },
        ].map((a, i) => (
          <div key={a.label} style={{
            padding: '10px 14px',
            borderLeft: i === 1 ? `1px solid ${C.dimLine}` : undefined,
          }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(244,244,248,0.38)', fontFamily: DF, marginBottom: 4 }}>{a.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: a.ready ? C.gold.fg : 'rgba(244,244,248,0.35)', fontFamily: DF }}>
              {formatNumber(a.base)}
            </div>
            <div style={{ fontSize: 9, color: a.ready ? C.green.fg : 'rgba(244,244,248,0.35)', marginTop: 6, fontFamily: BF }}>
              {a.ready ? '● Ready' : `Cooldown: ${a.cd} cards`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── tab content ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const oblivion = useStore(selectOblivion);
  const turn     = useStore(selectTurn);
  const stats    = useStore(selectComputedStats);
  const board    = useStore(selectBoard);
  const boss     = useStore(selectBossFight);

  const filledFront = board.frontSlots.filter(Boolean).length;
  const filledBack  = board.backSlots.filter(Boolean).length;
  const totalFilled = filledFront + filledBack;
  const fullBoard   = stats.fullBoardActive;
  const globalMult  = stats.globalOblivionMult;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Live stat pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        <StatPill label="Total Oblivion" value={oblivion} accent={C.gold.fg} glow />
        <StatPill label="Earned This Turn" value={turn.oblivionEarnedThisTurn ?? 0} accent={C.blue.fg} />
        <StatPill label="Per-Card Bonus" value={`+${formatNumber(stats.oblivionPerCardBonus)}`} accent={C.green.fg} />
        <StatPill label={`Board ${totalFilled}/9`} value={fullBoard ? '+30% Active' : `${totalFilled}/9 Filled`} accent={fullBoard ? C.green.fg : 'rgba(244,244,248,0.42)'} glow={fullBoard} />
      </div>

      {/* Quick board status */}
      <div>
        <SectionTitle label="Board Status" accent={C.blue.fg} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {/* Board fill */}
          <div style={{
            padding: '14px', borderRadius: 14,
            border: `1px solid ${fullBoard ? C.green.br : C.dim.br}`,
            background: fullBoard ? C.green.bg : C.dim.bg,
          }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: fullBoard ? C.green.fg : 'rgba(244,244,248,0.38)', fontFamily: DF, marginBottom: 6 }}>
              Full Board Bonus
            </div>
            {/* Mini slot grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {board.frontSlots.map((s, i) => (
                  <div key={i} style={{
                    width: 22, height: 22, borderRadius: 5,
                    background: s ? C.green.fg : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${s ? C.green.br : 'rgba(255,255,255,0.12)'}`,
                    transition: 'all 0.2s',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {board.backSlots.map((s, i) => (
                  <div key={i} style={{
                    width: 22, height: 22, borderRadius: 5,
                    background: s ? C.purple.fg : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${s ? C.purple.br : 'rgba(255,255,255,0.12)'}`,
                    transition: 'all 0.2s',
                  }} />
                ))}
                {/* 5th front mirrors back — pad to match */}
                <div style={{ width: 22 }} />
              </div>
            </div>
            <div style={{ fontSize: 13, color: fullBoard ? C.green.fg : 'rgba(244,244,248,0.45)', fontFamily: DF, fontWeight: 700 }}>
              {fullBoard ? '✦ +30% to all Oblivion' : `${9 - totalFilled} slots to activate`}
            </div>
          </div>

          {/* Synergies & global mult */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              padding: '12px 14px', borderRadius: 14, flex: 1,
              border: `1px solid ${stats.activeSynergies > 0 ? C.blue.br : C.dim.br}`,
              background: stats.activeSynergies > 0 ? C.blue.bg : C.dim.bg,
            }}>
              <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(244,244,248,0.38)', fontFamily: DF, marginBottom: 4 }}>Active Synergies</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: stats.activeSynergies > 0 ? C.blue.fg : 'rgba(244,244,248,0.3)', fontFamily: DF }}>
                {stats.activeSynergies}
              </div>
            </div>
            <div style={{
              padding: '12px 14px', borderRadius: 14, flex: 1,
              border: `1px solid ${globalMult > 0 ? C.purple.br : C.dim.br}`,
              background: globalMult > 0 ? C.purple.bg : C.dim.bg,
            }}>
              <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(244,244,248,0.38)', fontFamily: DF, marginBottom: 4 }}>Global Oblivion Mult</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: globalMult > 0 ? C.purple.fg : 'rgba(244,244,248,0.3)', fontFamily: DF }}>
                {globalMult > 0 ? `+${Math.round(globalMult * 100)}%` : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary of all source categories */}
      <div>
        <SectionTitle label="All Oblivion Sources" accent={C.gold.fg} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            { icon: '🃏', label: 'Card Plays',         desc: 'Every card played generates Oblivion, amplified by Seraphim synergies.',     accent: C.gold   },
            { icon: '⛳',  label: 'Seraphim Attacks',  desc: 'Cooldown-gated attacks — Unsynergized always available, Synergized requires an Angel.',             accent: C.blue   },
            { icon: '✦',  label: 'Angel Attacks',     desc: 'Exalted Angel attacks deal ~3× a comparable Seraphim hit.',                   accent: C.gold   },
            { icon: '⊞',  label: 'Full Board Bonus',  desc: 'Fill all 9 board slots to activate a +30% multiplier on all Oblivion.',      accent: C.green  },
            { icon: '◈',  label: 'Cherubim Passives', desc: 'Cherubim in the back row grant ongoing per-card or on-expire bonuses.',       accent: C.purple },
            { icon: '∞',  label: 'Set Mechanics',     desc: 'Each set has unique stacks, cascades, or cashouts that multiply payouts.',    accent: C.red    },
          ].map(({ icon, label, desc, accent }) => (
            <div key={label} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '11px 13px', borderRadius: 12,
              border: `1px solid ${accent.br}`, background: accent.bg,
            }}>
              <div style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: accent.fg, fontFamily: DF, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(244,244,248,0.55)', lineHeight: 1.5, fontFamily: BF }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {boss.mode === 'active' && (
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          border: `1px solid ${C.red.br}`, background: C.red.bg,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, color: C.red.fg, fontFamily: DF, marginBottom: 5 }}>Boss Fight Active</div>
          <div style={{ fontSize: 12, color: 'rgba(244,244,248,0.62)', lineHeight: 1.55, fontFamily: BF }}>
            Boss fights have a higher Oblivion threshold. Focus on maximising your attacks — filling the board
            will be critical for clearing the damage check.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── attacks tab ─────────────────────────────────────────────────────────────

function AttacksTab() {
  const board = useStore(selectBoard);
  const stats = useStore(selectComputedStats);

  const frontUnits = board.frontSlots.filter(Boolean) as (SeraphimInstance | AngelInstance)[];
  const seraphims  = frontUnits.filter((u): u is SeraphimInstance => u.type === 'Seraphim');
  const angels     = frontUnits.filter((u): u is AngelInstance    => u.type === 'Angel');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Seraphim mechanics explanation */}
      <div>
        <SectionTitle label="Seraphim Attacks" accent={C.blue.fg} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SourceCard
            icon="⚔"
            title="Unsynergized Strike"
            subtitle="Always available once cooldown expires. Deals base attack Oblivion as soon as the cooldown clears."
            accent={C.blue}
            tags={['cooldown-gated', 'always available']}
          />
          <SourceCard
            icon="✾"
            title="Synergized Strike"
            subtitle="Requires an Angel on the front row. Higher base than Unsynergized — typically 2–2.5× the base."
            accent={C.blue}
            tags={['requires angel', 'higher base']}
          />

          {/* Patience formula card removed */}

          {/* Live Seraphim board */}
          {seraphims.length > 0 ? (
            <>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'rgba(244,244,248,0.35)', fontFamily: BF, marginTop: 4 }}>
                Your current Seraphim
              </div>
              {seraphims.map(ser => {
                const def = CardRegistry.get(ser.definitionId) as SeraphimDefinition | undefined;
                if (!def || def.type !== 'Seraphim') return null;
                return (
                  <SeraphimAttackRow
                    key={ser.instanceId}
                    instance={ser}
                    def={def}
                  />
                );
              })}
            </>
          ) : (
            <div style={{
              padding: '14px', borderRadius: 12, textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)',
              fontSize: 12, color: 'rgba(244,244,248,0.3)', fontFamily: BF, fontStyle: 'italic',
            }}>
              No Seraphim on the board — drag a Seraphim card onto a front slot to see live attack data.
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: C.dimLine }} />

      {/* Angel mechanics */}
      <div>
        <SectionTitle label="Angel Attacks" accent={C.gold.fg} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SourceCard
            icon="✦"
            title="Primary Attack"
            subtitle="Moderate-cost hit. Available once the Angel's cooldown expires. Solid sustained damage option."
            accent={C.gold}
            tags={['moderate cooldown', 'consistent damage']}
          />
          <SourceCard
            icon="◆"
            title="Exalted Attack"
            subtitle="Angels deal exalted hits worth approximately 3× what a comparable Seraphim would hit for. Longer cooldown — save for large Oblivion bursts."
            accent={C.gold}
            tags={['~3× seraphim power', 'longer cooldown', 'high burst']}
          />

          {angels.length > 0 ? (
            <>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'rgba(244,244,248,0.35)', fontFamily: BF, marginTop: 4 }}>
                Your current Angels
              </div>
              {angels.map(ang => {
                const def = CardRegistry.get(ang.definitionId) as AngelDefinition | undefined;
                if (!def || def.type !== 'Angel') return null;
                return (
                  <AngelAttackRow key={ang.instanceId} instance={ang} def={def} />
                );
              })}
            </>
          ) : (
            <div style={{
              padding: '14px', borderRadius: 12, textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)',
              fontSize: 12, color: 'rgba(244,244,248,0.3)', fontFamily: BF, fontStyle: 'italic',
            }}>
              No Angels on the board — summon an Angel (from hand, if unlocked) to see live attack data.
            </div>
          )}
        </div>
      </div>

      {/* Full board reminder */}
      <div style={{
        padding: '14px 16px', borderRadius: 14,
        border: `1px solid ${stats.fullBoardActive ? C.green.br : 'rgba(92,184,122,0.12)'}`,
        background: stats.fullBoardActive ? C.green.bg : 'rgba(255,255,255,0.03)',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, color: stats.fullBoardActive ? C.green.fg : 'rgba(244,244,248,0.35)', fontFamily: DF, marginBottom: 5 }}>
          {stats.fullBoardActive ? '✦ Full Board Bonus Active — All Attacks +30%' : 'Full Board Bonus Not Active'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(244,244,248,0.5)', lineHeight: 1.5, fontFamily: BF }}>
          The +30% full-board multiplier applies inside <code style={{ color: C.green.fg }}>grantOblivion</code> — meaning it boosts
          every attack's final payout, including Patience bonuses.
        </div>
      </div>
    </div>
  );
}

// ─── bonuses tab ─────────────────────────────────────────────────────────────

function BonusesTab() {
  const stats  = useStore(selectComputedStats);
  const board  = useStore(selectBoard);

  const cherubimCount  = board.backSlots.filter(Boolean).length;
  const filledFront    = board.frontSlots.filter(Boolean).length;
  const filledBack     = board.backSlots.filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      <div>
        <SectionTitle label="Board Bonuses" accent={C.green.fg} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SourceCard
            icon="⊞"
            title="Full Board Bonus  (+30%)"
            subtitle={`Fill all 5 front slots and all 4 back slots to activate a +30% multiplier that applies to every Oblivion payout — card plays, attacks, and cashouts. Currently ${filledFront} / 5 front, ${filledBack} / 4 back.`}
            value={stats.fullBoardActive ? '+30%' : 'Inactive'}
            accent={stats.fullBoardActive ? C.green : C.dim}
            tags={['applies globally', 'all sources', '5+4 slots']}
          />
          <SourceCard
            icon="◎"
            title={`Seraphim Synergy  (+${formatNumber(stats.oblivionPerCardBonus)} / card)`}
            subtitle="Active Seraphim whose element matches your element requirement contribute per-card Oblivion bonuses. The total stacks across all active Seraphim."
            value={`+${formatNumber(stats.oblivionPerCardBonus)}/card`}
            accent={stats.oblivionPerCardBonus > 0 ? C.blue : C.dim}
            tags={['per card play', 'stacks with board', 'element-gated']}
          />
          <SourceCard
            icon="★"
            title="Ophanim Bonus"
            subtitle={`Ophanim plays award bonus Oblivion when a synergised Seraphim with ophanim_bonus is active. Bonus: +${formatNumber(stats.ophanimOblivionBonus)} per Ophanim play.`}
            value={stats.ophanimOblivionBonus > 0 ? `+${formatNumber(stats.ophanimOblivionBonus)}/Ophanim` : '—'}
            accent={stats.ophanimOblivionBonus > 0 ? C.gold : C.dim}
          />
        </div>
      </div>

      <div>
        <SectionTitle label="Global Multiplier" accent={C.purple.fg} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SourceCard
            icon="⟳"
            title={`Global Oblivion Multiplier  ${stats.globalOblivionMult > 0 ? `+${Math.round(stats.globalOblivionMult * 100)}%` : 'Inactive'}`}
            subtitle="Certain Seraphim bonusType effects (power_amplifier, score_per_second) contribute to the global multiplier applied after all other Oblivion calculation. Stacks additively."
            value={stats.globalOblivionMult > 0 ? `+${Math.round(stats.globalOblivionMult * 100)}%` : '—'}
            accent={stats.globalOblivionMult > 0 ? C.purple : C.dim}
            tags={['applied last', 'additive stacking', 'power_amplifier type']}
          />
        </div>
      </div>

      <div>
        <SectionTitle label="Cherubim Passives" accent={C.purple.fg} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SourceCard
            icon="◈"
            title={`Back-row Cherubim  (${cherubimCount} / 4 active)`}
            subtitle="Cherubim cards placed in the back row provide persistent passive effects every time you play a card. Effects range from Oblivion-per-card to Ember generation and adjacency bonuses."
            accent={cherubimCount > 0 ? C.purple : C.dim}
            tags={['per card play', 'passive', 'back row only']}
          />
          <SourceCard
            icon="💧"
            title="cherubim_oblivion_per_card"
            subtitle="Directly adds flat Oblivion to every card play. One of the most reliable passive bonuses — look for Cherubim with this effect in your deck."
            accent={C.purple}
          />
          <SourceCard
            icon="⚡"
            title="cherubim_expire_bonus"
            subtitle="Grants an Oblivion burst when a Cherubim's durability reaches zero. Best used with decks that cycle Cherubim rapidly."
            accent={C.purple}
          />
          <SourceCard
            icon="◇"
            title="cherubim_adjacent_seraphim_bonus"
            subtitle="Grants a bonus to Seraphim that are in adjacent front slots. Position your Cherubim to maximise adjacency for your strongest Seraphim."
            accent={C.purple}
            tags={['positional', 'seraphim-linked']}
          />
        </div>
      </div>

      <div>
        <SectionTitle label="Set Mechanics (Cashouts)" accent={C.red.fg} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { set: 'Pyroabyss',       mech: 'Chroma Ember Ignite',        desc: 'Quadratic burst — Oblivion scales with embers². Maximise Chroma Ember count before igniting.', accent: C.red    },
            { set: 'Eternal Seas',    mech: 'Undertow Release',            desc: 'Base cards spend Undertow for same-turn burst, skim Foam into manual draw, and use Deepwake as the shared higher-rarity amplification overlay.', accent: C.blue   },
            { set: 'Butterfly Set',   mech: 'Wing Resonance',              desc: 'Butterfly Eternity and Infinite cards bank Wing Resonance, then cash it through current Spectrum and Formation for sharper payoff turns.', accent: C.purple },
            { set: 'Blazing Garden',  mech: 'Wild Pollen Seed',            desc: 'Eternal cards generate Wild Pollen, then seed effects convert it into direct Oblivion and Bloom-scaled score. Build Burn/Grove first, then cash out.', accent: C.red    },
            { set: 'Glass Absolute',  mech: 'Refraction Charge Conversion', desc: 'Build fragments first, then spend Refraction Charge for stronger Eternal/Infinite burst windows with queue or ledger riders.', accent: C.blue   },
            { set: 'Eternal / Inf.',  mech: 'Eternal Stack Cashout',       desc: "Each set's primary stack (e.g., Inferno Tier) converts to Oblivion on cashout cards.", accent: C.gold   },
          ].map(({ set, mech, desc, accent }) => (
            <div key={set} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '12px 14px', borderRadius: 12,
              border: `1px solid ${accent.br}`, background: accent.bg,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: accent.fg, fontFamily: DF }}>{set}</span>
                  <span style={{ fontSize: 10, color: 'rgba(244,244,248,0.4)', fontFamily: BF }}>·</span>
                  <span style={{ fontSize: 10, color: 'rgba(244,244,248,0.55)', fontFamily: BF }}>{mech}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(244,244,248,0.55)', lineHeight: 1.5, fontFamily: BF }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── tips tab ────────────────────────────────────────────────────────────────

function TipsTab() {
  const stats = useStore(selectComputedStats);
  const board = useStore(selectBoard);

  const filledFront   = board.frontSlots.filter(Boolean).length;
  const filledBack    = board.backSlots.filter(Boolean).length;
  const totalFilled   = filledFront + filledBack;
  const fullBoard     = stats.fullBoardActive;
  const noSynergies   = stats.activeSynergies === 0;
  const perCardBonus  = stats.oblivionPerCardBonus;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Priority alerts — contextual */}
      {(!fullBoard || noSynergies) && (
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          border: `1px solid ${C.red.br}`, background: C.red.bg,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, color: C.red.fg, fontFamily: DF, marginBottom: 8 }}>
            ⚠ Immediate Opportunities
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {!fullBoard && (
              <div style={{ fontSize: 12, color: 'rgba(244,244,248,0.72)', fontFamily: BF }}>
                → <strong style={{ color: C.green.fg }}>Fill {9 - totalFilled} more slot{9 - totalFilled !== 1 ? 's' : ''}</strong> to activate the +30% Full Board Bonus — the single largest multiplier available this turn.
              </div>
            )}
            {noSynergies && (
              <div style={{ fontSize: 12, color: 'rgba(244,244,248,0.72)', fontFamily: BF }}>
                → <strong style={{ color: C.blue.fg }}>No Seraphim synergies active.</strong> Play Seraphim matching your deck's element, or place a Seraphim whose synergyRequirement matches your front-row Angel, to unlock per-card bonuses.
              </div>
            )}
          </div>
        </div>
      )}

      <SectionTitle label="Strategic Tips" accent={C.gold.fg} />

      <TipCard
        rank={1}
        title="Fill All 9 Board Slots First"
        detail="The Full Board Bonus (+30%) is a global multiplier that compounds every other source. Prioritise getting 5 Seraphim/Angels on the front row and 4 Cherubim on the back row before optimising individual card choices."
        accent={C.green.fg}
      />
      <TipCard
        rank={2}
        title="Save Exalted Angel Attacks for Maximum Burst"
        detail="Exalted hits deal ~3× a comparable Seraphim's full hit. Don't waste Exalted on low-multiplier turns. Use them when Full Board Bonus is active and your Global Multiplier is highest."
        accent={C.gold.fg}
      />
      <TipCard
        rank={3}
        title="Activate Seraphim Synergy Before Attacking"
        detail="Synergized attacks have a far higher base than Unsynergized. Ensure an Angel of the right element is on the board before triggering your Seraphim's main attack. Check the coloured element stripe on each Seraphim card."
        accent={C.blue.fg}
      />
      <TipCard
        rank={4}
        title="Match Cherubim to Your Seraphim Layout"
        detail={`Current per-card bonus: +${formatNumber(perCardBonus)}. Increase it by placing Cherubim with cherubim_oblivion_per_card or cherubim_adjacent_seraphim_bonus adjacent to your strongest active Seraphim.`}
        accent={C.purple.fg}
      />
      <TipCard
        rank={5}
        title="Time Your Set Mechanic Cashouts"
        detail="Set mechanics (Eternal Stacks, Chroma Embers, Refraction Charge, etc.) produce disproportionate Oblivion when cashed out at high counts. Hold off triggering cashout cards until your stack is large, then combine with Full Board Bonus for the biggest burst possible."
        accent={C.red.fg}
      />
      <TipCard
        rank={6}
        title="Cycle Cherubim for Expire Bonuses"
        detail="Cherubim with cherubim_expire_bonus detonate on death, granting Oblivion bursts. Some decks intentionally let Cherubim expire to chain detonations — play cards that reduce durability slowly unless you are in the middle of a burst window."
        accent={C.gold.fg}
      />
      <TipCard
        rank={7}
        title="Upgrade to Higher-Rarity Attacks"
        detail="Legendary and Eternal Seraphim have significantly higher base attack values, which amplifies the Patience multiplier. Even a small increase in base Oblivion compounds across every attack and Patience stack."
        accent={C.blue.fg}
      />
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export interface OblivionAcquisitionScreenProps {
  onClose: () => void;
}

type Tab = 'overview' | 'attacks' | 'bonuses' | 'tips';

const TABS: Array<{ id: Tab; label: string; accent: string }> = [
  { id: 'overview', label: 'Overview',  accent: C.gold.fg   },
  { id: 'attacks',  label: 'Attacks',   accent: C.blue.fg   },
  { id: 'bonuses',  label: 'Bonuses',   accent: C.green.fg  },
  { id: 'tips',     label: 'Tips',      accent: C.purple.fg },
];

export default function OblivionAcquisitionScreen({ onClose }: OblivionAcquisitionScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="anim-backdrop-fade"
      role="dialog"
      aria-label="Oblivion Acquisition"
      style={{
        position: 'fixed', inset: 0,
        background: C.backdrop,
        backdropFilter: 'blur(8px)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(14px, 3vh, 28px)',
        fontFamily: BF,
        pointerEvents: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Nebula blobs */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-8%', width: '55%', height: '60%', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(247,192,74,0.06) 0%, transparent 65%)', animation: 'obAcqNebulaA 14s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-12%', right: '-6%', width: '50%', height: '55%', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(104,179,240,0.05) 0%, transparent 65%)', animation: 'obAcqNebulaB 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '30%', right: '5%', width: '30%', height: '40%', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(184,125,232,0.04) 0%, transparent 65%)', animation: 'obAcqNebulaC 22s ease-in-out infinite' }} />
      </div>

      <style>{`
        @keyframes obAcqNebulaA {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(20px,-14px) scale(1.06); }
        }
        @keyframes obAcqNebulaB {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-18px,12px) scale(1.04); }
        }
        @keyframes obAcqNebulaC {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(10px,18px) scale(0.95); }
        }
        @keyframes obAcqPillGlow {
          0%,100% { box-shadow: none; }
          50%      { box-shadow: 0 0 28px rgba(247,192,74,0.22); }
        }
        @keyframes obAcqTitleShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Panel */}
      <div
        className="anim-panel-slide-up"
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 900,
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          borderRadius: 22,
          border: C.panelBorder,
          background: C.panelBg,
          boxShadow: C.panelShadow,
          overflow: 'hidden',
        }}
      >
        {/* ── header ── */}
        <div style={{
          padding: '22px 28px 0',
          flexShrink: 0,
          background: 'linear-gradient(180deg, rgba(247,192,74,0.07) 0%, transparent 100%)',
          borderBottom: `1px solid ${C.dimLine}`,
          paddingBottom: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              {/* Micro label */}
              <div style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(244,244,248,0.35)', fontFamily: BF, marginBottom: 6 }}>
                Reference · In-game Guide
              </div>
              {/* Main title */}
              <h1 style={{
                margin: 0, padding: 0,
                fontSize: 'clamp(22px, 3vw, 30px)',
                fontFamily: DF, fontWeight: 800, letterSpacing: 2,
                background: 'linear-gradient(90deg, #f7c04a 0%, #fce09a 30%, #f7c04a 55%, #e8a832 80%, #fce09a 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'obAcqTitleShimmer 5s linear infinite',
              }}>
                ◈ Oblivion Acquisition
              </h1>
              <div style={{ fontSize: 12, color: 'rgba(244,244,248,0.40)', fontFamily: BF, marginTop: 4 }}>
                All sources, multipliers, and strategies — updated live from your board.
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 36, height: 36, borderRadius: 999, flexShrink: 0,
                border: '1px solid rgba(244,244,248,0.16)',
                background: 'rgba(244,244,248,0.07)',
                color: 'rgba(244,244,248,0.7)',
                cursor: 'pointer', fontSize: 18, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(247,192,74,0.18)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(247,192,74,0.45)';
                (e.currentTarget as HTMLButtonElement).style.color = '#f7c04a';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,244,248,0.07)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(244,244,248,0.16)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(244,244,248,0.7)';
              }}
            >
              ✕
            </button>
          </div>

          {/* Tab row */}
          <div style={{ display: 'flex', gap: 6, paddingBottom: 16 }}>
            {TABS.map(tab => (
              <TabButton
                key={tab.id}
                label={tab.label}
                active={activeTab === tab.id}
                accent={tab.accent}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </div>

        {/* ── content area ── */}
        <div
          className="ornate-scroll"
          key={activeTab}
          style={{
            flex: 1, overflowY: 'auto', minHeight: 0,
            padding: '24px 28px 32px',
            animation: 'obAcqNebulaC 0.22s ease both',
          }}
        >
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'attacks'  && <AttacksTab  />}
          {activeTab === 'bonuses'  && <BonusesTab  />}
          {activeTab === 'tips'     && <TipsTab     />}
        </div>

        {/* ── footer ── */}
        <div style={{
          padding: '12px 28px',
          borderTop: `1px solid ${C.dimLine}`,
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.18)',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(244,244,248,0.25)', fontFamily: BF, letterSpacing: 0.5 }}>
            Press <kbd style={{ padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(244,244,248,0.18)', background: 'rgba(255,255,255,0.05)', fontSize: 9 }}>ESC</kbd> or click outside to close
          </div>
          <div style={{ fontSize: 10, color: 'rgba(244,244,248,0.22)', fontFamily: BF, letterSpacing: 0.4 }}>
            Data refreshes live from your board state
          </div>
        </div>
      </div>
    </div>
  );
}
