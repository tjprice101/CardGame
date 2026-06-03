import { useState, useEffect, useMemo, useRef } from 'react';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import CardEngineCallout from '@/ui/components/CardEngineCallout';
import { getCardBackgroundUrl } from '@/ui/cardBackgrounds';
import { useStore, selectBoard, selectBossFight, selectCanEmbraceInfinite, selectDeck, selectTurn } from '@/state/store';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { CardRegistry } from '@/cards/CardRegistry';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import {
  cardFacePalette,
  getAdaptiveDescriptionMetrics,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { getCardPreviewText } from '@/ui/cardStatSummary';
import { highlightRulesText } from '@/ui/text/highlightRulesText';
import { getSetEngineSnapshotForCard } from '@/ui/setEngineSummary';
import { getActionClassLabel, getCardActionClass } from '@/systems/cards/ActionClass';
import { uiTypography, warmTheme } from '@/ui/theme';
import { ELEMENT_COLORS, ELEMENT_SET_NAMES, isSnowboundCard } from '@/data/elements';
import type { DeckCard } from '@/types/game';
import { isDeathFlamedHellBaseDefinitionId } from '@/utils/cardFaces';
import type {
  AngelDefinition,
  AngelAttackSet,
  AngelInstance,
  CherubimInstance,
  CherubimDefinition,
  SeraphimDefinition,
  SeraphimAttackSet,
  SeraphimInstance,
} from '@/types/cards';

const SLOT_W = 118;
const SLOT_H = 168;
const CHERUBIM_W = 104;
const CHERUBIM_H = 148;
const FRONT_ROW_GAP = 'clamp(12px, 1.4vw, 18px)';
const BACK_ROW_GAP = `calc(${FRONT_ROW_GAP} + ${SLOT_W - CHERUBIM_W}px)`;
const ROW_SEPARATION = 'clamp(14px, 2vh, 24px)';
const BACK_ROW_STAGGER = `calc(${SLOT_W - CHERUBIM_W / 2}px + (${FRONT_ROW_GAP} / 2))`;
const ATTACK_PANEL_WIDTH = 'min(900px, 94vw)';
const FRONT_FACE_METRICS = getCardFaceMetrics('board');
const CHERUBIM_FACE_METRICS = getCardFaceMetrics('boardMini');
const ATTACK_CARD_FACE_METRICS = getCardFaceMetrics('compact');
const DISPLAY_FONT = uiTypography.display;
const BODY_FONT = uiTypography.body;
const ATTACK_MODAL_BACKDROP = 'radial-gradient(circle at 14% 12%, rgba(227, 150, 82, 0.22) 0%, rgba(227, 150, 82, 0) 36%), radial-gradient(circle at 86% 22%, rgba(173, 126, 82, 0.18) 0%, rgba(173, 126, 82, 0) 34%), rgba(8, 7, 8, 0.8)';
const ATTACK_MODAL_PANEL_BG = 'linear-gradient(180deg, rgba(248, 240, 225, 0.98) 0%, rgba(240, 224, 198, 0.96) 100%)';
const ATTACK_MODAL_PANEL_BORDER = '1px solid rgba(138, 94, 58, 0.42)';
const ATTACK_MODAL_PANEL_SHADOW = '0 26px 48px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.4)';

function getSeraphimUiAttacks(def: SeraphimDefinition) {
  if (def.attacks) return scaleSeraphimUiAttackSet(def.attacks, def.rarity);

  const crest = def.name.split(' ').slice(0, 2).join(' ') || def.name;
  const bonusLabelByType: Record<string, string> = {
    oblivion_per_card: 'steady per-card pressure',
    chain_bonus: 'accelerated chain growth',
    ophanim_bonus: 'Ophanim-linked burst conversion',
    cherubim_extra_plays: 'expanded Cherubim sequencing',
    cherubim_expire_bonus: 'Cherubim expiry detonations',
    pyro_heat_per_card: 'ember overflow scaling',
    power_amplifier: 'board power amplification',
    score_per_second: 'passive score accumulation',
    resource_generation: 'resource generation pressure',
    tick_acceleration: 'faster system cadence',
  };

  const elementLabelByElement: Record<string, string> = {
    Neutrality: 'null-law',
    Fire: 'emberforged',
    Light: 'luminous',
    Dark: 'blackglass',
    Prismatic: 'prismatic',
    Mechanical: 'clockwork',
    Thornbound: 'thornbound',
  };

  const firstOnPlay = def.onPlayEffects[0]?.type ?? 'board_setup';
  const onPlayLeadByType: Record<string, string> = {
    draw: 'draw tempo',
    oblivion_flat: 'immediate Oblivion injection',
    chain_gain: 'draw tempo conversion',
    chain_multiplier_set: 'oblivion scaling setup',
    multiply_next: 'next-card amplification',
    salvage_any: 'discard reclamation',
    look_top_take: 'topdeck sculpting',
    look_top_take_drop: 'selection routing',
    conditional: 'conditional conversion',
    prismatic_light_gain: 'prismatic light growth',
    monochromatic_shards_gain: 'shard accumulation',
    arctic_charge_gain: 'arctic charge build',
    bloom_gain: 'bloom growth',
    pyro_heat_gain: 'ember loading',
    radiance_gain: 'radiance loading',
    trail_gain: 'trail loading',
    strain_gain: 'strain loading',
    overclock: 'overclock priming',
  };

  const bonusPitch = bonusLabelByType[def.baseStats.bonusType] ?? 'board scaling';
  const elementPitch = elementLabelByElement[def.element] ?? 'arcane';
  const onPlayPitch = onPlayLeadByType[firstOnPlay] ?? 'setup momentum';
  const baseOblivion = Math.max(90, Math.round(80 + def.baseStats.bonusValue * 2.2));
  const unsyncedCooldown = def.rarity === 'Legendary' || def.rarity === 'Eternal' || def.rarity === 'Infinite' ? 4 : 3;

  const attacks: SeraphimAttackSet = {
    unsynergized: {
      id: `${def.definitionId}:unsynergized`,
      label: 'Unsynergized',
      name: `${crest} Vector Break`,
      description: `${def.name} executes a ${elementPitch} opener that leans on ${onPlayPitch} and converts into ${bonusPitch}.`,
      baseOblivion,
      cooldownCards: unsyncedCooldown,
      costs: [],
      tags: ['seraphim', 'unsynergized', def.element.toLowerCase()],
    },
    synergized: {
      id: `${def.definitionId}:synergized`,
      label: 'Synergized',
      name: `${crest} Angelic Verdict`,
      description: `With an Angel aligned, ${def.name} escalates into its ${elementPitch} finisher and over-converts ${bonusPitch}.`,
      baseOblivion: Math.round(baseOblivion * 1.95),
      cooldownCards: unsyncedCooldown + 2,
      costs: [],
      requiresAngelOnBoard: true,
      tags: ['seraphim', 'synergized', def.element.toLowerCase()],
    },
  };

  return scaleSeraphimUiAttackSet(attacks, def.rarity);
}

function getAngelUiAttacks(def: AngelDefinition) {
  if (def.attacks) return scaleAngelUiAttackSet(def.attacks, def.rarity);

  const crest = def.name.split(' ').slice(0, 2).join(' ') || def.name;
  const auraByBonusType: Record<string, string> = {
    oblivion_per_card: 'steady field pressure',
    chain_bonus: 'momentum acceleration',
    ophanim_bonus: 'Ophanim-linked burst pressure',
    power_per_seraphim: 'seraphim-linked scaling',
    oblivion_per_seraphim: 'formation-linked conversion',
  };
  const aura = auraByBonusType[def.baseStats.bonusType] ?? 'battlefield pressure';
  const summonTax = Math.max(1, def.summonCost.length);
  const baseOblivion = Math.max(150, Math.round(140 + def.baseStats.bonusValue * 2 + summonTax * 28));

  const attacks: AngelAttackSet = {
    primary: {
      id: `${def.definitionId}:primary`,
      label: 'Primary',
      name: `${crest} Ordinance`,
      description: `${def.name} applies disciplined pressure and stabilizes your ${aura}.`,
      baseOblivion,
      cooldownCards: summonTax + 2,
      costs: [],
      tags: ['angel', 'primary', def.element.toLowerCase()],
    },
    exalted: {
      id: `${def.definitionId}:exalted`,
      label: 'Exalted',
      name: `${crest} Throne Decree`,
      description: `Exalted channel of ${def.activatedAbility.name}; converts ${aura} into a decisive finisher window.`,
      baseOblivion: Math.round(baseOblivion * 2.05),
      cooldownCards: summonTax + 5,
      costs: [],
      tags: ['angel', 'exalted', def.element.toLowerCase()],
    },
  };

  return scaleAngelUiAttackSet(attacks, def.rarity);
}

function getHighTierUiAttackBaseScale(rarity: SeraphimDefinition['rarity'] | AngelDefinition['rarity']): number {
  if (rarity === 'Infinite') return 0.45;
  if (rarity === 'Eternal') return 0.5;
  return 1;
}

function scaleSeraphimUiAttackSet(attacks: SeraphimAttackSet, rarity: SeraphimDefinition['rarity']): SeraphimAttackSet {
  const scale = getHighTierUiAttackBaseScale(rarity);
  if (scale === 1) return attacks;
  return {
    ...attacks,
    unsynergized: {
      ...attacks.unsynergized,
      baseOblivion: Math.max(1, Math.round(attacks.unsynergized.baseOblivion * scale)),
    },
    synergized: {
      ...attacks.synergized,
      baseOblivion: Math.max(1, Math.round(attacks.synergized.baseOblivion * scale)),
    },
  };
}

function scaleAngelUiAttackSet(attacks: AngelAttackSet, rarity: AngelDefinition['rarity']): AngelAttackSet {
  const scale = getHighTierUiAttackBaseScale(rarity);
  if (scale === 1) return attacks;
  return {
    ...attacks,
    primary: {
      ...attacks.primary,
      baseOblivion: Math.max(1, Math.round(attacks.primary.baseOblivion * scale)),
    },
    exalted: {
      ...attacks.exalted,
      baseOblivion: Math.max(1, Math.round(attacks.exalted.baseOblivion * scale)),
    },
  };
}

function getAttackCostCount(
  costs: ReadonlyArray<{ type: string; value: number }> | undefined,
  costType: string,
): number {
  return (costs ?? [])
    .filter(cost => cost.type === costType)
    .reduce((sum, cost) => sum + cost.value, 0);
}

function hasRequiredAttackResources(
  costs: ReadonlyArray<{ type: string; value: number }> | undefined,
  resources: { pyroHeat: number; radiance: number; trail: number; strain: number },
): boolean {
  const pyroHeatCost = getAttackCostCount(costs, 'spend_pyro_heat');
  const radianceCost = getAttackCostCount(costs, 'spend_radiance');
  const trailCost = getAttackCostCount(costs, 'spend_trail');
  const strainCost = getAttackCostCount(costs, 'spend_strain');

  return resources.pyroHeat >= pyroHeatCost
    && resources.radiance >= radianceCost
    && resources.trail >= trailCost
    && resources.strain >= strainCost;
}

function toggleSelectedId(current: string[], id: string, maxCount: number): string[] {
  if (current.includes(id)) return current.filter(value => value !== id);
  if (maxCount <= 0) return current;
  if (current.length >= maxCount) return [...current.slice(1), id];
  return [...current, id];
}

function renderPrismaticBadge(depth?: number, tokens?: number) {
  if (depth === undefined && (tokens ?? 0) <= 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 7,
      right: 7,
      zIndex: 8,
      padding: '2px 6px',
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.36)',
      background: 'rgba(19, 16, 20, 0.76)',
      color: 'rgba(255,255,255,0.94)',
      fontSize: 9,
      lineHeight: 1,
      letterSpacing: 0.5,
      fontFamily: DISPLAY_FONT,
      fontWeight: 700,
      pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`D${depth ?? '?'} / T${tokens ?? 0}`}
    </div>
  );
}

function renderBurningGardenBadge(phase?: string, counters?: number, isEcho?: boolean) {
  if (!phase && (counters ?? 0) <= 0 && !isEcho) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 7,
      left: 7,
      zIndex: 8,
      padding: '2px 6px',
      borderRadius: 999,
      border: '1px solid rgba(255,214,180,0.34)',
      background: phase === 'Burn' ? 'rgba(93, 30, 10, 0.82)' : 'rgba(34, 66, 30, 0.72)',
      color: 'rgba(255,246,233,0.96)',
      fontSize: 9,
      lineHeight: 1,
      letterSpacing: 0.45,
      fontFamily: DISPLAY_FONT,
      fontWeight: 700,
      pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`${phase ?? 'Bloom'}${isEcho ? ' Echo' : ''} · C${counters ?? 0}`}
    </div>
  );
}

interface PendingAngelAttack {
  slot: 0 | 1 | 2 | 3 | 4;
  attackId: 'primary' | 'exalted';
  title: string;
  description: string;
}

interface PendingSeraphimAttack {
  slot: 0 | 1 | 2 | 3 | 4;
  attackId: 'unsynergized' | 'synergized';
  title: string;
  description: string;
}

function renderPatienceBadge(stacks: number) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 7,
      left: 7,
      zIndex: 8,
      padding: '2px 6px',
      borderRadius: 999,
      border: '1px solid rgba(166,198,255,0.38)',
      background: 'rgba(18, 16, 30, 0.82)',
      color: 'rgba(200,218,255,0.96)',
      fontSize: 9,
      lineHeight: 1,
      letterSpacing: 0.5,
      fontFamily: DISPLAY_FONT,
      fontWeight: 700,
      pointerEvents: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
    }}>
      {`⬡ ${stacks}`}
    </div>
  );
}

function renderVesselBadge() {
  return (
    <div style={{
      position: 'absolute',
      bottom: 7,
      right: 7,
      zIndex: 8,
      padding: '2px 6px',
      borderRadius: 999,
      border: '1px solid rgba(180,210,255,0.55)',
      background: 'rgba(36, 58, 148, 0.90)',
      color: 'rgba(220,234,255,0.98)',
      fontSize: 9,
      lineHeight: 1,
      letterSpacing: 0.8,
      fontFamily: DISPLAY_FONT,
      fontWeight: 700,
      pointerEvents: 'none',
      boxShadow: '0 2px 10px rgba(80,130,255,0.4)',
      animation: 'boardFocusPulse 2s ease-in-out infinite',
    }}>
      VESSEL
    </div>
  );
}

function renderSnowboundBadge(phase?: 'Frost' | 'Voltage' | null, arcticCharge?: number) {
  if (!phase && (arcticCharge ?? 0) <= 0) return null;
  const isFrost = phase !== 'Voltage';
  return (
    <div style={{
      position: 'absolute', top: 7, left: 7, zIndex: 8,
      padding: '2px 6px', borderRadius: 999,
      border: `1px solid ${isFrost ? 'rgba(135,206,235,0.38)' : 'rgba(245,230,60,0.38)'}`,
      background: isFrost ? 'rgba(10, 40, 80, 0.82)' : 'rgba(55, 50, 5, 0.82)',
      color: isFrost ? 'rgba(175,225,255,0.96)' : 'rgba(255,240,100,0.96)',
      fontSize: 9, lineHeight: 1, letterSpacing: 0.45,
      fontFamily: DISPLAY_FONT, fontWeight: 700, pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`${phase ?? 'Frost'} · AC${arcticCharge ?? 0}`}
    </div>
  );
}

function renderForgeBadge(
  charges?: number,
  cap?: number,
  pearls?: number,
  recastLedger?: Array<{ instanceId: string; imprintStacks?: number }> | undefined,
  instanceId?: string,
) {
  const imprintTotal = (recastLedger ?? []).reduce((sum, entry) => sum + Math.max(0, entry.imprintStacks ?? 0), 0);
  const localImprint = instanceId
    ? (recastLedger ?? [])
        .filter(entry => entry.instanceId === instanceId)
        .reduce((sum, entry) => sum + Math.max(0, entry.imprintStacks ?? 0), 0)
    : 0;
  if ((charges ?? 0) <= 0 && (pearls ?? 0) <= 0 && imprintTotal <= 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 7, left: 7, zIndex: 8,
      padding: '2px 6px', borderRadius: 999,
      border: '1px solid rgba(184,162,109,0.38)',
      background: 'rgba(30, 20, 8, 0.82)',
      color: 'rgba(220,195,140,0.96)',
      fontSize: 9, lineHeight: 1, letterSpacing: 0.45,
      fontFamily: DISPLAY_FONT, fontWeight: 700, pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`Charges ${charges ?? 0}/${cap ?? 5}${(pearls ?? 0) > 0 ? ` · Pearls ${pearls}` : ''}${imprintTotal > 0 ? ` · Imp ${imprintTotal}` : ''}${localImprint > 0 ? ` · This ${localImprint}` : ''}`}
    </div>
  );
}

function renderSeasBadge(
  rarity: string | undefined,
  undertow?: number,
  foam?: number,
  deepwake?: number,
) {
  const isBase = rarity === 'Common' || rarity === 'Rare' || rarity === 'Epic' || rarity === 'Legendary';
  if (isBase) {
    if ((undertow ?? 0) <= 0 && (foam ?? 0) <= 0) return null;
    return (
      <div style={{
        position: 'absolute', top: 7, left: 7, zIndex: 8,
        padding: '2px 6px', borderRadius: 999,
        border: '1px solid rgba(102,217,240,0.42)',
        background: 'rgba(6, 34, 47, 0.86)',
        color: 'rgba(215,248,255,0.96)',
        fontSize: 9, lineHeight: 1, letterSpacing: 0.45,
        fontFamily: DISPLAY_FONT, fontWeight: 700, pointerEvents: 'none',
        boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
      }}>
        {`Und ${undertow ?? 0} · Fm ${foam ?? 0}`}
      </div>
    );
  }

  if ((undertow ?? 0) <= 0 && (foam ?? 0) <= 0 && (deepwake ?? 0) <= 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 7, left: 7, zIndex: 8,
      padding: '2px 6px', borderRadius: 999,
      border: '1px solid rgba(120,225,245,0.44)',
      background: 'rgba(8, 36, 52, 0.88)',
      color: 'rgba(220,250,255,0.97)',
      fontSize: 9, lineHeight: 1, letterSpacing: 0.45,
      fontFamily: DISPLAY_FONT, fontWeight: 700, pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`Und ${undertow ?? 0} · Fm ${foam ?? 0} · Dw ${deepwake ?? 0}`}
    </div>
  );
}

function renderBlackGlassBadge(white?: number, black?: number, fracture?: number) {
  if ((white ?? 0) <= 0 && (black ?? 0) <= 0 && (fracture ?? 0) <= 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 7, left: 7, zIndex: 8,
      padding: '2px 6px', borderRadius: 999,
      border: '1px solid rgba(180,160,190,0.32)',
      background: 'rgba(10, 6, 14, 0.86)',
      color: 'rgba(220,210,230,0.94)',
      fontSize: 9, lineHeight: 1, letterSpacing: 0.45,
      fontFamily: DISPLAY_FONT, fontWeight: 700, pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`W${white ?? 0}/B${black ?? 0}${(fracture ?? 0) > 0 ? ` · F${fracture}` : ''}`}
    </div>
  );
}

function renderButterflyBadge(formation?: number, spectrum?: number, flutterLevel?: number) {
  const hasSignal = (formation ?? 0) > 0 || (spectrum ?? 0) > 0 || (flutterLevel ?? 0) > 0;
  if (!hasSignal) return null;
  return (
    <div style={{
      position: 'absolute', top: 7, left: 7, zIndex: 8,
      padding: '2px 6px', borderRadius: 999,
      border: '1px solid rgba(155,183,255,0.38)',
      background: 'rgba(20, 14, 48, 0.82)',
      color: 'rgba(195,210,255,0.96)',
      fontSize: 9, lineHeight: 1, letterSpacing: 0.45,
      fontFamily: DISPLAY_FONT, fontWeight: 700, pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`F${formation ?? 0}${(spectrum ?? 0) > 0 ? ` · S${spectrum}` : ''}${(flutterLevel ?? 0) > 0 ? ` · T${flutterLevel}` : ''}`}
    </div>
  );
}

function renderLightBadge(radiance?: number, resonance?: number) {
  if ((radiance ?? 0) <= 0 && (resonance ?? 0) <= 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 7, left: 7, zIndex: 8,
      padding: '2px 6px', borderRadius: 999,
      border: '1px solid rgba(255,215,0,0.38)',
      background: 'rgba(48, 38, 4, 0.82)',
      color: 'rgba(255,235,150,0.96)',
      fontSize: 9, lineHeight: 1, letterSpacing: 0.45,
      fontFamily: DISPLAY_FONT, fontWeight: 700, pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`R${radiance ?? 0}${(resonance ?? 0) > 0 ? ` · Cad${resonance}` : ''}`}
    </div>
  );
}

function renderThornboundBadge(trail?: number, scar?: number) {
  if ((trail ?? 0) <= 0 && (scar ?? 0) <= 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 7, left: 7, zIndex: 8,
      padding: '2px 6px', borderRadius: 999,
      border: '1px solid rgba(182,48,48,0.38)',
      background: 'rgba(28, 8, 8, 0.82)',
      color: 'rgba(230,180,180,0.96)',
      fontSize: 9, lineHeight: 1, letterSpacing: 0.45,
      fontFamily: DISPLAY_FONT, fontWeight: 700, pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`Trail ${trail ?? 0} · Scar ${scar ?? 0}`}
    </div>
  );
}

function renderMechanicalBadge(strain?: number) {
  if ((strain ?? 0) <= 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 7, left: 7, zIndex: 8,
      padding: '2px 6px', borderRadius: 999,
      border: '1px solid rgba(240,160,24,0.38)',
      background: 'rgba(24, 18, 4, 0.82)',
      color: 'rgba(255,200,100,0.96)',
      fontSize: 9, lineHeight: 1, letterSpacing: 0.45,
      fontFamily: DISPLAY_FONT, fontWeight: 700, pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`Strain ${strain}`}
    </div>
  );
}

function renderWuasBadge(starlight?: number, dreamLattice?: number) {
  if ((starlight ?? 0) <= 0 && (dreamLattice ?? 0) <= 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 7, left: 7, zIndex: 8,
      padding: '2px 6px', borderRadius: 999,
      border: '1px solid rgba(184,200,232,0.38)',
      background: 'rgba(16, 12, 32, 0.82)',
      color: 'rgba(210,220,255,0.96)',
      fontSize: 9, lineHeight: 1, letterSpacing: 0.45,
      fontFamily: DISPLAY_FONT, fontWeight: 700, pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`St${starlight ?? 0}${(dreamLattice ?? 0) > 0 ? ` · DL${dreamLattice}` : ''}`}
    </div>
  );
}

function renderDeathFlamedHellBadge(pyreStacks?: number) {
  if ((pyreStacks ?? 0) <= 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 7, left: 7, zIndex: 8,
      padding: '2px 6px', borderRadius: 999,
      border: '1px solid rgba(192,24,24,0.42)',
      background: 'rgba(28, 4, 4, 0.86)',
      color: 'rgba(255,160,120,0.96)',
      fontSize: 9, lineHeight: 1, letterSpacing: 0.45,
      fontFamily: DISPLAY_FONT, fontWeight: 700, pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`Pyre ${pyreStacks}`}
    </div>
  );
}

function renderFireBadge(infernoTiers?: number, chromaEmbers?: number) {
  if ((infernoTiers ?? 0) <= 0 && (chromaEmbers ?? 0) <= 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 7, left: 7, zIndex: 8,
      padding: '2px 6px', borderRadius: 999,
      border: '1px solid rgba(176,74,255,0.38)',
      background: 'rgba(22, 6, 32, 0.82)',
      color: 'rgba(210,160,255,0.96)',
      fontSize: 9, lineHeight: 1, letterSpacing: 0.45,
      fontFamily: DISPLAY_FONT, fontWeight: 700, pointerEvents: 'none',
      boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
    }}>
      {`Tier ${infernoTiers ?? 0}${(chromaEmbers ?? 0) > 0 ? ` · Ember ${chromaEmbers}` : ''}`}
    </div>
  );
}

function formatAttackCosts(costs: ReadonlyArray<{ type: string; value: number }> | undefined): string {
  if (!costs || costs.length === 0) return 'No additional cost';
  return costs.map(cost => `${cost.type.replace(/_/g, ' ')} ${cost.value}`).join(', ');
}

function formatAttackSummary(attack: {
  baseOblivion: number;
  cooldownCards: number;
  costs?: ReadonlyArray<{ type: string; value: number }>;
  requiresAngelOnBoard?: boolean;
  tags?: ReadonlyArray<string>;
}): string {
  const requirement = attack.requiresAngelOnBoard ? 'Requires Angel on board · ' : '';
  const isFire = (attack.tags ?? []).some(tag => tag.toLowerCase() === 'fire');
  const fireText = isFire
    ? ' · +2.5%/Heat (max +75%) · Spend up to 5 Heat: +1% per Heat spent (max +5%)'
    : '';
  return `${requirement}Base ${attack.baseOblivion} · Cooldown ${attack.cooldownCards} cards · Cost ${formatAttackCosts(attack.costs)}${fireText}`;
}

export default function BoardDisplay() {
  useThemeVersion();
  const board = useStore(selectBoard);
  const bossFight     = useStore(selectBossFight);
  const canEmbraceInfinite = useStore(selectCanEmbraceInfinite);
  const deck = useStore(selectDeck);
  const turn = useStore(selectTurn);
  const {
    removeSeraphim,
    placeSeraphimFromHand,
    placeCherubim,
    removeCherubim,
    playCard,
    embraceInfinite,
    echoEmberGroveCard,
    igniteBurningGardenCard,
    activateAngel,
    activateSeraphimAttack,
    activateAngelAttack,
    toggleCardFace,
  } = useStore.getState();

  const hand = deck.hand;

  // Memoize hand-type checks to avoid O(n) CardRegistry scans on every render
  const { hasSeraphimInHand, hasCherubimInHand } = useMemo(() => ({
    hasSeraphimInHand: hand.some(c => CardRegistry.get(c.definitionId)?.type === 'Seraphim'),
    hasCherubimInHand: hand.some(c => CardRegistry.get(c.definitionId)?.type === 'Cherubim'),
  }), [hand]);
  const hasEmberGroveCards = (board.emberGrove?.length ?? 0) > 0;
  const canPlay = turn.phase === 'playing';

  const prevSlotsRef = useRef(board.frontSlots);
  const [lastPlacedInstanceId, setLastPlacedInstanceId] = useState<string | null>(null);
  const [dragOverFront, setDragOverFront] = useState<number | null>(null);
  const [dragOverBack, setDragOverBack] = useState<number | null>(null);
  const [hoveredFrontSlot, setHoveredFrontSlot] = useState<number | null>(null);
  const [hoveredBackSlot, setHoveredBackSlot] = useState<number | null>(null);
  const [attackPanelSlot, setAttackPanelSlot] = useState<number | null>(null);
  const [selectedDiscardIds, setSelectedDiscardIds] = useState<string[]>([]);
  const [selectedSacrificeSeraphimIds, setSelectedSacrificeSeraphimIds] = useState<string[]>([]);
  const [selectedSacrificeAngelIds, setSelectedSacrificeAngelIds] = useState<string[]>([]);
  const [pendingAngelAttack, setPendingAngelAttack] = useState<PendingAngelAttack | null>(null);
  const [pendingSeraphimAttack, setPendingSeraphimAttack] = useState<PendingSeraphimAttack | null>(null);

  useEffect(() => {
    const prev = prevSlotsRef.current;
    const curr = board.frontSlots;
    for (let i = 0; i < 5; i++) {
      if (!prev[i] && curr[i]) {
        setLastPlacedInstanceId(curr[i]!.instanceId);
        const t = setTimeout(() => setLastPlacedInstanceId(null), 500);
        return () => clearTimeout(t);
      }
    }
    prevSlotsRef.current = curr;
  }, [board.frontSlots]);

  useEffect(() => {
    prevSlotsRef.current = board.frontSlots;
  });

  // Preload card art for all board slots whenever slots change, so holofoil
  // and card images don't stutter on first hover or zoom.
  useEffect(() => {
    const allSlots = [...board.frontSlots, ...board.backSlots];
    for (const slot of allSlots) {
      if (!slot) continue;
      const def = CardRegistry.get(slot.definitionId);
      if (!def) continue;
      const url = getCardBackgroundUrl(def);
      if (url) { const img = new Image(); img.src = url; }
    }
  }, [board.frontSlots, board.backSlots]);

  function handleFrontSlotClick(slotIndex: 0 | 1 | 2 | 3 | 4) {
    const slot = board.frontSlots[slotIndex];
    if (slot?.type === 'Seraphim') {
      if (canPlay) {
        setAttackPanelSlot(prev => prev === slotIndex ? null : slotIndex);
      } else {
        removeSeraphim(slotIndex);
      }
    } else if (slot?.type === 'Angel') {
      if (canPlay) {
        setAttackPanelSlot(prev => prev === slotIndex ? null : slotIndex);
      }
    } else if (!slot && canPlay && hasSeraphimInHand) {
      placeSeraphimFromHand(slotIndex);
      setAttackPanelSlot(null);
    }
  }

  function handleBackSlotClick(backSlot: 0 | 1 | 2 | 3) {
    const cherubim = board.backSlots[backSlot];
    if (cherubim) {
      const cherubimDef = CardRegistry.get(cherubim.definitionId);
      if (cherubimDef?.element === 'BlazingGarden' && cherubim.burningGardenPhase !== 'Burn') {
        igniteBurningGardenCard(cherubim.instanceId);
      } else {
        removeCherubim(backSlot);
      }
    } else if (canPlay && hasCherubimInHand) {
      const backCard = hand.find(c => CardRegistry.get(c.definitionId)?.type === 'Cherubim');
      if (backCard) {
        const firstEmpty = board.backSlots.findIndex(s => s === null);
        if (firstEmpty === backSlot) {
          playCard(backCard.instanceId);
        } else {
          placeCherubim(backSlot);
        }
      }
    }
  }

  const selectedFront = attackPanelSlot !== null ? board.frontSlots[attackPanelSlot] : null;
  const selectedDef = selectedFront ? CardRegistry.get(selectedFront.definitionId) : null;

  const getBoardFocusPalette = (element: string | undefined) => {
    if (element === 'Neutrality') {
      return {
        rim: 'rgba(166, 198, 255, 0.96)',
        glow: 'rgba(136, 173, 245, 0.48)',
        corner: 'rgba(218, 232, 255, 0.96)',
        sweep: 'linear-gradient(110deg, transparent 22%, rgba(178, 206, 255, 0.64) 48%, rgba(102, 146, 232, 0.5) 62%, transparent 86%)',
      };
    }

    return {
      rim: 'rgba(255, 178, 112, 0.96)',
      glow: 'rgba(242, 132, 78, 0.46)',
      corner: 'rgba(255, 228, 196, 0.96)',
      sweep: 'linear-gradient(110deg, transparent 22%, rgba(255, 230, 184, 0.66) 48%, rgba(242, 138, 92, 0.5) 62%, transparent 86%)',
    };
  };

  const renderBoardFocusOverlay = (radius: number, element: string | undefined) => {
    const palette = getBoardFocusPalette(element);
    const corners = [
      { top: 5, left: 5 },
      { top: 5, right: 5 },
      { bottom: 5, left: 5 },
      { bottom: 5, right: 5 },
    ];

    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        borderRadius: radius,
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          boxShadow: `inset 0 0 0 1px ${palette.rim}, inset 0 0 0 3px ${palette.glow}`,
          animation: 'boardFocusPulse 0.9s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          top: '-22%',
          bottom: '-22%',
          width: '64%',
          left: '-70%',
          background: palette.sweep,
          filter: 'blur(0.2px)',
          transform: 'skewX(-18deg)',
          animation: 'boardFocusSweep 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) infinite',
        }} />
        {corners.map((corner, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              width: 15,
              height: 15,
              borderTop: `2px solid ${palette.corner}`,
              borderLeft: `2px solid ${palette.corner}`,
              borderRadius: 2,
              opacity: 0.94,
              transform:
                corner.top !== undefined && corner.left !== undefined
                  ? 'none'
                  : corner.top !== undefined && corner.right !== undefined
                    ? 'scaleX(-1)'
                    : corner.bottom !== undefined && corner.left !== undefined
                      ? 'scaleY(-1)'
                      : 'scale(-1)',
              animation: 'boardFocusPulse 0.9s ease-in-out infinite',
              animationDelay: `${idx * 0.08}s`,
              ...corner,
            }}
          />
        ))}
      </div>
    );
  };

  const renderAttackCostCard = (
    card: Pick<DeckCard, 'definitionId' | 'finish'>,
    selected: boolean,
    actionLabel: string,
    accentColor: string,
  ) => {
    const def = CardRegistry.get(card.definitionId);
    return (
      <>
        <div style={getCardNameRibbonStyle('compact')}>
          <div style={{ fontSize: Math.max(8.8, ATTACK_CARD_FACE_METRICS.typeSize), color: '#5c3b2b', letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 2, fontFamily: DISPLAY_FONT, fontWeight: 700 }}>
            {def?.type ?? 'Card'}
          </div>
          <div style={{
            fontSize: Math.max(10.8, ATTACK_CARD_FACE_METRICS.nameSize),
            fontWeight: 'bold',
            color: '#2b1a12',
            textAlign: 'center',
            lineHeight: 1.15,
            fontFamily: DISPLAY_FONT,
          }}>
            {def?.name ?? card.definitionId}
          </div>
        </div>
        <div style={getCardRulesPanelStyle('compact')}>
          <div style={{
            fontSize: Math.max(9.2, ATTACK_CARD_FACE_METRICS.descSize),
            lineHeight: Math.max(1.3, ATTACK_CARD_FACE_METRICS.descLineHeight),
            WebkitLineClamp: ATTACK_CARD_FACE_METRICS.descLines,
            color: '#3a251b',
            textAlign: 'center',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontFamily: BODY_FONT,
          }}>
            {def ? highlightRulesText(getCardPreviewText(def, 2), { lightBg: true }) : ''}
          </div>
          <div style={{ fontSize: 9, color: selected ? accentColor : '#6f4734', marginTop: 5, textAlign: 'center', fontFamily: DISPLAY_FONT, letterSpacing: 0.4, fontWeight: 700 }}>
            {actionLabel}
          </div>
        </div>
      </>
    );
  };

  const selectableSeraphimSacrificeUnits = useMemo(
    () => board.frontSlots.filter(
      (unit): unit is SeraphimInstance => unit?.type === 'Seraphim' && unit.instanceId !== selectedFront?.instanceId,
    ),
    [board.frontSlots, selectedFront?.instanceId],
  );

  const selectableAngelSacrificeUnits = useMemo(
    () => board.frontSlots.filter(
      (unit): unit is AngelInstance => unit?.type === 'Angel' && unit.instanceId !== selectedFront?.instanceId,
    ),
    [board.frontSlots, selectedFront?.instanceId],
  );

  useEffect(() => {
    setSelectedDiscardIds([]);
    setSelectedSacrificeSeraphimIds([]);
    setSelectedSacrificeAngelIds([]);
    setPendingAngelAttack(null);
    setPendingSeraphimAttack(null);
  }, [attackPanelSlot, selectedFront?.instanceId, selectedDef?.definitionId]);

  const playfieldRightInset = 'var(--angel-drawer-hand-offset, 348px)';

  // Compute the hovered card definition for the immediate tooltip.
  // Suppress tooltip when the attack panel is open to avoid overlap.
  const boardHoveredCard =
    attackPanelSlot === null
      ? (hoveredFrontSlot !== null ? board.frontSlots[hoveredFrontSlot] : null) ??
        (hoveredBackSlot !== null ? board.backSlots[hoveredBackSlot] : null)
      : null;
  const boardHoveredDef = boardHoveredCard ? CardRegistry.get(boardHoveredCard.definitionId) ?? null : null;
  const boardHoveredActionClassLabel = boardHoveredDef ? getActionClassLabel(getCardActionClass(boardHoveredDef)) : null;
  const boardHoveredEngine = boardHoveredDef ? getSetEngineSnapshotForCard(boardHoveredDef, turn, board) : null;

  const BOARD_TOOLTIP_TYPE_COLORS: Record<string, string> = {
    Seraphim: '#FFD700',
    Ophanim: '#c888f0',
    Cherubim: '#b87de8',
    Angel: '#FFD700',
  };

  return (
    <div style={{
      position: 'absolute',
      left: 0,
      right: playfieldRightInset,
      top: bossFight.mode === 'active' ? 'clamp(160px, 16vh, 215px)' : 'clamp(146px, 15.5vh, 218px)',
      marginInline: 'auto',
      pointerEvents: 'none',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
      width: 'max-content',
    }}>
      {/* Immediate hover tooltip for board cards */}
      {boardHoveredDef && (
        <div style={{
          position: 'fixed',
          bottom: 200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 270,
          background: 'linear-gradient(180deg, rgba(247,239,226,0.995) 0%, rgba(235,218,190,0.99) 100%)',
          border: '1px solid rgba(138,94,58,0.5)',
          borderRadius: 14,
          padding: '14px 16px',
          pointerEvents: 'none',
          zIndex: 90,
          boxShadow: '0 22px 40px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.38)',
          backdropFilter: 'blur(10px)',
          fontFamily: BODY_FONT,
          animation: 'tooltipFadeIn 0.18s ease both',
        }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.55, marginBottom: 4, color: BOARD_TOOLTIP_TYPE_COLORS[boardHoveredDef.type] ?? '#aaa' }}>
            {getDisplayCardTypeLabel(boardHoveredDef.type)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: warmTheme.accentDeep, marginBottom: 8, lineHeight: 1.2 }}>
            {boardHoveredDef.name}
          </div>
          <div style={{ fontSize: 13, color: warmTheme.text, lineHeight: 1.6, marginBottom: 10 }}>
            <CardRulesDigest
              card={boardHoveredDef}
              variant="preview"
              maxSections={3}
              maxLinesPerSection={10}
              lineClamp={3}
              labelColor="rgba(74, 48, 21, 0.82)"
              textColor={warmTheme.accentDeep}
              sectionBackground="transparent"
              sectionBorder="transparent"
              lightBg={true}
            />
          </div>
          <CardEngineCallout card={boardHoveredDef} variant="detail" tone="light" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', fontSize: 10, color: 'rgba(58, 40, 24, 0.86)', lineHeight: 1.35, marginTop: 6 }}>
            <span style={{ color: ELEMENT_COLORS[boardHoveredDef.element] ?? '#aaa' }}>
              {ELEMENT_SET_NAMES[boardHoveredDef.element] ?? boardHoveredDef.element}
            </span>
            {boardHoveredActionClassLabel && (
              <span style={{ color: 'rgba(52, 36, 20, 0.94)' }}>
                Action Class: {boardHoveredActionClassLabel}
              </span>
            )}
            {boardHoveredEngine && (
              <span style={{ color: boardHoveredEngine.accent, fontWeight: 700 }}>
                {boardHoveredEngine.label} engine: {boardHoveredEngine.compact}
              </span>
            )}
          </div>
        </div>
      )}

      {canEmbraceInfinite && (
        <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'auto' }}>
          <button
            className="attack-embrace-button"
            onClick={embraceInfinite}
            style={{
              padding: '10px 22px',
              borderRadius: 999,
              border: '1px solid rgba(255,200,120,0.75)',
              background: 'linear-gradient(180deg, rgba(255,243,224,0.96), rgba(248,216,168,0.96))',
              color: '#6b3f18',
              fontSize: 13,
              fontWeight: 'bold',
              letterSpacing: 1.2,
              fontFamily: BODY_FONT,
              cursor: 'pointer',
              boxShadow: '0 10px 24px rgba(191,126,63,0.18)',
            }}
          >
            Embrace the Infinite
          </button>
          <div style={{ fontSize: 10, color: 'rgba(107,63,24,0.74)', letterSpacing: 0.4 }}>
            Gain 50 Oblivion per card, keep 3, reshuffle the rest.
          </div>
        </div>
      )}

      {hasEmberGroveCards && canPlay && (
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'auto' }}>
          <button
            className="attack-embrace-button"
            onClick={() => echoEmberGroveCard()}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid rgba(255,160,96,0.78)',
              background: 'linear-gradient(180deg, rgba(92,49,28,0.96), rgba(51,28,18,0.96))',
              color: '#ffe8cd',
              fontSize: 13,
              fontWeight: 'bold',
              letterSpacing: 1.1,
              fontFamily: BODY_FONT,
              cursor: 'pointer',
              boxShadow: '0 10px 24px rgba(146,72,38,0.18)',
            }}
          >
            Draw Echo from Ember Grove
          </button>
          <div style={{ fontSize: 10, color: 'rgba(255,224,200,0.78)', letterSpacing: 0.4 }}>
            One per turn. Returns a charred Burning Garden card to Bloom.
          </div>
        </div>
      )}

      {/* Front row: 5 Seraphim/Angel slots */}
      <div style={{
        display: 'flex',
        gap: FRONT_ROW_GAP,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {board.frontSlots.map((slot, i) => {
          const slotIndex = i as 0 | 1 | 2 | 3 | 4;
          const isNewlyPlaced = slot?.instanceId === lastPlacedInstanceId;
          const isDragTarget = dragOverFront === slotIndex && !slot && canPlay;

          if (slot?.type === 'Angel') {
            const angelDef = CardRegistry.get(slot.definitionId) as AngelDefinition | undefined;
            const angelAttacks = angelDef ? getAngelUiAttacks(angelDef) : null;
            const primaryCd = angelAttacks ? (slot.attackCooldowns?.[angelAttacks.primary.id] ?? 0) : 0;
            const exaltedCd = angelAttacks ? (slot.attackCooldowns?.[angelAttacks.exalted.id] ?? 0) : 0;
            const awakenRequirement = angelDef?.activatedAbility.cardsPlayedRequirement ?? 0;
            const progress = Math.min(slot.cardsPlayedSinceSummon, awakenRequirement);
            const hasAwakenRequirement = Boolean(angelDef) && !slot.activated && slot.cardsPlayedSinceSummon >= awakenRequirement;
            const canPayAwakenCost = Boolean(angelDef) && CardEffectExecutor.execute(
              { instanceId: slot.instanceId, definitionId: slot.definitionId, finish: slot.finish },
              turn,
              board,
              deck,
              false,
              {
                effects: angelDef?.activatedAbility.effects,
                countAsPlay: false,
                removeFromHand: false,
                useNextCardMultiplier: false,
              },
            ).canPlay;
            const isReady = hasAwakenRequirement && canPayAwakenCost;
            const statusText = slot.activated
              ? 'Awakened'
              : isReady
                ? 'Right-click'
                : hasAwakenRequirement
                  ? 'Insufficient resources'
                  : `Awaken ${progress}/${awakenRequirement}`;
            const detailText = slot.activated
              ? angelDef?.activatedAbility.name ?? 'Ability spent'
              : isReady
                ? angelDef?.activatedAbility.name ?? 'Ability ready'
                : angelDef?.activatedAbility.name ?? 'Awakening';
            const isHovered = hoveredFrontSlot === slotIndex;
            const isSelected = attackPanelSlot === slotIndex;
            const isFocused = isHovered || isSelected;
            const focusPalette = getBoardFocusPalette(angelDef?.element);
            const angelDescMetrics = getAdaptiveDescriptionMetrics('board', detailText);
            const angelElementColor = angelDef?.element ? (ELEMENT_COLORS[angelDef.element] ?? warmTheme.accent) : warmTheme.accent;
            return (
              <div
                className={[
                  isNewlyPlaced && angelDef?.element === 'Neutrality' ? 'anim-angel-summon-pop' : 'anim-angel-breath',
                  (slot.finish === 'holo' || angelDef?.rarity === 'Infinite' || angelDef?.rarity === 'Eternal')
                    ? `holofoil-live-card${angelDef?.rarity === 'Infinite' ? ' holofoil-live-card--infinite' : ''}${angelDef?.rarity === 'Eternal' ? ' holofoil-live-card--eternal' : ''}`
                    : undefined,
                ].filter(Boolean).join(' ')}
                onContextMenu={(event) => {
                  event.preventDefault();
                  if (canPlay && isReady) activateAngel(slotIndex);
                }}
                onClick={() => {
                  if (canPlay) setAttackPanelSlot(prev => prev === slotIndex ? null : slotIndex);
                }}
                onMouseEnter={() => setHoveredFrontSlot(slotIndex)}
                onMouseLeave={() => setHoveredFrontSlot(current => (current === slotIndex ? null : current))}
                title={slot.activated
                  ? `${angelDef?.name ?? 'Angel'} - awakened ability already used`
                  : isReady
                    ? `${angelDef?.name ?? 'Angel'} - right-click to activate ${angelDef?.activatedAbility.name ?? 'its awakened ability'}`
                    : `${angelDef?.name ?? 'Angel'} - awaken after ${awakenRequirement} cards played`}
                style={{
                  width: SLOT_W,
                  height: SLOT_H,
                  ...getCardFaceBackgroundStyle(angelDef, slot.finish, slot.faceState),
                  border: `2px solid ${isFocused ? focusPalette.rim : isReady ? warmTheme.accent : warmTheme.borderStrong}`,
                  borderRadius: 14,
                  boxShadow: isFocused
                    ? `0 0 0 1px ${focusPalette.rim}, 0 0 0 4px ${focusPalette.glow}, 0 0 26px ${focusPalette.glow}, ${cardFacePalette.shadow}`
                    : isReady
                      ? `${warmTheme.glow}, ${cardFacePalette.shadow}`
                      : `${warmTheme.shadow}, ${cardFacePalette.shadow}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  justifyContent: 'flex-start',
                  padding: 0,
                  fontFamily: BODY_FONT,
                  cursor: canPlay && isReady ? 'context-menu' : 'default',
                  pointerEvents: 'auto',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {angelDef && isDeathFlamedHellBaseDefinitionId(angelDef.definitionId) && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleCardFace(slot.instanceId);
                    }}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      zIndex: 15,
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: slot.faceState === 'back' ? 'rgba(28, 14, 10, 0.82)' : 'rgba(14, 8, 22, 0.72)',
                      color: slot.faceState === 'back' ? '#f1d6bf' : '#dcbcff',
                      fontSize: 9,
                      fontFamily: 'Georgia, serif',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    }}
                  >
                    {slot.faceState === 'back' ? 'Reveal' : 'Flip'}
                  </button>
                )}

                {/* Element top stripe */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${angelElementColor}cc, ${angelElementColor}, ${angelElementColor}cc, transparent)`, pointerEvents: 'none', zIndex: 10 }} />
                {renderBurningGardenBadge(angelDef?.element === 'BlazingGarden' ? slot.burningGardenPhase : undefined, slot.chromaticCounters, slot.isEcho)}
                {renderPrismaticBadge(angelDef?.prismaticDepth, slot.spectrumTokens)}
                {angelDef && isSnowboundCard(angelDef) && renderSnowboundBadge(turn.snowboundPhase, turn.arcticCharge)}
                {angelDef?.element === 'AbyssalForge' && renderForgeBadge(turn.reforgeCharges, turn.reforgeChargeCap, turn.pearls, turn.recastLedger, slot.instanceId)}
                {angelDef?.element === 'EternalSeas' && renderSeasBadge(angelDef?.rarity, turn.eternalSeasUndertow, turn.eternalSeasFoam, turn.secondaryCounters?.deepwake)}
                {angelDef?.element === 'Dark' && renderBlackGlassBadge(turn.blackGlassWhiteFlame, turn.blackGlassBlackFlame, turn.blackGlassFracture)}
                {angelDef?.element === 'Butterfly' && renderButterflyBadge(turn.butterflyFormation, turn.butterflySpectrum, turn.butterflyFlutterLevel)}
                {angelDef?.element === 'Light' && renderLightBadge(turn.radiance, turn.lightResonance)}
                {angelDef?.element === 'Thornbound' && renderThornboundBadge(turn.trail, turn.thornScar)}
                {angelDef?.element === 'Mechanical' && angelDef && !isSnowboundCard(angelDef) && renderMechanicalBadge(turn.strain)}
                {angelDef?.element === 'WishedUponAStar' && renderWuasBadge(turn.starlightCharges, turn.dreamLattice)}
                {angelDef?.element === 'DeathFlamedHell' && renderDeathFlamedHellBadge(turn.eternalStacks?.pyre)}
                {angelDef?.element === 'Fire' && renderFireBadge(turn.eternalStacks?.pyro, turn.secondaryCounters?.pyro)}
                <div style={getCardNameRibbonStyle('board')}>
                  <div style={{ fontSize: FRONT_FACE_METRICS.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center' }}>
                    Angel
                  </div>
                  <div style={{ fontSize: FRONT_FACE_METRICS.nameSize, fontWeight: 'bold', color: cardFacePalette.text, textAlign: 'center', lineHeight: 1.25, marginTop: 2 }}>
                    {angelDef?.name ?? 'Angel'}
                  </div>
                </div>
                <div style={getCardRulesPanelStyle('board')}>
                  <div style={{ fontSize: FRONT_FACE_METRICS.descSize, color: isReady ? warmTheme.success : cardFacePalette.textMuted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>
                    {statusText}
                  </div>
                  <div style={{
                    fontSize: angelDescMetrics.fontSize,
                    color: cardFacePalette.textSoft,
                    marginTop: 5,
                    lineHeight: angelDescMetrics.lineHeight,
                    textAlign: 'center',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: angelDescMetrics.lineClamp,
                    overflow: 'hidden',
                  }}>
                    {detailText}
                  </div>
                  <div style={{ fontSize: 7, color: cardFacePalette.textMuted, marginTop: 4, textAlign: 'center' }}>
                    Primary: {primaryCd <= 0 ? 'Ready' : primaryCd} · Exalted: {exaltedCd <= 0 ? 'Ready' : exaltedCd}
                  </div>
                  <div style={{ fontSize: 7, color: cardFacePalette.textMuted, marginTop: 6, lineHeight: 1.35, textAlign: 'center' }}>
                    {slot.activated
                      ? 'Awakened effect spent this turn.'
                      : isReady
                        ? 'Right-click to fire the awakened effect.'
                        : hasAwakenRequirement
                          ? 'Need effect costs before awakening.'
                          : `Charge ${progress}/${awakenRequirement}`}
                  </div>
                </div>
                {/* Patience stacks badge (bottom-left) */}
                {(slot.patienceStacks ?? 0) > 0 && renderPatienceBadge(slot.patienceStacks!)}
                {isFocused && (
                  renderBoardFocusOverlay(14, angelDef?.element)
                )}
              </div>
            );
          }

          if (slot?.type === 'Seraphim') {
            const serDef = CardRegistry.get(slot.definitionId) as SeraphimDefinition | undefined;
            const isActive = slot.isActive;
            const borderColor = isActive ? 'rgba(245, 245, 245, 0.95)' : 'rgba(16, 12, 12, 0.96)';
            const seraphimText = serDef
              ? getCardPreviewText(serDef, 2)
              : 'Its elemental bonus is live on the board.';
            const seraphimDescMetrics = getAdaptiveDescriptionMetrics('board', seraphimText);
            const attacks = serDef ? getSeraphimUiAttacks(serDef) : null;
            const unsyncedCd = attacks ? (slot.attackCooldowns?.[attacks.unsynergized.id] ?? 0) : 0;
            const syncedCd = attacks ? (slot.attackCooldowns?.[attacks.synergized.id] ?? 0) : 0;
            const hasAngel = board.frontSlots.some(front => front?.type === 'Angel');
            const isHovered = hoveredFrontSlot === slotIndex;
            const isSelected = attackPanelSlot === slotIndex;
            const isFocused = isHovered || isSelected;
            const focusPalette = getBoardFocusPalette(serDef?.element);
            const serElementColor = serDef?.element ? (ELEMENT_COLORS[serDef.element] ?? warmTheme.accent) : warmTheme.accent;

            return (
              <div
                className={[
                  isNewlyPlaced ? 'anim-seraphim-pop' : undefined,
                  isActive && !isNewlyPlaced ? 'anim-synergy-pulse' : undefined,
                  (slot.finish === 'holo' || serDef?.rarity === 'Infinite' || serDef?.rarity === 'Eternal')
                    ? `holofoil-live-card${serDef?.rarity === 'Infinite' ? ' holofoil-live-card--infinite' : ''}${serDef?.rarity === 'Eternal' ? ' holofoil-live-card--eternal' : ''}`
                    : undefined,
                ].filter(Boolean).join(' ') || undefined}
                style={{
                  width: SLOT_W,
                  height: SLOT_H,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  ...getCardFaceBackgroundStyle(serDef, slot.finish, slot.faceState),
                  border: `1px solid ${isFocused ? focusPalette.rim : borderColor}`,
                  borderRadius: 12,
                  boxShadow: isFocused
                    ? `0 0 0 1px ${focusPalette.rim}, 0 0 0 4px ${focusPalette.glow}, 0 0 24px ${focusPalette.glow}, ${cardFacePalette.shadow}`
                    : isActive
                      ? `${warmTheme.shadow}, 0 0 12px rgba(255, 255, 255, 0.72), 0 0 28px rgba(255, 255, 255, 0.38)`
                      : `${warmTheme.shadow}, 0 0 12px rgba(0, 0, 0, 0.72), 0 0 24px rgba(0, 0, 0, 0.55) inset`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  justifyContent: 'flex-start',
                  padding: 0,
                  overflow: 'hidden',
                  fontFamily: BODY_FONT,
                  transition: 'box-shadow 0.4s, border-color 0.4s',
                  position: 'relative',
                }}
                onClick={() => handleFrontSlotClick(slotIndex)}
                onMouseEnter={() => setHoveredFrontSlot(slotIndex)}
                onMouseLeave={() => setHoveredFrontSlot(current => (current === slotIndex ? null : current))}
                onContextMenu={(event) => {
                  event.preventDefault();
                  if (!canPlay) return;
                  if (serDef?.element === 'BlazingGarden' && slot.burningGardenPhase !== 'Burn') {
                    igniteBurningGardenCard(slot.instanceId);
                  } else {
                    removeSeraphim(slotIndex);
                  }
                  setAttackPanelSlot(prev => (prev === slotIndex ? null : prev));
                  setPendingSeraphimAttack(current => (current?.slot === slotIndex ? null : current));
                }}
                title={`${serDef?.name ?? 'Seraphim'} · Left-click attacks panel · Right-click remove from board`}
              >
                {serDef && isDeathFlamedHellBaseDefinitionId(serDef.definitionId) && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleCardFace(slot.instanceId);
                    }}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      zIndex: 15,
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: slot.faceState === 'back' ? 'rgba(28, 14, 10, 0.82)' : 'rgba(14, 8, 22, 0.72)',
                      color: slot.faceState === 'back' ? '#f1d6bf' : '#dcbcff',
                      fontSize: 9,
                      fontFamily: 'Georgia, serif',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    }}
                  >
                    {slot.faceState === 'back' ? 'Reveal' : 'Flip'}
                  </button>
                )}

                {/* Element top stripe */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${serElementColor}cc, ${serElementColor}, ${serElementColor}cc, transparent)`, pointerEvents: 'none', zIndex: 10 }} />
                {renderBurningGardenBadge(serDef?.element === 'BlazingGarden' ? slot.burningGardenPhase : undefined, slot.chromaticCounters, slot.isEcho)}
                {renderPrismaticBadge(serDef?.prismaticDepth, slot.spectrumTokens)}
                {serDef && isSnowboundCard(serDef) && renderSnowboundBadge(turn.snowboundPhase, turn.arcticCharge)}
                {serDef?.element === 'AbyssalForge' && renderForgeBadge(turn.reforgeCharges, turn.reforgeChargeCap, turn.pearls, turn.recastLedger, slot.instanceId)}
                {serDef?.element === 'EternalSeas' && renderSeasBadge(serDef?.rarity, turn.eternalSeasUndertow, turn.eternalSeasFoam, turn.secondaryCounters?.deepwake)}
                {serDef?.element === 'Dark' && renderBlackGlassBadge(turn.blackGlassWhiteFlame, turn.blackGlassBlackFlame, turn.blackGlassFracture)}
                {serDef?.element === 'Butterfly' && renderButterflyBadge(turn.butterflyFormation, turn.butterflySpectrum, turn.butterflyFlutterLevel)}
                {serDef?.element === 'Light' && renderLightBadge(turn.radiance, turn.lightResonance)}
                {serDef?.element === 'Thornbound' && renderThornboundBadge(turn.trail, turn.thornScar)}
                {serDef?.element === 'Mechanical' && serDef && !isSnowboundCard(serDef) && renderMechanicalBadge(turn.strain)}
                {serDef?.element === 'WishedUponAStar' && renderWuasBadge(turn.starlightCharges, turn.dreamLattice)}
                {serDef?.element === 'DeathFlamedHell' && renderDeathFlamedHellBadge(turn.eternalStacks?.pyre)}
                {serDef?.element === 'Fire' && renderFireBadge(turn.eternalStacks?.pyro, turn.secondaryCounters?.pyro)}
                <div style={getCardNameRibbonStyle('board')}>
                  <div style={{ fontSize: FRONT_FACE_METRICS.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center' }}>
                    {getDisplayCardTypeLabel('Seraphim')}
                  </div>
                  <div style={{ fontSize: FRONT_FACE_METRICS.nameSize, fontWeight: 'bold', color: cardFacePalette.text, textAlign: 'center', lineHeight: 1.25, marginTop: 2 }}>
                    {serDef?.name ?? 'Seraphim'}
                  </div>
                </div>
                <div style={getCardRulesPanelStyle('board')}>
                  <div style={{ fontSize: FRONT_FACE_METRICS.descSize, marginTop: 1, letterSpacing: 0.7, color: isActive ? warmTheme.success : 'rgba(36, 28, 28, 0.92)', textTransform: 'uppercase', textAlign: 'center' }}>
                    Unsynergized: {unsyncedCd <= 0 ? 'Ready' : unsyncedCd} · Synergized: {!hasAngel ? 'Needs Angel' : syncedCd <= 0 ? 'Ready' : syncedCd}
                  </div>
                  <div style={{ fontSize: 7, color: isActive ? 'rgba(250, 250, 250, 0.95)' : 'rgba(18, 12, 12, 0.92)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.7, textAlign: 'center' }}>
                    {isActive ? 'Synergy Online' : 'Synergy Offline'}
                  </div>
                  <div style={{
                    fontSize: seraphimDescMetrics.fontSize,
                    color: cardFacePalette.textSoft,
                    marginTop: 5,
                    lineHeight: seraphimDescMetrics.lineHeight,
                    textAlign: 'center',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: seraphimDescMetrics.lineClamp,
                    overflow: 'hidden',
                  }}>
                    {highlightRulesText(seraphimText, { lightBg: true })}
                  </div>
                  <div style={{ fontSize: 7, color: cardFacePalette.textMuted, marginTop: 6, letterSpacing: 0.5, textAlign: 'center' }}>left-click attacks · right-click remove</div>
                </div>
                {/* Patience stacks badge (bottom-left) */}
                {(slot.patienceStacks ?? 0) > 0 && renderPatienceBadge(slot.patienceStacks!)}
                {/* Vessel designation badge (bottom-right) */}
                {turn.neutralityVesselInstanceId && slot.instanceId === turn.neutralityVesselInstanceId && renderVesselBadge()}
                {isFocused && (
                  renderBoardFocusOverlay(12, serDef?.element)
                )}
              </div>
            );
          }

          // Empty front slot ? accepts Seraphim drops
          const hasAction = canPlay && hasSeraphimInHand;
          const glowColor = isDragTarget
            ? 'rgba(244,244,248,0.95)'
            : hasSeraphimInHand ? 'rgba(244,244,248,0.65)' : 'rgba(244,244,248,0.2)';
          return (
            <div
              key={slotIndex}
              style={{
                width: SLOT_W, height: SLOT_H,
                border: isDragTarget ? '2px solid rgba(244,244,248,0.9)' : `1px solid rgba(244,244,248,${hasSeraphimInHand ? '0.4' : '0.22'})`,
                borderRadius: 12,
                background: isDragTarget
                  ? 'rgba(244,244,248,0.1)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                backdropFilter: 'blur(3px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: hasAction ? 'pointer' : 'default', pointerEvents: 'auto',
                fontFamily: BODY_FONT, transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                boxShadow: isDragTarget
                  ? `0 0 0 2px rgba(255,215,0,0.45), 0 0 22px rgba(255,215,0,0.18)`
                  : hasSeraphimInHand
                    ? `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 14px rgba(255,215,0,0.06)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => handleFrontSlotClick(slotIndex)}
              onDragOver={(e) => {
                if (!canPlay || !e.dataTransfer.types.includes('application/x-seraphim-card')) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverFront(slotIndex);
              }}
              onDragLeave={() => setDragOverFront(null)}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('application/x-seraphim-card');
                if (id && canPlay) placeSeraphimFromHand(slotIndex, id);
                setDragOverFront(null);
              }}
            >
              {/* Corner accent marks */}
              <div style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderTop: `1px solid ${glowColor}`, borderLeft: `1px solid ${glowColor}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderTop: `1px solid ${glowColor}`, borderRight: `1px solid ${glowColor}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ position: 'absolute', bottom: 6, left: 6, width: 10, height: 10, borderBottom: `1px solid ${glowColor}`, borderLeft: `1px solid ${glowColor}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderBottom: `1px solid ${glowColor}`, borderRight: `1px solid ${glowColor}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              {/* Orbital pulse rings — two staggered concentric rings radiate outward
                  to grab the eye when a Seraphim is in hand and this slot is playable. */}
              {hasSeraphimInHand && (
                <>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: 56, height: 56, borderRadius: '50%',
                    border: `1px solid ${glowColor}`,
                    animation: 'orbitalPulse 2.4s ease-out infinite',
                    pointerEvents: 'none',
                  }} />
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: 56, height: 56, borderRadius: '50%',
                    border: `1px solid ${glowColor}`,
                    animation: 'orbitalPulse 2.4s ease-out 1.2s infinite',
                    pointerEvents: 'none',
                  }} />
                </>
              )}
              <div style={{ fontSize: 20, color: glowColor, lineHeight: 1, opacity: hasSeraphimInHand ? 0.9 : 0.4, transition: 'opacity 0.2s, color 0.2s', animation: hasSeraphimInHand ? 'constellationGlimmer 3s ease-in-out infinite' : undefined }}>✦</div>
              <div style={{ fontSize: 7, color: glowColor, marginTop: 7, letterSpacing: 1.8, textTransform: 'uppercase', textAlign: 'center', opacity: hasSeraphimInHand ? 0.85 : 0.4, transition: 'opacity 0.2s, color 0.2s' }}>
                {isDragTarget ? 'Drop Seraphim' : hasSeraphimInHand ? 'Click or Drop' : 'Empty'}
              </div>
            </div>
          );
        })}
      </div>

      {canPlay && selectedFront && selectedDef && (selectedFront.type === 'Seraphim' || selectedFront.type === 'Angel') && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 'clamp(88px, 12vh, 150px)',
            marginInline: 'auto',
            pointerEvents: 'auto',
            width: 'min(960px, 96vw)',
            maxHeight: 'min(62vh, 560px)',
            overflowY: 'auto',
            border: ATTACK_MODAL_PANEL_BORDER,
            borderRadius: 16,
            background: ATTACK_MODAL_PANEL_BG,
            boxShadow: ATTACK_MODAL_PANEL_SHADOW,
            padding: '10px 12px',
            fontFamily: BODY_FONT,
            zIndex: 140,
          }}
        >
          <div style={{ fontSize: 14, color: '#4f2813', letterSpacing: 0.35, marginBottom: 7, fontFamily: DISPLAY_FONT, fontWeight: 700 }}>
            {selectedDef.name} · Attack Panel
          </div>

          {selectedFront.type === 'Seraphim' && selectedDef.type === 'Seraphim' && (() => {
            const attacks = getSeraphimUiAttacks(selectedDef);
            const unsyncedCd = selectedFront.attackCooldowns?.[attacks.unsynergized.id] ?? 0;
            const syncedCd = selectedFront.attackCooldowns?.[attacks.synergized.id] ?? 0;
            const hasAngel = board.frontSlots.some(slot => slot?.type === 'Angel');
            const openSeraphimAttackCostModal = (attackId: 'unsynergized' | 'synergized') => {
              const attack = attackId === 'synergized' ? attacks.synergized : attacks.unsynergized;
              if ((attack.costs?.length ?? 0) === 0) {
                activateSeraphimAttack(attackPanelSlot as 0 | 1 | 2 | 3 | 4, attackId);
                return;
              }

              setSelectedDiscardIds([]);
              setPendingSeraphimAttack({
                slot: attackPanelSlot as 0 | 1 | 2 | 3 | 4,
                attackId,
                title: `${attack.label} · ${attack.name}`,
                description: formatAttackSummary(attack),
              });
            };
            const buildAttackTileStyle = (ready: boolean): React.CSSProperties => ({
              minHeight: 96,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 8,
              borderRadius: 10,
              border: `1px solid ${ready ? 'rgba(109, 154, 93, 0.66)' : 'rgba(130, 90, 67, 0.5)'}`,
              background: ready ? 'rgba(247, 243, 234, 0.96)' : 'rgba(236, 225, 207, 0.95)',
              color: '#2f1d14',
              padding: '9px 10px',
              cursor: ready ? 'pointer' : 'not-allowed',
              textAlign: 'left',
              fontFamily: BODY_FONT,
              boxShadow: ready ? '0 8px 14px rgba(55, 75, 44, 0.16)' : 'none',
            });
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                {[
                  { attack: attacks.unsynergized, cd: unsyncedCd, readyText: 'Ready', enabled: true, attackId: 'unsynergized' as const },
                  { attack: attacks.synergized, cd: syncedCd, readyText: 'Ready', enabled: hasAngel, attackId: 'synergized' as const },
                ].map(({ attack, cd, readyText, enabled, attackId }) => (
                  <button
                    key={attack.id}
                    className="attack-screen-tile"
                    onClick={() => openSeraphimAttackCostModal(attackId)}
                    disabled={cd > 0 || !enabled}
                    style={buildAttackTileStyle(cd <= 0 && enabled)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7a3f1a', fontFamily: DISPLAY_FONT }}>{attack.label}</div>
                        <div style={{ fontSize: 11.5, color: cd <= 0 && enabled ? '#3f6e37' : '#7c493a', fontWeight: 800 }}>{cd <= 0 ? (enabled ? readyText : 'Needs Angel') : `Cooldown ${cd}`}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#2b1a12', marginTop: 1, lineHeight: 1.2, fontFamily: DISPLAY_FONT }}>{attack.name}</div>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#523326' }}>
                      {formatAttackSummary(attack)}
                    </div>
                  </button>
                ))}
              </div>
            );
          })()}

          {selectedFront.type === 'Angel' && selectedDef.type === 'Angel' && (() => {
            const attacks = getAngelUiAttacks(selectedDef);
            const primaryCd = selectedFront.attackCooldowns?.[attacks.primary.id] ?? 0;
            const exaltedCd = selectedFront.attackCooldowns?.[attacks.exalted.id] ?? 0;
            const primaryReady = primaryCd <= 0;
            const exaltedReady = exaltedCd <= 0;

            const openAttackCostModal = (attackId: 'primary' | 'exalted') => {
              const attack = attackId === 'exalted' ? attacks.exalted : attacks.primary;
              if ((attack.costs?.length ?? 0) === 0) {
                activateAngelAttack(attackPanelSlot as 0 | 1 | 2 | 3 | 4, attackId);
                return;
              }

              setSelectedDiscardIds([]);
              setSelectedSacrificeSeraphimIds([]);
              setSelectedSacrificeAngelIds([]);
              setPendingAngelAttack({
                slot: attackPanelSlot as 0 | 1 | 2 | 3 | 4,
                attackId,
                title: `${attack.label} · ${attack.name}`,
                description: formatAttackSummary(attack),
              });
            };

            const buildAttackTileStyle = (ready: boolean): React.CSSProperties => ({
              minHeight: 96,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 8,
              borderRadius: 10,
              border: `1px solid ${ready ? 'rgba(109, 154, 93, 0.66)' : 'rgba(130, 90, 67, 0.5)'}`,
              background: ready ? 'rgba(247, 243, 234, 0.96)' : 'rgba(236, 225, 207, 0.95)',
              color: '#2f1d14',
              padding: '9px 10px',
              cursor: ready ? 'pointer' : 'not-allowed',
              textAlign: 'left',
              fontFamily: BODY_FONT,
              boxShadow: ready ? '0 8px 14px rgba(55, 75, 44, 0.16)' : 'none',
            });

            return (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  <button
                    className="attack-screen-tile"
                    onClick={() => openAttackCostModal('primary')}
                    disabled={!primaryReady}
                    style={buildAttackTileStyle(primaryReady)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7a3f1a', fontFamily: DISPLAY_FONT }}>{attacks.primary.label}</div>
                        <div style={{ fontSize: 11.5, color: primaryReady ? '#3f6e37' : '#7c493a', fontWeight: 800 }}>{primaryReady ? 'Ready' : `Cooldown ${primaryCd}`}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#2b1a12', marginTop: 1, lineHeight: 1.2, fontFamily: DISPLAY_FONT }}>{attacks.primary.name}</div>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#523326' }}>{formatAttackSummary(attacks.primary)}</div>
                  </button>

                  <button
                    className="attack-screen-tile"
                    onClick={() => openAttackCostModal('exalted')}
                    disabled={!exaltedReady}
                    style={buildAttackTileStyle(exaltedReady)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7a3f1a', fontFamily: DISPLAY_FONT }}>{attacks.exalted.label}</div>
                        <div style={{ fontSize: 11.5, color: exaltedReady ? '#3f6e37' : '#7c493a', fontWeight: 800 }}>{exaltedReady ? 'Ready' : `Cooldown ${exaltedCd}`}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#2b1a12', marginTop: 1, lineHeight: 1.2, fontFamily: DISPLAY_FONT }}>{attacks.exalted.name}</div>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#523326' }}>{formatAttackSummary(attacks.exalted)}</div>
                  </button>
                </div>

                <div style={{ fontSize: 12, color: '#5b392b', textAlign: 'center' }}>
                  Angel attacks now open a separate payment modal when they need discards or sacrifices.
                </div>
              </div>
            );
          })()}

          {pendingAngelAttack && selectedFront?.type === 'Angel' && selectedDef?.type === 'Angel' && (() => {
            const attacks = getAngelUiAttacks(selectedDef);
            const activeAttack = pendingAngelAttack.attackId === 'exalted' ? attacks.exalted : attacks.primary;
            const discardCost = getAttackCostCount(activeAttack.costs, 'discard_from_hand');
            const seraphimSacCost = getAttackCostCount(activeAttack.costs, 'sacrifice_seraphim');
            const angelSacCost = getAttackCostCount(activeAttack.costs, 'sacrifice_angel');
            const pyroHeatCost = getAttackCostCount(activeAttack.costs, 'spend_pyro_heat');
            const radianceCost = getAttackCostCount(activeAttack.costs, 'spend_radiance');
            const trailCost = getAttackCostCount(activeAttack.costs, 'spend_trail');
            const strainCost = getAttackCostCount(activeAttack.costs, 'spend_strain');
            const hasResourceBudget = hasRequiredAttackResources(activeAttack.costs, {
              pyroHeat: turn.pyroHeat ?? 0,
              radiance: turn.radiance,
              trail: turn.trail,
              strain: turn.strain,
            });
            const canConfirmAttack =
              selectedDiscardIds.length === discardCost
              && selectedSacrificeSeraphimIds.length === seraphimSacCost
              && selectedSacrificeAngelIds.length === angelSacCost
              && hasResourceBudget;

            return (
              <div style={{
                position: 'fixed',
                inset: 0,
                background: ATTACK_MODAL_BACKDROP,
                backdropFilter: 'blur(3px)',
                zIndex: 220,
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(14px, 3.2vh, 28px)',
              }}>
                <div style={{
                  width: ATTACK_PANEL_WIDTH,
                  maxHeight: 'min(88vh, 820px)',
                  overflowY: 'auto',
                  borderRadius: 18,
                  border: ATTACK_MODAL_PANEL_BORDER,
                  background: ATTACK_MODAL_PANEL_BG,
                  boxShadow: ATTACK_MODAL_PANEL_SHADOW,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 13,
                  color: '#2f1a10',
                  fontFamily: BODY_FONT,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12.5, letterSpacing: 1.25, textTransform: 'uppercase', color: '#522811', fontFamily: DISPLAY_FONT }}>Pay Attack Cost</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#5d2d14', marginTop: 4, fontFamily: DISPLAY_FONT }}>{pendingAngelAttack.title}</div>
                      <div style={{ fontSize: 13, color: '#5a3119', marginTop: 6, lineHeight: 1.5 }}>{pendingAngelAttack.description}</div>
                    </div>
                    <button
                      className="attack-modal-close"
                      onClick={() => {
                        setPendingAngelAttack(null);
                        setSelectedDiscardIds([]);
                        setSelectedSacrificeSeraphimIds([]);
                        setSelectedSacrificeAngelIds([]);
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        border: '1px solid rgba(126, 86, 48, 0.35)',
                        background: 'rgba(255, 247, 232, 0.88)',
                        color: '#6d3f23',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                    >
                      ÁE                    </button>
                  </div>

                  {discardCost > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 12.5, color: '#5a2f18', fontFamily: DISPLAY_FONT }}>Discard from hand ({selectedDiscardIds.length}/{discardCost})</div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 104px))',
                        justifyContent: 'center',
                        gap: 10,
                        maxHeight: 'min(36vh, 340px)',
                        overflowY: 'auto',
                        paddingRight: 4,
                      }}>
                        {hand.map(card => {
                          const def = CardRegistry.get(card.definitionId);
                          const selected = selectedDiscardIds.includes(card.instanceId);
                          return (
                            <button
                              key={card.instanceId}
                              className="attack-cost-choice"
                              onClick={() => setSelectedDiscardIds(current => toggleSelectedId(current, card.instanceId, discardCost))}
                              style={{
                                ...getCardFaceBackgroundStyle(def, card.finish, card.faceState),
                                width: '100%',
                                aspectRatio: '0.73',
                                borderRadius: 7,
                                border: `1px solid ${selected ? '#c9773f' : 'rgba(124, 86, 49, 0.45)'}`,
                                color: warmTheme.text,
                                padding: 0,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                justifyContent: 'stretch',
                                boxShadow: selected ? `0 0 0 2px rgba(236, 192, 128, 0.3), 0 8px 14px rgba(108, 61, 30, 0.2)` : 'none',
                              }}
                            >
                              {renderAttackCostCard(card, selected, selected ? 'Discard' : 'Select', warmTheme.accentDeep)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {seraphimSacCost > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 12.5, color: '#5a2f18', fontFamily: DISPLAY_FONT }}>Sacrifice Seraphim ({selectedSacrificeSeraphimIds.length}/{seraphimSacCost})</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 104px))', justifyContent: 'center', gap: 10, maxHeight: 'min(36vh, 340px)', overflowY: 'auto', paddingRight: 4 }}>
                        {selectableSeraphimSacrificeUnits.map(unit => {
                          const def = CardRegistry.get(unit.definitionId);
                          const selected = selectedSacrificeSeraphimIds.includes(unit.instanceId);
                          return (
                            <button
                              key={unit.instanceId}
                              className="attack-cost-choice"
                              onClick={() => setSelectedSacrificeSeraphimIds(current => toggleSelectedId(current, unit.instanceId, seraphimSacCost))}
                              style={{
                                ...getCardFaceBackgroundStyle(def, unit.finish, unit.faceState),
                                width: '100%',
                                aspectRatio: '0.73',
                                borderRadius: 7,
                                border: `1px solid ${selected ? '#c9773f' : 'rgba(124, 86, 49, 0.45)'}`,
                                color: warmTheme.text,
                                padding: 0,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                boxShadow: selected ? `0 0 0 2px rgba(224, 124, 92, 0.28), 0 8px 14px rgba(108, 61, 30, 0.2)` : 'none',
                              }}
                            >
                              {renderAttackCostCard(unit, selected, selected ? 'Sacrifice' : 'Select', warmTheme.accentDeep)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {angelSacCost > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 12.5, color: '#5a2f18', fontFamily: DISPLAY_FONT }}>Sacrifice Angel ({selectedSacrificeAngelIds.length}/{angelSacCost})</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 104px))', justifyContent: 'center', gap: 10, maxHeight: 'min(36vh, 340px)', overflowY: 'auto', paddingRight: 4 }}>
                        {selectableAngelSacrificeUnits.map(unit => {
                          const def = CardRegistry.get(unit.definitionId);
                          const selected = selectedSacrificeAngelIds.includes(unit.instanceId);
                          return (
                            <button
                              key={unit.instanceId}
                              className="attack-cost-choice"
                              onClick={() => setSelectedSacrificeAngelIds(current => toggleSelectedId(current, unit.instanceId, angelSacCost))}
                              style={{
                                ...getCardFaceBackgroundStyle(def, unit.finish, unit.faceState),
                                width: '100%',
                                aspectRatio: '0.73',
                                borderRadius: 7,
                                border: `1px solid ${selected ? '#c9773f' : 'rgba(124, 86, 49, 0.45)'}`,
                                color: warmTheme.text,
                                padding: 0,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                boxShadow: selected ? `0 0 0 2px rgba(168, 216, 109, 0.28), 0 8px 14px rgba(108, 61, 30, 0.2)` : 'none',
                              }}
                            >
                              {renderAttackCostCard(unit, selected, selected ? 'Sacrifice' : 'Select', warmTheme.accentDeep)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(pyroHeatCost > 0 || radianceCost > 0 || trailCost > 0 || strainCost > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ fontSize: 12.5, color: '#5a2f18', fontFamily: DISPLAY_FONT }}>Spend resources</div>
                      <div style={{ fontSize: 11.5, color: '#5f3520', lineHeight: 1.45 }}>
                        {pyroHeatCost > 0 && <div>Heat: {turn.pyroHeat ?? 0}/{pyroHeatCost}</div>}
                        {radianceCost > 0 && <div>Radiance: {turn.radiance}/{radianceCost}</div>}
                        {trailCost > 0 && <div>Trail: {turn.trail}/{trailCost}</div>}
                        {strainCost > 0 && <div>Strain: {turn.strain}/{strainCost}</div>}
                      </div>
                      {!hasResourceBudget && (
                        <div style={{ fontSize: 11.5, color: '#9a3d2f', lineHeight: 1.35 }}>
                          Insufficient resources to pay this attack cost.
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                    <div style={{ fontSize: 11.5, color: '#5f3520', lineHeight: 1.35 }}>Select the required cards, then confirm the attack.</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="attack-modal-secondary"
                        onClick={() => {
                          setPendingAngelAttack(null);
                          setSelectedDiscardIds([]);
                          setSelectedSacrificeSeraphimIds([]);
                          setSelectedSacrificeAngelIds([]);
                        }}
                        style={{
                          borderRadius: 8,
                          border: '1px solid rgba(126, 86, 48, 0.33)',
                          background: 'rgba(254, 245, 229, 0.74)',
                          color: '#6a3d22',
                          padding: '9px 14px',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: BODY_FONT,
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="attack-modal-primary"
                        onClick={() => {
                          if (!canConfirmAttack) return;
                          activateAngelAttack(pendingAngelAttack.slot, pendingAngelAttack.attackId, {
                            discardInstanceIds: selectedDiscardIds,
                            sacrificeSeraphimInstanceIds: selectedSacrificeSeraphimIds,
                            sacrificeAngelInstanceIds: selectedSacrificeAngelIds,
                          });
                          setPendingAngelAttack(null);
                          setAttackPanelSlot(null);
                          setSelectedDiscardIds([]);
                          setSelectedSacrificeSeraphimIds([]);
                          setSelectedSacrificeAngelIds([]);
                        }}
                        disabled={!canConfirmAttack}
                        style={{
                          borderRadius: 8,
                          border: '1px solid rgba(126, 86, 48, 0.44)',
                          background: canConfirmAttack
                            ? 'linear-gradient(180deg, rgba(250, 242, 227, 0.96) 0%, rgba(238, 216, 181, 0.94) 100%)'
                            : 'rgba(236, 222, 197, 0.82)',
                          color: '#56280f',
                          padding: '9px 16px',
                          cursor: canConfirmAttack ? 'pointer' : 'not-allowed',
                          fontSize: 13,
                          fontWeight: 'bold',
                          fontFamily: DISPLAY_FONT,
                        }}
                      >
                        Confirm Attack
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {pendingSeraphimAttack && selectedFront?.type === 'Seraphim' && selectedDef?.type === 'Seraphim' && (() => {
            const attacks = getSeraphimUiAttacks(selectedDef);
            const activeAttack = pendingSeraphimAttack.attackId === 'synergized' ? attacks.synergized : attacks.unsynergized;
            const discardCost = getAttackCostCount(activeAttack.costs, 'discard_from_hand');
            const pyroHeatCost = getAttackCostCount(activeAttack.costs, 'spend_pyro_heat');
            const radianceCost = getAttackCostCount(activeAttack.costs, 'spend_radiance');
            const trailCost = getAttackCostCount(activeAttack.costs, 'spend_trail');
            const strainCost = getAttackCostCount(activeAttack.costs, 'spend_strain');
            const hasResourceBudget = hasRequiredAttackResources(activeAttack.costs, {
              pyroHeat: turn.pyroHeat ?? 0,
              radiance: turn.radiance,
              trail: turn.trail,
              strain: turn.strain,
            });
            const canConfirmAttack = selectedDiscardIds.length === discardCost && hasResourceBudget;

            return (
              <div style={{
                position: 'fixed',
                inset: 0,
                background: ATTACK_MODAL_BACKDROP,
                backdropFilter: 'blur(3px)',
                zIndex: 220,
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(14px, 3.2vh, 28px)',
              }}>
                <div style={{
                  width: ATTACK_PANEL_WIDTH,
                  maxHeight: 'min(88vh, 820px)',
                  overflowY: 'auto',
                  borderRadius: 18,
                  border: ATTACK_MODAL_PANEL_BORDER,
                  background: ATTACK_MODAL_PANEL_BG,
                  boxShadow: ATTACK_MODAL_PANEL_SHADOW,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 13,
                  color: '#2f1a10',
                  fontFamily: BODY_FONT,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12.5, letterSpacing: 1.25, textTransform: 'uppercase', color: '#522811', fontFamily: DISPLAY_FONT }}>Pay Attack Cost</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#5d2d14', marginTop: 4, fontFamily: DISPLAY_FONT }}>{pendingSeraphimAttack.title}</div>
                      <div style={{ fontSize: 13, color: '#5a3119', marginTop: 6, lineHeight: 1.5 }}>{pendingSeraphimAttack.description}</div>
                    </div>
                    <button
                      className="attack-modal-close"
                      onClick={() => {
                        setPendingSeraphimAttack(null);
                        setSelectedDiscardIds([]);
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        border: '1px solid rgba(126, 86, 48, 0.35)',
                        background: 'rgba(255, 247, 232, 0.88)',
                        color: '#6d3f23',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                    >
                      ÁE                    </button>
                  </div>

                  {discardCost > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 12.5, color: '#5a2f18', fontFamily: DISPLAY_FONT }}>Discard from hand ({selectedDiscardIds.length}/{discardCost})</div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 104px))',
                        justifyContent: 'center',
                        gap: 10,
                        maxHeight: 'min(36vh, 340px)',
                        overflowY: 'auto',
                        paddingRight: 4,
                      }}>
                        {hand.map(card => {
                          const def = CardRegistry.get(card.definitionId);
                          const selected = selectedDiscardIds.includes(card.instanceId);
                          return (
                            <button
                              key={card.instanceId}
                              className="attack-cost-choice"
                              onClick={() => setSelectedDiscardIds(current => toggleSelectedId(current, card.instanceId, discardCost))}
                              style={{
                                ...getCardFaceBackgroundStyle(def, card.finish, card.faceState),
                                width: '100%',
                                aspectRatio: '0.73',
                                borderRadius: 7,
                                border: `1px solid ${selected ? '#c9773f' : 'rgba(124, 86, 49, 0.45)'}`,
                                color: warmTheme.text,
                                padding: 0,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                justifyContent: 'stretch',
                                boxShadow: selected ? `0 0 0 2px rgba(236, 192, 128, 0.3), 0 8px 14px rgba(108, 61, 30, 0.2)` : 'none',
                              }}
                            >
                              {renderAttackCostCard(card, selected, selected ? 'Discard' : 'Select', warmTheme.accentDeep)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(pyroHeatCost > 0 || radianceCost > 0 || trailCost > 0 || strainCost > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ fontSize: 12.5, color: '#5a2f18', fontFamily: DISPLAY_FONT }}>Spend resources</div>
                      <div style={{ fontSize: 11.5, color: '#5f3520', lineHeight: 1.45 }}>
                        {pyroHeatCost > 0 && <div>Heat: {turn.pyroHeat ?? 0}/{pyroHeatCost}</div>}
                        {radianceCost > 0 && <div>Radiance: {turn.radiance}/{radianceCost}</div>}
                        {trailCost > 0 && <div>Trail: {turn.trail}/{trailCost}</div>}
                        {strainCost > 0 && <div>Strain: {turn.strain}/{strainCost}</div>}
                      </div>
                      {!hasResourceBudget && (
                        <div style={{ fontSize: 11.5, color: '#9a3d2f', lineHeight: 1.35 }}>
                          Insufficient resources to pay this attack cost.
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                    <div style={{ fontSize: 11.5, color: '#5f3520', lineHeight: 1.35 }}>Select the discard card(s), then confirm the attack.</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="attack-modal-secondary"
                        onClick={() => {
                          setPendingSeraphimAttack(null);
                          setSelectedDiscardIds([]);
                        }}
                        style={{
                          borderRadius: 8,
                          border: '1px solid rgba(126, 86, 48, 0.33)',
                          background: 'rgba(254, 245, 229, 0.74)',
                          color: '#6a3d22',
                          padding: '9px 14px',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: BODY_FONT,
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="attack-modal-primary"
                        onClick={() => {
                          if (!canConfirmAttack) return;
                          activateSeraphimAttack(pendingSeraphimAttack.slot, pendingSeraphimAttack.attackId, {
                            discardInstanceIds: selectedDiscardIds,
                            sacrificeSeraphimInstanceIds: [],
                            sacrificeAngelInstanceIds: [],
                          });
                          setPendingSeraphimAttack(null);
                          setAttackPanelSlot(null);
                          setSelectedDiscardIds([]);
                        }}
                        disabled={!canConfirmAttack}
                        style={{
                          borderRadius: 8,
                          border: '1px solid rgba(126, 86, 48, 0.44)',
                          background: canConfirmAttack
                            ? 'linear-gradient(180deg, rgba(250, 242, 227, 0.96) 0%, rgba(238, 216, 181, 0.94) 100%)'
                            : 'rgba(236, 222, 197, 0.82)',
                          color: '#56280f',
                          padding: '9px 16px',
                          cursor: canConfirmAttack ? 'pointer' : 'not-allowed',
                          fontSize: 13,
                          fontWeight: 'bold',
                          fontFamily: DISPLAY_FONT,
                        }}
                      >
                        Confirm Attack
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}


      {/* Active Neutrality turn mechanics chips */}
      {canPlay && (() => {
        const chips: { label: string; title: string; highlight?: boolean }[] = [];
        const eqSigils = Math.max(0, turn.neutralityEquilibriumSigils ?? 0);
        if (eqSigils > 0) {
          const gainBonus = Math.floor(eqSigils / 2);
          chips.push({
            label: `Sigils ${eqSigils} (+${gainBonus} Pat Gain)`,
            title: `Equilibrium Sigils: every 2 Sigils adds +1 to future Patience gains this turn.`,
          });
        }
        // Patient Light: separate indicator — always shown when > 0 so the player
        // can see exactly how many stacks are amplifying Patience gain each card play.
        const patientLightStacks = Math.max(0, turn.neutralityPatientLightStacks ?? 0);
        if (patientLightStacks > 0) {
          const perCardGain = 1 + patientLightStacks;
          chips.push({
            label: `Patient Light ×${patientLightStacks}`,
            title: `Patient Light: +${patientLightStacks} stack${patientLightStacks === 1 ? '' : 's'} — Seraphim now gain +${perCardGain} Patience per card played (base 1 + ${patientLightStacks}). Angels also accumulate Patience at this rate and spend it when they attack (+2% base Oblivion per stack consumed).`,
            highlight: true,
          });
        }
        if (turn.neutralityVesselInstanceId) {
          const vesselName = board.frontSlots.find(s => s?.instanceId === turn.neutralityVesselInstanceId)
            ? (CardRegistry.get(board.frontSlots.find(s => s?.instanceId === turn.neutralityVesselInstanceId)!.definitionId)?.name ?? 'Vessel')
            : 'Vessel';
          chips.push({ label: 'Vessel: ' + vesselName, title: 'A Seraphim has been designated as your Vessel for this turn.' });
        }
        if ((turn.neutralityVesselCopyPercent ?? 0) > 0) {
          chips.push({ label: `Copy ${turn.neutralityVesselCopyPercent}%`, title: `Your Vessel copies ${turn.neutralityVesselCopyPercent}% of Patience gained by other Seraphim this turn.` });
        }
        if ((turn.neutralityLinkedGainBonus ?? 0) > 0) {
          const retain = turn.neutralityLinkedRetainPercent ?? 0;
          chips.push({ label: `Linked +${turn.neutralityLinkedGainBonus} / Retain ${retain}%`, title: `Linked mode: patience gains grant +${turn.neutralityLinkedGainBonus} extra to all linked Seraphim; non-attackers retain ${retain}% Patience after linked attacks.` });
        }
        if ((turn.neutralityAttackPreservePercent ?? 0) > 0) {
          chips.push({ label: `Preserve ${turn.neutralityAttackPreservePercent}%`, title: `Seraphim attacks preserve ${turn.neutralityAttackPreservePercent}% of consumed Patience this turn.` });
        }
        if ((turn.neutralityAttackRestorePercent ?? 0) > 0) {
          chips.push({ label: `Restore ${turn.neutralityAttackRestorePercent}%`, title: `Seraphim attacks restore ${turn.neutralityAttackRestorePercent}% of consumed Patience this turn.` });
        }
        if ((turn.neutralityMarkedCardIds?.length ?? 0) > 0) {
          const gain = turn.neutralityMarkedPatienceGain ?? 0;
          chips.push({ label: `${turn.neutralityMarkedCardIds!.length} Marked (+${gain} Pat)`, title: `${turn.neutralityMarkedCardIds!.length} hand card(s) marked: each grants +${gain} Patience to all Seraphim when played.` });
        }
        if (chips.length === 0) return null;
        return (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 5,
            justifyContent: 'center',
            marginTop: 6,
            pointerEvents: 'none',
          }}>
            {chips.map((chip, idx) => (
              <div key={idx} title={chip.title} style={{
                padding: '2px 8px',
                borderRadius: 999,
                border: chip.highlight
                  ? '1px solid rgba(255,220,140,0.65)'
                  : '1px solid rgba(160,190,255,0.38)',
                background: chip.highlight
                  ? 'rgba(56, 44, 14, 0.90)'
                  : 'rgba(20, 24, 56, 0.82)',
                color: chip.highlight
                  ? 'rgba(255,225,130,0.98)'
                  : 'rgba(190,215,255,0.94)',
                fontSize: 8.5,
                lineHeight: 1.4,
                letterSpacing: 0.5,
                fontFamily: DISPLAY_FONT,
                fontWeight: 700,
                pointerEvents: 'none',
                boxShadow: chip.highlight
                  ? '0 2px 8px rgba(200,160,40,0.30)'
                  : '0 2px 6px rgba(0,0,0,0.24)',
              }}>
                {chip.label}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Zone separator with rank labels */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        gap: 10,
        marginTop: 'clamp(6px, 1vh, 12px)',
        marginBottom: 2,
        pointerEvents: 'none',
        animation: 'boardZoneEntrance 0.5s ease both',
      }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(244,244,248,0.22))' }} />
        <div style={{ fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(244,244,248,0.55)', fontFamily: BODY_FONT, whiteSpace: 'nowrap' }}>Front Rank</div>
        <div style={{ flex: 2, height: 1, background: 'rgba(244,244,248,0.1)', boxShadow: '0 0 8px rgba(244,244,248,0.06)' }} />
        <div style={{ fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(200,160,255,0.65)', fontFamily: BODY_FONT, whiteSpace: 'nowrap' }}>Support</div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(244,244,248,0.22), transparent)' }} />
      </div>

      {/* Back row: 4 Cherubim slots, staggered between front slots */}
      <div style={{
        display: 'flex',
        gap: BACK_ROW_GAP,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: ROW_SEPARATION,
        paddingLeft: BACK_ROW_STAGGER,
      }}>
        {board.backSlots.map((card, i) => {
          const backSlot = i as 0 | 1 | 2 | 3;
          const cardDef = card ? CardRegistry.get(card.definitionId) : null;
          const isDragTarget = dragOverBack === backSlot && canPlay;

          // Cherubim card rendering
          if (card && card.type === 'Cherubim') {
            const cherubim = card as CherubimInstance;
            const hasDurability = cherubim.durability !== undefined && cherubim.maxDurability !== undefined;
            const durabilityRatio = hasDurability
              ? (cherubim.durability as number) / (cherubim.maxDurability as number)
              : 1;
            const durabilityColor = durabilityRatio > 0.5 ? '#c888f0' : durabilityRatio > 0.25 ? '#e8a040' : '#e86060';
            const cherubimText = cardDef ? getCardPreviewText(cardDef, 2) : '';
            const cherubimDescMetrics = getAdaptiveDescriptionMetrics('boardMini', cherubimText);
            const def = CardRegistry.get(cherubim.definitionId) as CherubimDefinition | null;
            const condition = def?.discardCondition;
            const conditionDescMap: Record<string, string> = {
              hand_size_lte: 'Discard when hand <= {val}',
              chain_lte: 'Discard when chain <= {val}',
              oblivion_lte: 'Discard when Oblivion <= {val}',
              radiance_lte: 'Discard when radiance <= {val}',
              cards_played_gte: 'Discard after {val}+ cards',
              seraphim_count_lte: 'Discard when Seraphim <= {val}',
              trail_lte: 'Discard when trail <= {val}',
              strain_gte: 'Discard when strain >= {val}',
            };
            const conditionText = condition
              ? (conditionDescMap[condition.type] ?? 'Auto-discard').replace('{val}', String(condition.value))
              : 'Persists indefinitely';
            const isHovered = hoveredBackSlot === backSlot;
            const focusPalette = getBoardFocusPalette(cardDef?.element);
            const cherubElementColor = cardDef?.element ? (ELEMENT_COLORS[cardDef.element] ?? '#c888f0') : '#c888f0';
            return (
              <div
                className={(cherubim.finish === 'holo' || cardDef?.rarity === 'Infinite' || cardDef?.rarity === 'Eternal')
                  ? `holofoil-live-card${cardDef?.rarity === 'Infinite' ? ' holofoil-live-card--infinite' : ''}${cardDef?.rarity === 'Eternal' ? ' holofoil-live-card--eternal' : ''}`
                  : undefined}
                style={{
                  width: CHERUBIM_W, height: CHERUBIM_H,
                  ...getCardFaceBackgroundStyle(cardDef, cherubim.finish, cherubim.faceState),
                  border: `1px solid ${isHovered ? focusPalette.rim : 'rgba(143,116,169,0.5)'}`,
                  borderRadius: 12,
                  boxShadow: isHovered
                    ? `0 0 0 1px ${focusPalette.rim}, 0 0 0 3px ${focusPalette.glow}, 0 0 18px ${focusPalette.glow}, ${cardFacePalette.shadow}`
                    : `${warmTheme.shadow}, ${cardFacePalette.shadow}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start',
                  fontFamily: BODY_FONT, pointerEvents: 'auto', cursor: 'pointer',
                  padding: 0,
                  overflow: 'hidden',
                  position: 'relative',
                }}
                onClick={() => handleBackSlotClick(backSlot)}
                onMouseEnter={() => setHoveredBackSlot(backSlot)}
                onMouseLeave={() => setHoveredBackSlot(current => (current === backSlot ? null : current))}
                title={hasDurability
                  ? `${cardDef?.name ?? getDisplayCardTypeLabel('Cherubim')} - ${cherubim.durability} play${cherubim.durability !== 1 ? 's' : ''} remaining - click to discard`
                  : `${cardDef?.name ?? getDisplayCardTypeLabel('Cherubim')} - ${conditionText} - click to discard`}
              >
                {cardDef && isDeathFlamedHellBaseDefinitionId(cardDef.definitionId) && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleCardFace(cherubim.instanceId);
                    }}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      zIndex: 15,
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: cherubim.faceState === 'back' ? 'rgba(28, 14, 10, 0.82)' : 'rgba(14, 8, 22, 0.72)',
                      color: cherubim.faceState === 'back' ? '#f1d6bf' : '#dcbcff',
                      fontSize: 9,
                      fontFamily: 'Georgia, serif',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    }}
                  >
                    {cherubim.faceState === 'back' ? 'Reveal' : 'Flip'}
                  </button>
                )}

                {/* Element top stripe */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${cherubElementColor}cc, ${cherubElementColor}, ${cherubElementColor}cc, transparent)`, pointerEvents: 'none', zIndex: 10 }} />
                {renderBurningGardenBadge(cardDef?.element === 'BlazingGarden' ? cherubim.burningGardenPhase : undefined, cherubim.chromaticCounters, cherubim.isEcho)}
                {renderPrismaticBadge(cardDef?.prismaticDepth, cherubim.spectrumTokens)}
                <div style={getCardNameRibbonStyle('boardMini')}>
                  <div style={{ fontSize: CHERUBIM_FACE_METRICS.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center' }}>{getDisplayCardTypeLabel('Cherubim')}</div>
                  <div style={{ fontSize: CHERUBIM_FACE_METRICS.nameSize, fontWeight: 'bold', color: cardFacePalette.text, textAlign: 'center', lineHeight: 1.25, marginTop: 2 }}>
                    {cardDef?.name ?? getDisplayCardTypeLabel('Cherubim')}
                  </div>
                </div>
                <div style={getCardRulesPanelStyle('boardMini')}>
                  <div style={{ fontSize: CHERUBIM_FACE_METRICS.descSize, color: hasDurability ? durabilityColor : '#a8d5a8', letterSpacing: 0.4, textAlign: 'center' }}>
                    {hasDurability
                      ? `${cherubim.durability} play${cherubim.durability !== 1 ? 's' : ''} left`
                      : conditionText}
                  </div>
                  <div style={{
                    fontSize: cherubimDescMetrics.fontSize,
                    color: cardFacePalette.textSoft,
                    marginTop: 4,
                    lineHeight: cherubimDescMetrics.lineHeight,
                    textAlign: 'center',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: cherubimDescMetrics.lineClamp,
                    overflow: 'hidden',
                  }}>
                    {cherubimText}
                  </div>
                  <div style={{ fontSize: 6, color: cardFacePalette.textMuted, marginTop: 5, textAlign: 'center' }}>
                    click to remove
                  </div>
                </div>
                {isHovered && (
                  renderBoardFocusOverlay(12, cardDef?.element)
                )}
              </div>
            );
          }

          // Empty back slot ? accepts Cherubim drops
          const hasAction = canPlay && hasCherubimInHand;
          const cherubimGlow = isDragTarget
            ? 'rgba(200,160,255,0.95)'
            : hasCherubimInHand ? 'rgba(200,160,255,0.6)' : 'rgba(200,160,255,0.18)';
          return (
            <div
              key={backSlot}
              style={{
                width: CHERUBIM_W, height: CHERUBIM_H,
                border: isDragTarget ? '2px solid rgba(200,160,255,0.9)' : `1px solid rgba(200,160,255,${hasCherubimInHand ? '0.48' : '0.28'})`,
                borderRadius: 12,
                background: isDragTarget
                  ? 'rgba(160,120,255,0.12)'
                  : 'linear-gradient(180deg, rgba(200,160,255,0.1) 0%, rgba(200,160,255,0.04) 100%)',
                backdropFilter: 'blur(3px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: hasAction ? 'pointer' : 'default', pointerEvents: 'auto',
                fontFamily: BODY_FONT, transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                boxShadow: isDragTarget
                  ? `0 0 0 2px rgba(200,160,255,0.45), 0 0 22px rgba(200,160,255,0.18)`
                  : hasCherubimInHand
                    ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px rgba(200,160,255,0.08)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => handleBackSlotClick(backSlot)}
              onDragOver={(e) => {
                if (!canPlay || !e.dataTransfer.types.includes('application/x-cherubim-card')) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverBack(backSlot);
              }}
              onDragLeave={() => setDragOverBack(null)}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('application/x-cherubim-card');
                if (id && canPlay) placeCherubim(backSlot, id);
                setDragOverBack(null);
              }}
            >
              {/* Corner accent marks */}
              <div style={{ position: 'absolute', top: 5, left: 5, width: 8, height: 8, borderTop: `1px solid ${cherubimGlow}`, borderLeft: `1px solid ${cherubimGlow}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderTop: `1px solid ${cherubimGlow}`, borderRight: `1px solid ${cherubimGlow}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ position: 'absolute', bottom: 5, left: 5, width: 8, height: 8, borderBottom: `1px solid ${cherubimGlow}`, borderLeft: `1px solid ${cherubimGlow}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ position: 'absolute', bottom: 5, right: 5, width: 8, height: 8, borderBottom: `1px solid ${cherubimGlow}`, borderRight: `1px solid ${cherubimGlow}`, borderRadius: 1, pointerEvents: 'none', transition: 'border-color 0.2s' }} />
              <div style={{ fontSize: 15, color: cherubimGlow, lineHeight: 1, opacity: hasCherubimInHand ? 0.85 : 0.38, transition: 'opacity 0.2s, color 0.2s', animation: hasCherubimInHand ? 'constellationGlimmer 3.5s ease-in-out infinite' : undefined }}>✦</div>
              <div style={{ fontSize: 6, color: cherubimGlow, marginTop: 5, letterSpacing: 1.5, textTransform: 'uppercase', opacity: hasCherubimInHand ? 0.8 : 0.38, transition: 'opacity 0.2s, color 0.2s' }}>
                {isDragTarget ? 'Drop Cherubim' : hasCherubimInHand ? 'Click or Drop' : 'Empty'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
