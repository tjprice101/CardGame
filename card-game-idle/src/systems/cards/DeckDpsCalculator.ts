import { CardRegistry } from '@/cards/CardRegistry';
import { resolveCardScaling } from '@/systems/cards/CardScaling';
import { ABILITY_REGISTRY } from '@/data/abilities/abilityDefinitions';
import type { LightCardDefinition, AinSophAurDefinition } from '@/types/cards';
import type { DeckEntry, ExtraDeckEntry } from '@/types/game';

export interface DeckDpsProjection {
  readonly threeMinuteDamage: number;
  readonly dps: number;
  readonly lightAttackDamage: number;
  readonly sophAttackDamage: number;
  readonly asaBridgeDamage: number;
  readonly abilityDamage: number;
  readonly placementDamage: number;
  readonly estimatedStacksPerTurn: number;
  readonly estimatedAsaActive: number;
  readonly collectionPower: number;
}

export const ESTIMATED_FIGHT_SECONDS = 180; // 3-minute combat horizon
export const SECONDS_PER_CARD_PLACEMENT = 2.25; // Average time to select and play 1 card from hand
export const SECONDS_PER_DARK_ACTIVATION = 1.5; // Additional activation time for Dark utility cards
export const MAX_BACK_ROW_SLOTS = 4; // Strict capacity for Light/Dark cards
export const MAX_FRONT_ROW_SLOTS = 4; // Strict capacity for Ain Soph Aur (ASA) cards
export const TOTAL_PLACEMENTS_IN_ROUND = Math.floor(ESTIMATED_FIGHT_SECONDS / SECONDS_PER_CARD_PLACEMENT); // ~80 placements
export const SOPH_CHARGE_PLACEMENTS_REQUIRED = 2; // Cards played to fully charge a Soph card before flip/sacrifice

/**
 * Calculates a precise, performance-optimized approximate DPS and 3-minute single-turn
 * damage projection for any given deck, taking into account:
 *  - Card placement cadence & total turn card budget in 180 seconds (~80 placements)
 *  - Soph charge time (2 placements per Soph flip)
 *  - Attack cooldowns measured in card placements required to reset
 *  - Back-row slot constraints & draw rates
 *  - ASA material placement setup cost before bridge attacks unlock
 *  - Pure Collection Power scaling & ASA on-board turn-wide Divine Light bonus
 */
export function calculateDeckDpsProjection(
  deckList: readonly DeckEntry[] | undefined,
  extraDeck: readonly ExtraDeckEntry[] | undefined,
  abilityLoadout: Partial<Record<1 | 2 | 3, string>> | undefined,
  collectionPower: number,
): DeckDpsProjection {
  const safeDeckList = Array.isArray(deckList) ? deckList : [];
  const safeExtraDeck = Array.isArray(extraDeck) ? extraDeck : [];

  const totalMainCards = safeDeckList.reduce((acc, entry) => acc + (entry?.copies ?? 0), 0);
  const totalExtraCards = safeExtraDeck.length;

  if (totalMainCards === 0 && totalExtraCards === 0) {
    return {
      threeMinuteDamage: 0,
      dps: 0,
      lightAttackDamage: 0,
      sophAttackDamage: 0,
      asaBridgeDamage: 0,
      abilityDamage: 0,
      placementDamage: 0,
      estimatedStacksPerTurn: 0,
      estimatedAsaActive: 0,
      collectionPower,
    };
  }

  // 1. Deck Composition Breakdown
  let lightCardCount = 0;
  let darkCardCount = 0;

  for (const entry of safeDeckList) {
    const def = CardRegistry.get(entry.definitionId);
    if (!def) continue;
    if (def.type === 'Light') {
      lightCardCount += entry.copies;
    } else if (def.type === 'Dark') {
      darkCardCount += entry.copies;
    }
  }

  // Active ASA Front Rank capacity (Max 4 slots)
  const estimatedAsaActive = Math.min(MAX_FRONT_ROW_SLOTS, totalExtraCards);

  // Stacks generated per turn from flips, sacrifices, and dark utility
  const estimatedStacksPerTurn = Math.max(
    1,
    Math.round((lightCardCount * 0.75) + (darkCardCount * 0.4) + (estimatedAsaActive * 0.5)),
  );

  const scalingContext = {
    limitlessLightStacks: estimatedStacksPerTurn,
    asaFrontCount: estimatedAsaActive,
    collectionPower: Math.max(0, collectionPower),
  };

  // Collection Power Multiplier from store.ts grantOblivion: min(3, 1 + collectionPower / 1000)
  const collectionPowerMult = Math.min(3, 1 + Math.max(0, collectionPower) / 1000);
  // Innate +1% Divine Light gain per active ASA on Front Rank
  const asaTurnBonusMult = 1 + (estimatedAsaActive / 100);
  // Combined DL scaling multiplier applied to all DL sources
  const totalDlMultiplier = collectionPowerMult * asaTurnBonusMult;

  // 2. Hand Maintenance & Dark Card Time Friction
  // Dark cards keep hand size consistent, but each Dark activation takes ~1.5s additional time.
  const darkRatio = darkCardCount / Math.max(1, totalMainCards);
  // Hand starvation penalty if Dark utility is under 15% of deck
  const handStarvationPenalty = darkRatio < 0.15 ? Math.max(0.7, 0.5 + darkRatio * 2) : 1.0;

  const effectiveSecondsPerPlacement = SECONDS_PER_CARD_PLACEMENT + (darkRatio * SECONDS_PER_DARK_ACTIVATION);
  const totalPlacementsAvailable = Math.floor((ESTIMATED_FIGHT_SECONDS * handStarvationPenalty) / effectiveSecondsPerPlacement);

  // 3. ASA Material Removal & Back-Row Capacity (Max 4 slots)
  // To summon an ASA, M back-row cards must be sacrificed / removed from play.
  let totalAsaSummonsPossible = 0;
  let asaMaterialPlacementsCost = 0;

  for (const extra of safeExtraDeck) {
    const def = CardRegistry.get(extra.definitionId);
    if (def && def.type === 'AinSophAur') {
      const asaDef = def as AinSophAurDefinition;
      const materialsNeeded = asaDef.summonMaterialCount ?? 1;
      totalAsaSummonsPossible += 1;
      // Each ASA requires M material placements + 1 summon placement action
      asaMaterialPlacementsCost += materialsNeeded + 1;
    }
  }

  // Slots freed by ASA material removal over 3 minutes
  const backRowSlotsFreedByAsa = Math.min(totalExtraCards, totalAsaSummonsPossible) * 2;
  // Total Light/Dark cards that can be placed on the 4 Back-Row slots in 180s
  const maxBackRowPlacementsPossible = MAX_BACK_ROW_SLOTS + backRowSlotsFreedByAsa + Math.floor(lightCardCount * 1.5);
  const mainDeckPlacementBudget = Math.min(totalPlacementsAvailable - asaMaterialPlacementsCost, maxBackRowPlacementsPossible);
  const safePlacementBudget = Math.max(1, mainDeckPlacementBudget);

  let lightAttackDamage = 0;
  let sophAttackDamage = 0;
  let placementDamage = 0;

  // 4. Light Card Cooldowns & Attack Cycles
  for (const entry of safeDeckList) {
    const def = CardRegistry.get(entry.definitionId);
    if (!def || def.type !== 'Light') continue;

    const lightDef = def as LightCardDefinition;
    const copies = entry.copies;
    const drawShare = copies / Math.max(1, totalMainCards);
    const placementsOfThisCard = Math.max(1, Math.round(safePlacementBudget * drawShare));

    // A. Ain Attack Modeling
    // Ain Attack takes 1 placement to enter Ain side, plus ainCd card placements to reset cooldown.
    const scaledAin = resolveCardScaling(lightDef.ainAttack.scaling, scalingContext);
    const singleAinHit = (lightDef.ainAttack.baseOblivion + scaledAin) * totalDlMultiplier;
    const ainCd = lightDef.ainAttack.cooldownCards ?? 1;
    // Harsher cooldown: cycle time is max(ainCd + 1, MAX_BACK_ROW_SLOTS)
    const ainCyclePlacements = Math.max(ainCd + 1, MAX_BACK_ROW_SLOTS);
    const ainExecutions = placementsOfThisCard / ainCyclePlacements;
    lightAttackDamage += singleAinHit * ainExecutions;

    // B. Soph Attack Modeling
    // Soph Attack requires placing on Soph side + 2 charge placements + sophCd card placements to reset cooldown.
    const scaledSoph = resolveCardScaling(lightDef.sophAttack.scaling, scalingContext);
    const singleSophHit = (lightDef.sophAttack.baseOblivion + scaledSoph) * totalDlMultiplier;
    const sophCd = lightDef.sophAttack.cooldownCards ?? 2;
    const sophCyclePlacements = Math.max(1 + SOPH_CHARGE_PLACEMENTS_REQUIRED + sophCd, MAX_BACK_ROW_SLOTS + 2);
    const sophExecutions = (placementsOfThisCard * 2.5) / sophCyclePlacements;
    sophAttackDamage += singleSophHit * sophExecutions;

    // C. Soph Placement Triggers
    if (lightDef.sophPlacementEffects && lightDef.sophPlacementEffects.length > 0) {
      for (const effect of lightDef.sophPlacementEffects) {
        if (effect.type === 'oblivion_flat') {
          placementDamage += effect.value * totalDlMultiplier * placementsOfThisCard;
        }
      }
    }
  }

  // 5. ASA Bridge Attacks (Front Rank 4 Slots)
  let asaBridgeDamage = 0;
  for (const extra of safeExtraDeck) {
    const def = CardRegistry.get(extra.definitionId);
    if (!def || def.type !== 'AinSophAur') continue;
    const asaDef = def as AinSophAurDefinition;

    if (asaDef.bridgeAttack) {
      const scaledBridge = resolveCardScaling(asaDef.bridgeAttack.scaling, scalingContext);
      const singleBridgeHit = (asaDef.bridgeAttack.baseOblivion + scaledBridge) * totalDlMultiplier;
      const bridgeCd = asaDef.bridgeAttack.cooldownCards ?? 2;
      // Remaining placements after ASA is summoned
      const remainingPlacementsAfterSummon = Math.max(1, safePlacementBudget - (asaDef.summonMaterialCount + 1));
      const bridgeCyclePlacements = Math.max(1 + bridgeCd, MAX_FRONT_ROW_SLOTS);
      const bridgeExecutions = remainingPlacementsAfterSummon / bridgeCyclePlacements;
      asaBridgeDamage += singleBridgeHit * bridgeExecutions;
    }

    if (asaDef.onSummonEffects) {
      for (const effect of asaDef.onSummonEffects) {
        if (effect.type === 'oblivion_flat') {
          placementDamage += effect.value * totalDlMultiplier * 2; // ~2 summons per 3-min fight
        }
      }
    }
  }

  // 6. Equipped Materialized Abilities
  let abilityDamage = 0;
  if (abilityLoadout) {
    for (const slot of [1, 2, 3] as const) {
      const abilityId = abilityLoadout[slot];
      if (!abilityId) continue;
      const ability = ABILITY_REGISTRY.get(abilityId);
      if (!ability) continue;

      if (ability.id === 'neutralizing-inferno') {
        const triggers = Math.floor(ESTIMATED_FIGHT_SECONDS / 30);
        abilityDamage += triggers * (estimatedStacksPerTurn * 500) * totalDlMultiplier;
      } else if (ability.id === 'nullified-barricade') {
        const cardsDuringField = Math.round(safePlacementBudget * (60 / ESTIMATED_FIGHT_SECONDS));
        abilityDamage += cardsDuringField * 50 * totalDlMultiplier;
      } else if (ability.id === 'axiomatic-reversal') {
        const triggers = ESTIMATED_FIGHT_SECONDS / 120;
        abilityDamage += triggers * 50_000 * totalDlMultiplier;
      } else if (ability.id === 'whiteout-domain') {
        const triggers = Math.max(1, Math.floor(ESTIMATED_FIGHT_SECONDS / 120));
        const cardsDuringWhiteout = Math.round(safePlacementBudget * ((triggers * 45) / ESTIMATED_FIGHT_SECONDS));
        abilityDamage += cardsDuringWhiteout * 100 * totalDlMultiplier;
      } else if (ability.id === 'infinite-accord') {
        abilityDamage += 10_000 * totalDlMultiplier;
      }
    }
  }

  const totalThreeMinuteDamage = Math.max(
    0,
    Math.round(lightAttackDamage + sophAttackDamage + asaBridgeDamage + abilityDamage + placementDamage),
  );
  const dps = Math.max(0, Math.round(totalThreeMinuteDamage / ESTIMATED_FIGHT_SECONDS));

  return {
    threeMinuteDamage: totalThreeMinuteDamage,
    dps,
    lightAttackDamage: Math.round(lightAttackDamage),
    sophAttackDamage: Math.round(sophAttackDamage),
    asaBridgeDamage: Math.round(asaBridgeDamage),
    abilityDamage: Math.round(abilityDamage),
    placementDamage: Math.round(placementDamage),
    estimatedStacksPerTurn,
    estimatedAsaActive,
    collectionPower,
  };
}
