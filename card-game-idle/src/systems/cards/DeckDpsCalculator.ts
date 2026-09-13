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

  // Aggregate deck card types
  let lightCardCount = 0;
  let darkCardCount = 0;

  for (const entry of safeDeckList) {
    const def = CardRegistry.get(entry.definitionId);
    if (!def) continue;
    if (def.type === 'Light') lightCardCount += entry.copies;
    else if (def.type === 'Dark') darkCardCount += entry.copies;
  }

  // Estimated average stacks and active ASA on Front Rank during combat
  const estimatedAsaActive = Math.min(4, totalExtraCards);
  const estimatedStacksPerTurn = Math.max(
    1,
    Math.round((lightCardCount * 0.75) + (darkCardCount * 0.4) + (estimatedAsaActive * 0.5)),
  );

  const scalingContext = {
    limitlessLightStacks: estimatedStacksPerTurn,
    asaFrontCount: estimatedAsaActive,
    collectionPower: Math.max(0, collectionPower),
  };

  // Turn-wide +1% DL bonus per active ASA on Front Rank
  const asaTurnBonusMult = 1 + (estimatedAsaActive / 100);

  let lightAttackDamage = 0;
  let sophAttackDamage = 0;
  let placementDamage = 0;

  // 1. ASA Setup Placements Cost
  // Each ASA requires M back-row material placements + 1 summon action.
  // This consumes placements from the total 180s placement budget before ASA bridge attacks begin.
  let asaSetupPlacements = 0;
  for (const extra of safeExtraDeck) {
    const def = CardRegistry.get(extra.definitionId);
    if (def && def.type === 'AinSophAur') {
      const asaDef = def as AinSophAurDefinition;
      const materialsNeeded = asaDef.summonMaterialCount ?? 1;
      asaSetupPlacements += materialsNeeded + 1; // Material plays + summon action
    }
  }

  // Placements available for main-deck attack cooldown cycles
  const mainDeckPlacementBudget = Math.max(1, TOTAL_PLACEMENTS_IN_ROUND - asaSetupPlacements);

  // 2. Light Card Attack Cooldown & Placement Modeling
  for (const entry of safeDeckList) {
    const def = CardRegistry.get(entry.definitionId);
    if (!def || def.type !== 'Light') continue;

    const lightDef = def as LightCardDefinition;
    const copies = entry.copies;

    // Proportion of total placements this card definition gets when drawn
    const drawShare = copies / Math.max(1, totalMainCards);
    const estimatedPlacementsOfThisCard = Math.max(1, Math.round(mainDeckPlacementBudget * drawShare));

    // A. Ain Attack Modeling
    // Ain Attack takes 1 placement to enter Ain side, plus ainCd card placements to reset cooldown.
    const scaledAin = resolveCardScaling(lightDef.ainAttack.scaling, scalingContext);
    const singleAinHit = (lightDef.ainAttack.baseOblivion + scaledAin) * asaTurnBonusMult;
    const ainCd = lightDef.ainAttack.cooldownCards ?? 1;
    // Each Ain attack execution requires (1 + ainCd) card placements from hand to reset cooldown.
    const ainExecutionsPerPlacement = 1 / (1 + ainCd);
    const totalAinExecutions = estimatedPlacementsOfThisCard * ainExecutionsPerPlacement;
    lightAttackDamage += singleAinHit * totalAinExecutions;

    // B. Soph Attack Modeling
    // Soph Attack requires placing on Soph side + 2 charge placements + sophCd card placements to reset cooldown.
    const scaledSoph = resolveCardScaling(lightDef.sophAttack.scaling, scalingContext);
    const singleSophHit = (lightDef.sophAttack.baseOblivion + scaledSoph) * asaTurnBonusMult;
    const sophCd = lightDef.sophAttack.cooldownCards ?? 2;
    // Total placements required for one Soph attack cycle = Soph placement + Soph charge delay (2) + cooldown cards
    const totalPlacementsPerSophCycle = 1 + SOPH_CHARGE_PLACEMENTS_REQUIRED + sophCd;
    const totalSophExecutions = (estimatedPlacementsOfThisCard * 3) / totalPlacementsPerSophCycle;
    sophAttackDamage += singleSophHit * totalSophExecutions;

    // C. Soph Placement Triggers
    if (lightDef.sophPlacementEffects && lightDef.sophPlacementEffects.length > 0) {
      for (const effect of lightDef.sophPlacementEffects) {
        if (effect.type === 'oblivion_flat') {
          placementDamage += effect.value * asaTurnBonusMult * estimatedPlacementsOfThisCard;
        }
      }
    }
  }

  // 3. Ain Soph Aur (Extra Deck) Bridge Attacks with Cooldown & Setup Modeling
  let asaBridgeDamage = 0;
  for (const extra of safeExtraDeck) {
    const def = CardRegistry.get(extra.definitionId);
    if (!def || def.type !== 'AinSophAur') continue;
    const asaDef = def as AinSophAurDefinition;

    if (asaDef.bridgeAttack) {
      const scaledBridge = resolveCardScaling(asaDef.bridgeAttack.scaling, scalingContext);
      const singleBridgeHit = (asaDef.bridgeAttack.baseOblivion + scaledBridge) * asaTurnBonusMult;
      const bridgeCd = asaDef.bridgeAttack.cooldownCards ?? 2;
      // Remaining placements after ASA is summoned
      const remainingPlacementsAfterSummon = Math.max(1, TOTAL_PLACEMENTS_IN_ROUND - (asaDef.summonMaterialCount + 1));
      // Placements needed per Bridge attack cycle = 1 attack + bridgeCd card placements to reset
      const bridgeExecutions = remainingPlacementsAfterSummon / (1 + bridgeCd);
      asaBridgeDamage += singleBridgeHit * bridgeExecutions;
    }

    if (asaDef.onSummonEffects) {
      for (const effect of asaDef.onSummonEffects) {
        if (effect.type === 'oblivion_flat') {
          placementDamage += effect.value * asaTurnBonusMult * 2; // ~2 summons per 3-min fight
        }
      }
    }
  }

  // 4. Equipped Materialized Abilities (Time Cooldowns)
  let abilityDamage = 0;
  if (abilityLoadout) {
    for (const slot of [1, 2, 3] as const) {
      const abilityId = abilityLoadout[slot];
      if (!abilityId) continue;
      const ability = ABILITY_REGISTRY.get(abilityId);
      if (!ability) continue;

      if (ability.id === 'neutralizing-inferno') {
        const triggers = Math.floor(ESTIMATED_FIGHT_SECONDS / 30); // 30s cd = 6 triggers in 180s
        abilityDamage += triggers * (estimatedStacksPerTurn * 500) * asaTurnBonusMult;
      } else if (ability.id === 'nullified-barricade') {
        // Divine Field (+50 DL per card played during 60s active window)
        const cardsDuringField = Math.round(TOTAL_PLACEMENTS_IN_ROUND * (60 / ESTIMATED_FIGHT_SECONDS));
        abilityDamage += cardsDuringField * 50 * asaTurnBonusMult;
      } else if (ability.id === 'axiomatic-reversal') {
        // 50,000 DL on 120s cd (1.5 triggers in 180s)
        const triggers = ESTIMATED_FIGHT_SECONDS / 120;
        abilityDamage += triggers * 50_000 * asaTurnBonusMult;
      } else if (ability.id === 'whiteout-domain') {
        // Whiteout Domain (+100 DL per card played during 45s active window, 120s cd)
        const triggers = Math.max(1, Math.floor(ESTIMATED_FIGHT_SECONDS / 120));
        const cardsDuringWhiteout = Math.round(TOTAL_PLACEMENTS_IN_ROUND * ((triggers * 45) / ESTIMATED_FIGHT_SECONDS));
        abilityDamage += cardsDuringWhiteout * 100 * asaTurnBonusMult;
      } else if (ability.id === 'infinite-accord') {
        // 10,000 DL on 180s cd
        abilityDamage += 10_000 * asaTurnBonusMult;
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
