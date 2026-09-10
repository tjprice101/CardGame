/**
 * OblivionAcquisitionScreen — full-screen reference overlay explaining every
 * source of Oblivion in the game.  Opened via the ◈ button in TopStatusBar.
 *
 * Four tabs:
 *   Overview  – live board stats (earned this turn, active bonuses)
 *   Attacks   – Light Ain/Soph and Ain Soph Aur Bridge breakdown
 *   Bonuses   – Triune scaling sources and charge/flip economy
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
  selectProgress,
} from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { AIN_SOPH_AUR_SUMMON_STACK_REWARD, SOPH_FLIP_CHARGE_REQUIRED } from '@/systems/cards/AinSophRuntime';
import { resolveCardScaling } from '@/systems/cards/CardScaling';
import { computeGlobalResonanceScore } from '@/systems/progression/cardMastery';
import { formatNumber } from '@/utils/bignum';
import { uiTypography } from '@/ui/theme';
import type {
  AinSophAurDefinition,
  AinSophAurInstance,
  LightCardDefinition,
  MainDeckBoardInstance,
  StackCostDefinition,
} from '@/types/cards';

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

function previewStackCost(cost: StackCostDefinition | undefined, stacks: number): number {
  if (!cost) return 0;
  if (cost.kind === 'percentage') return Math.ceil(stacks * ((cost.value ?? 0) / 100));
  if (cost.kind === 'range') return Math.max(0, cost.min ?? 0);
  return Math.max(0, cost.value ?? 0);
}

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

function LightAttackRow({ instance, def }: {
  instance: MainDeckBoardInstance; def: LightCardDefinition;
}) {
  const turn = useStore(selectTurn);
  const board = useStore(selectBoard);
  const progress = useStore(selectProgress);
  const scalingContext = {
    limitlessLightStacks: turn.limitlessLightStacks,
    asaFrontCount: board.frontSlots.filter(slot => slot?.type === 'AinSophAur').length,
    collectionPower: computeGlobalResonanceScore(progress),
  };
  const ainCd = instance.attackCooldowns?.[def.ainAttack.id] ?? 0;
  const sophCd = instance.attackCooldowns?.[def.sophAttack.id] ?? 0;
  const isActive = instance.side === 'ain' && instance.faceState === 'front';
  const sophCost = previewStackCost(def.sophAttack.stackCost, turn.limitlessLightStacks);
  const attackRows = [
    {
      label: 'Ain Attack',
      value: Math.max(0, Math.round(def.ainAttack.baseOblivion + resolveCardScaling(def.ainAttack.scaling, scalingContext))),
      cd: ainCd,
      ready: isActive && ainCd <= 0,
      cost: 0,
    },
    {
      label: 'Soph Attack',
      value: Math.max(0, Math.round(def.sophAttack.baseOblivion + resolveCardScaling(def.sophAttack.scaling, scalingContext) + sophCost)),
      cd: sophCd,
      ready: isActive && sophCd <= 0 && turn.limitlessLightStacks >= sophCost,
      cost: sophCost,
    },
  ];

  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${C.blue.br}`,
      background: C.blue.bg, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${C.dimLine}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.blue.fg, fontFamily: DF }}>{def.name}</div>
          <div style={{ fontSize: 10, color: 'rgba(244,244,248,0.4)', fontFamily: BF, letterSpacing: 0.5 }}>
            {isActive ? '✦ Ain side — attacks online' : `○ Soph side — charge ${instance.limitlessCharge ?? 0}/${SOPH_FLIP_CHARGE_REQUIRED}`}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {attackRows.map((a, i) => (
          <div key={a.label} style={{
            padding: '10px 14px',
            borderLeft: i === 1 ? `1px solid ${C.dimLine}` : undefined,
          }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(244,244,248,0.38)', fontFamily: DF, marginBottom: 4 }}>{a.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: a.ready ? C.blue.fg : 'rgba(244,244,248,0.35)', fontFamily: DF }}>
              {formatNumber(a.value)}
            </div>
            <div style={{ fontSize: 9, color: a.ready ? C.green.fg : 'rgba(244,244,248,0.35)', marginTop: 4, fontFamily: BF }}>
              {!isActive ? 'Flip to Ain first' : a.cd > 0 ? `Cooldown: ${a.cd} cards` : turn.limitlessLightStacks < a.cost ? `Need ${a.cost} Stacks` : '● Ready'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AsaBridgeRow({ instance, def }: { instance: AinSophAurInstance; def: AinSophAurDefinition }) {
  const turn = useStore(selectTurn);
  const board = useStore(selectBoard);
  const progress = useStore(selectProgress);
  const bridge = def.bridgeAttack;
  if (!bridge) return null;
  const bridgeCd = instance.attackCooldowns?.[bridge.id] ?? 0;
  const bridgeCost = previewStackCost(bridge.consumesStacks, turn.limitlessLightStacks);
  const bridgeValue = Math.max(0, Math.round(bridge.baseOblivion + resolveCardScaling(bridge.scaling, {
    limitlessLightStacks: turn.limitlessLightStacks,
    asaFrontCount: board.frontSlots.filter(slot => slot?.type === 'AinSophAur').length,
    collectionPower: computeGlobalResonanceScore(progress),
  }) + bridgeCost));
  const ready = bridgeCd <= 0 && turn.limitlessLightStacks >= bridgeCost;

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
          <div style={{ fontSize: 10, color: 'rgba(244,244,248,0.4)', fontFamily: BF }}>Ain Soph Aur · {def.rarity}</div>
        </div>
        <div style={{
          fontSize: 9, padding: '3px 8px', borderRadius: 999,
          background: `${C.gold.fg}1a`, border: `1px solid ${C.gold.br}`,
          color: C.gold.fg, letterSpacing: 0.8, fontFamily: BF,
        }}>
          Bridge the Light
        </div>
      </div>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(244,244,248,0.38)', fontFamily: DF, marginBottom: 4 }}>Current Divine Light</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: ready ? C.gold.fg : 'rgba(244,244,248,0.35)', fontFamily: DF }}>
          {formatNumber(bridgeValue)}
        </div>
        <div style={{ fontSize: 9, color: ready ? C.green.fg : 'rgba(244,244,248,0.35)', marginTop: 6, fontFamily: BF }}>
          {bridgeCd > 0 ? `Cooldown: ${bridgeCd} cards` : turn.limitlessLightStacks < bridgeCost ? `Need ${bridgeCost} Stacks` : '● Ready'}
        </div>
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
  const globalMult  = stats.globalOblivionMult;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Live stat pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        <StatPill label="Total Divine Light" value={oblivion} accent={C.gold.fg} glow />
        <StatPill label="Earned This Turn" value={turn.oblivionEarnedThisTurn ?? 0} accent={C.blue.fg} />
        <StatPill label="Limitless Light" value={`${formatNumber(turn.limitlessLightStacks)} Stacks`} accent={C.green.fg} />
        <StatPill label="Board Slots" value={`${totalFilled}/9 Filled`} accent={C.green.fg} />
      </div>

      {/* Quick board status */}
      <div>
        <SectionTitle label="Board Status" accent={C.blue.fg} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {/* Board fill */}
          <div style={{
            padding: '14px', borderRadius: 14,
            border: `1px solid ${C.green.br}`,
            background: C.green.bg,
          }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: C.green.fg, fontFamily: DF, marginBottom: 6 }}>
              Board Occupancy
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
            <div style={{ fontSize: 13, color: C.green.fg, fontFamily: DF, fontWeight: 700 }}>
              {`${totalFilled}/9 slots filled`}
            </div>
          </div>

          {/* Synergies & global mult */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              padding: '12px 14px', borderRadius: 14, flex: 1,
              border: `1px solid ${stats.asaSummoned > 0 ? C.blue.br : C.dim.br}`,
              background: stats.asaSummoned > 0 ? C.blue.bg : C.dim.bg,
            }}>
              <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(244,244,248,0.38)', fontFamily: DF, marginBottom: 4 }}>Ain Soph Aur Summoned</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: stats.asaSummoned > 0 ? C.blue.fg : 'rgba(244,244,248,0.3)', fontFamily: DF }}>
                {stats.asaSummoned}
              </div>
            </div>
            <div style={{
              padding: '12px 14px', borderRadius: 14, flex: 1,
              border: `1px solid ${globalMult > 0 ? C.purple.br : C.dim.br}`,
              background: globalMult > 0 ? C.purple.bg : C.dim.bg,
            }}>
              <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(244,244,248,0.38)', fontFamily: DF, marginBottom: 4 }}>Global Divine Light Mult</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: globalMult > 0 ? C.purple.fg : 'rgba(244,244,248,0.3)', fontFamily: DF }}>
                {globalMult > 0 ? `+${Math.round(globalMult * 100)}%` : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary of all source categories */}
      <div>
        <SectionTitle label="All Divine Light Sources" accent={C.gold.fg} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            { icon: '⚔',  label: 'Ain Attacks',       desc: 'Cooldown-gated attacks on flipped Light cards. Read your stacks without spending them.', accent: C.blue   },
            { icon: '✾',  label: 'Soph Attacks',      desc: 'Higher base payout, consumes Limitless Light Stacks measured before the cost is paid.',  accent: C.blue   },
            { icon: '✦',  label: 'Bridge the Light',  desc: 'Ain Soph Aur front-row attacks — the highest base payouts available.',                    accent: C.gold   },
            { icon: '☠',  label: 'Sacrifice',         desc: 'Sacrifice a charged Soph card to convert its charge straight into Divine Light.',             accent: C.red    },
            { icon: '◈',  label: 'Collection Power',  desc: 'A permanent share of every attack’s scaling, earned by playing and mastering cards.',     accent: C.purple },
            { icon: '∞',  label: 'Limitless Light',   desc: 'Flip charged cards to bank stacks, then spend or scale off them the same turn.',          accent: C.green  },
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
            Boss fights have a higher Divine Light threshold. Focus on maximising attack sequencing and set-mechanic
            cashouts to clear the damage check.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── attacks tab ─────────────────────────────────────────────────────────────

function AttacksTab() {
  const board = useStore(selectBoard);

  const lightUnits = board.backSlots.filter(
    (u): u is MainDeckBoardInstance => !!u && u.type === 'Light',
  );
  const asaUnits = board.frontSlots.filter(
    (u): u is AinSophAurInstance => !!u && u.type === 'AinSophAur',
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Light card attacks */}
      <div>
        <SectionTitle label="Light Card Attacks" accent={C.blue.fg} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SourceCard
            icon="⚔"
            title="Ain Attack"
            subtitle="Available on its own cooldown once the card is flipped to its Ain side. Reads your Limitless Light Stacks without consuming any."
            accent={C.blue}
            tags={['cooldown-gated', 'spends nothing']}
          />
          <SourceCard
            icon="✾"
            title="Soph Attack"
            subtitle="Higher base payout, but consumes Limitless Light Stacks. Stacks are measured before the cost is paid, so spending never shrinks this attack's own payout."
            accent={C.blue}
            tags={['consumes stacks', 'higher base']}
          />
          <SourceCard
            icon="◈"
            title="Triune Scaling"
            subtitle="Every attack's bonus is split evenly across Limitless Light Stacks, summoned Ain Soph Aur, and Collection Power — so a deep collection raises your floor even on a thin board."
            accent={C.purple}
            tags={['stacks', 'ain soph aur', 'collection power']}
          />

          {lightUnits.length > 0 ? (
            <>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'rgba(244,244,248,0.35)', fontFamily: BF, marginTop: 4 }}>
                Your current Light cards
              </div>
              {lightUnits.map(unit => {
                const def = CardRegistry.get(unit.definitionId);
                if (!def || def.type !== 'Light') return null;
                return (
                  <LightAttackRow
                    key={unit.instanceId}
                    instance={unit}
                    def={def as LightCardDefinition}
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
              No Light cards on the board — play one into a back slot to see live attack data.
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: C.dimLine }} />

      {/* Ain Soph Aur */}
      <div>
        <SectionTitle label="Bridge the Light" accent={C.gold.fg} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SourceCard
            icon="✦"
            title="Ain Soph Aur Bridge"
            subtitle="Each summoned Ain Soph Aur gains a unique Bridge the Light attack on its own cooldown. Highest base payouts in the game."
            accent={C.gold}
            tags={['front row only', 'highest base']}
          />
          <SourceCard
            icon="+"
            title="Summon Stack"
            subtitle={`Every Ain Soph Aur grants +${AIN_SOPH_AUR_SUMMON_STACK_REWARD} Limitless Light Stack as soon as its summon resolves.`}
            accent={C.gold}
            tags={['on summon', 'stack gain']}
          />
          <SourceCard
            icon="◆"
            title="Summon Pressure"
            subtitle="Every Ain Soph Aur you hold on the front row also raises the Soph Attack and Bridge payouts of everything else on your board."
            accent={C.gold}
            tags={['board-wide scaling', 'up to 4']}
          />

          {asaUnits.length > 0 ? (
            <>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'rgba(244,244,248,0.35)', fontFamily: BF, marginTop: 4 }}>
                Your current Ain Soph Aur
              </div>
              {asaUnits.map(unit => {
                const def = CardRegistry.get(unit.definitionId);
                if (!def || def.type !== 'AinSophAur') return null;
                return (
                  <AsaBridgeRow key={unit.instanceId} instance={unit} def={def as AinSophAurDefinition} />
                );
              })}
            </>
          ) : (
            <div style={{
              padding: '14px', borderRadius: 12, textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)',
              fontSize: 12, color: 'rgba(244,244,248,0.3)', fontFamily: BF, fontStyle: 'italic',
            }}>
              No Ain Soph Aur summoned — sacrifice back-row cards from the Extra Deck view to summon one.
            </div>
          )}
        </div>
      </div>

      <div style={{
        padding: '14px 16px', borderRadius: 14,
        border: `1px solid ${C.blue.br}`,
        background: C.blue.bg,
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, color: C.blue.fg, fontFamily: DF, marginBottom: 5 }}>
          Attack Payout Note
        </div>
        <div style={{ fontSize: 12, color: 'rgba(244,244,248,0.5)', lineHeight: 1.5, fontFamily: BF }}>
          Attack payouts come from each attack's authored base value, live board buffs, and explicit set mechanics.
        </div>
      </div>
    </div>
  );
}

// ─── bonuses tab ─────────────────────────────────────────────────────────────

function BonusesTab() {
  const stats = useStore(selectComputedStats);
  const board = useStore(selectBoard);
  const turn = useStore(selectTurn);

  const asaCount = board.frontSlots.filter(u => u?.type === 'AinSophAur').length;
  const chargedCount = board.backSlots.filter(
    u => !!u && (u.limitlessCharge ?? 0) >= SOPH_FLIP_CHARGE_REQUIRED,
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      <div>
        <SectionTitle label="Triune Attack Scaling" accent={C.green.fg} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SourceCard
            icon="∞"
            title={`Limitless Light Stacks  (${turn.limitlessLightStacks} banked)`}
            subtitle="Flip a charged card to bank its charge as stacks. One third of every attack's scaling bonus comes from your stack count, measured before any cost is paid."
            value={`${turn.limitlessLightStacks}`}
            accent={turn.limitlessLightStacks > 0 ? C.green : C.dim}
            tags={['per turn', 'resets at turn end']}
          />
          <SourceCard
            icon="✦"
            title={`Summoned Ain Soph Aur  (${asaCount} / 4)`}
            subtitle="Each Ain Soph Aur held on the front row contributes a share of every Soph Attack and Bridge payout across your whole board."
            value={`${asaCount} / 4`}
            accent={asaCount > 0 ? C.gold : C.dim}
            tags={['front row', 'board-wide']}
          />
          <SourceCard
            icon="◈"
            title={`Collection Power  ×${(1 + stats.globalOblivionMult).toFixed(2)}`}
            subtitle="Earned permanently by playing and mastering cards. Contributes the final third of every attack's scaling, so it raises your damage floor on every turn regardless of board state."
            value={`×${(1 + stats.globalOblivionMult).toFixed(2)}`}
            accent={stats.globalOblivionMult > 0 ? C.purple : C.dim}
            tags={['permanent', 'cross-turn', 'applied last']}
          />
        </div>
      </div>

      <div>
        <SectionTitle label="Charge & Flip" accent={C.blue.fg} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SourceCard
            icon="◇"
            title={`Cards Ready to Flip  (${chargedCount})`}
            subtitle={`Every card you play from hand adds +1 Limitless Charge to each face-down card on your board. At ${SOPH_FLIP_CHARGE_REQUIRED} charge a card can be flipped to its Ain side or sacrificed outright.`}
            value={`${chargedCount}`}
            accent={chargedCount > 0 ? C.blue : C.dim}
            tags={['+1 per hand play', 'threshold 5']}
          />
          <SourceCard
            icon="☠"
            title="Sacrifice for Divine Light"
            subtitle="Instead of flipping, discard a charged card to convert its stored charge straight into Divine Light at that card's own sacrifice rate. Best when you cannot use another attack this turn."
            accent={C.red}
            tags={['instant payout', 'no cooldown']}
          />
          <SourceCard
            icon="⟳"
            title="Turn End Wipe"
            subtitle="At turn end the whole board, your hand, all charges, and all Limitless Light Stacks reset. Only Divine Light and your collection carry across runs."
            accent={C.dim}
            tags={['divine light persists', 'everything else resets']}
          />
        </div>
      </div>
    </div>
  );
}

// ─── tips tab ────────────────────────────────────────────────────────────────

function TipsTab() {
  const board = useStore(selectBoard);
  const turn = useStore(selectTurn);

  const asaCount = board.frontSlots.filter(u => u?.type === 'AinSophAur').length;
  const readyToFlip = board.backSlots.filter(
    u => !!u && (u.limitlessCharge ?? 0) >= SOPH_FLIP_CHARGE_REQUIRED,
  ).length;
  const noStacks = turn.limitlessLightStacks === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Priority alerts — contextual */}
      {(readyToFlip > 0 || noStacks) && (
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          border: `1px solid ${C.red.br}`, background: C.red.bg,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, color: C.red.fg, fontFamily: DF, marginBottom: 8 }}>
            ⚠ Immediate Opportunities
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {readyToFlip > 0 && (
              <div style={{ fontSize: 12, color: 'rgba(244,244,248,0.72)', fontFamily: BF }}>
                → <strong style={{ color: C.blue.fg }}>{readyToFlip} card{readyToFlip === 1 ? '' : 's'} ready to flip.</strong> Flip to bank the charge as Limitless Light Stacks, or sacrifice for immediate Divine Light.
              </div>
            )}
            {noStacks && (
              <div style={{ fontSize: 12, color: 'rgba(244,244,248,0.72)', fontFamily: BF }}>
                → <strong style={{ color: C.green.fg }}>No Limitless Light Stacks banked.</strong> Attacks are running on Collection Power alone — flip a charged card to unlock the other two thirds of your scaling.
              </div>
            )}
          </div>
        </div>
      )}

      <SectionTitle label="Strategic Tips" accent={C.gold.fg} />

      <TipCard
        rank={1}
        title="Play Cheap Cards First to Charge the Board"
        detail="Every card played from hand adds +1 charge to every face-down card at once. Dumping several low-impact cards early charges your whole back row in parallel, rather than one card at a time."
        accent={C.green.fg}
      />
      <TipCard
        rank={2}
        title="Bank Stacks Before You Spend Them"
        detail="Attack scaling reads your stack total before the cost is deducted, so flipping several cards before attacking raises every attack that turn — including the one paying the cost."
        accent={C.blue.fg}
      />
      <TipCard
        rank={3}
        title={`Summon Ain Soph Aur Early  (${asaCount} / 4 up)`}
        detail={`Each Ain Soph Aur on the front row raises every Soph Attack and Bridge payout, and each successful summon immediately grants +${AIN_SOPH_AUR_SUMMON_STACK_REWARD} Limitless Light Stack.`}
        accent={C.gold.fg}
      />
      <TipCard
        rank={4}
        title="Sacrifice When You Cannot Attack"
        detail="If a charged card has no useful attack window left this turn, sacrificing it converts its charge straight into Divine Light with no cooldown. A flip you never cash in is wasted at turn end."
        accent={C.red.fg}
      />
      <TipCard
        rank={5}
        title="Use Ain Attacks to Preserve Stacks"
        detail="Ain Attacks read your stacks without consuming them. Fire every ready Ain Attack before spending stacks on a Soph Attack to squeeze the most out of a single pool."
        accent={C.blue.fg}
      />
      <TipCard
        rank={6}
        title="Place Dark Cards on the Side You Need"
        detail="Right-click a Dark card to place it face-up on Ain for immediate access to its utility. Left-click it onto Soph when you want it to accumulate charge first."
        accent={C.purple.fg}
      />
      <TipCard
        rank={7}
        title="Grow Collection Power for a Permanent Floor"
        detail="Collection Power is one third of every attack's scaling and never resets. Playing and mastering more unique cards raises your baseline payout on every future turn, even before you build a board."
        accent={C.purple.fg}
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
      aria-label="Divine Light Acquisition"
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
                ◈ Divine Light Acquisition
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
