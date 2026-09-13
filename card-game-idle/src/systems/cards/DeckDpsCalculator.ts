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

export const ESTIMATED_FIGHT_SECONDS = 180; // 3 minutes

/**
 * Calculates a high-performance approximate DPS and 3-minute single-turn damage projection
 * for any given deck composition, extra deck, and ability loadout.
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

  // Estimated average stacks and active ASA on Front Rank during a 3-minute combat
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

  const asaTurnBonusMult = 1 + (estimatedAsaActive / 100);

  let lightAttackDamage = 0;
  let sophAttackDamage = 0;
  let placementDamage = 0;

  // Board presence divisor: player maintains 4 back-row slots
  const boardPresenceWeight = Math.min(1, 4 / Math.max(1, totalMainCards));

  for (const entry of safeDeckList) {
    const def = CardRegistry.get(entry.definitionId);
    if (!def) continue;

    if (def.type === 'Light') {
      const lightDef = def as LightCardDefinition;
      const copies = entry.copies;

      // 1. Ain Attack
      const scaledAin = resolveCardScaling(lightDef.ainAttack.scaling, scalingContext);
      const singleAinHit = (lightDef.ainAttack.baseOblivion + scaledAin) * asaTurnBonusMult;
      const ainCd = lightDef.ainAttack.cooldownCards ?? 1;
      const ainFrequencyInRound = (ESTIMATED_FIGHT_SECONDS / Math.max(2.5, (ainCd + 1) * 2.2)) * (copies * boardPresenceWeight);
      lightAttackDamage += singleAinHit * ainFrequencyInRound;

      // 2. Soph Attack
      const scaledSoph = resolveCardScaling(lightDef.sophAttack.scaling, scalingContext);
      const singleSophHit = (lightDef.sophAttack.baseOblivion + scaledSoph) * asaTurnBonusMult;
      const sophCd = lightDef.sophAttack.cooldownCards ?? 2;
      const sophFrequencyInRound = (ESTIMATED_FIGHT_SECONDS / Math.max(3.5, (sophCd + 1) * 2.8)) * (copies * boardPresenceWeight);
      sophAttackDamage += singleSophHit * sophFrequencyInRound;

      // 3. Soph placement effects
      if (lightDef.sophPlacementEffects && lightDef.sophPlacementEffects.length > 0) {
        for (const effect of lightDef.sophPlacementEffects) {
          if (effect.type === 'oblivion_flat') {
            const estimatedPlacements = (ESTIMATED_FIGHT_SECONDS / 4.5) * (copies / Math.max(1, totalMainCards));
            placementDamage += effect.value * asaTurnBonusMult * estimatedPlacements;
          }
        }
      }
    }
  }

  // 4. Ain Soph Aur (Extra Deck) Bridge Attacks
  let asaBridgeDamage = 0;
  for (const extra of safeExtraDeck) {
    const def = CardRegistry.get(extra.definitionId);
    if (!def || def.type !== 'AinSophAur') continue;
    const asaDef = def as AinSophAurDefinition;

    if (asaDef.bridgeAttack) {
      const scaledBridge = resolveCardScaling(asaDef.bridgeAttack.scaling, scalingContext);
      const singleBridgeHit = (asaDef.bridgeAttack.baseOblivion + scaledBridge) * asaTurnBonusMult;
      const bridgeCd = asaDef.bridgeAttack.cooldownCards ?? 2;
      const bridgeFrequency = ESTIMATED_FIGHT_SECONDS / Math.max(3.5, (bridgeCd + 1) * 2.5);
      asaBridgeDamage += singleBridgeHit * bridgeFrequency;
    }

    if (asaDef.onSummonEffects) {
      for (const effect of asaDef.onSummonEffects) {
        if (effect.type === 'oblivion_flat') {
          placementDamage += effect.value * asaTurnBonusMult * 2; // ~2 summons in 3 mins
        }
      }
    }
  }

  // 5. Equipped Materialized Abilities
  let abilityDamage = 0;
  if (abilityLoadout) {
    const estimatedCardsPlayedIn180s = Math.min(90, Math.max(15, totalMainCards * 1.5));

    for (const slot of [1, 2, 3] as const) {
      const abilityId = abilityLoadout[slot];
      if (!abilityId) continue;
      const ability = ABILITY_REGISTRY.get(abilityId);
      if (!ability) continue;

      if (ability.id === 'neutralizing-inferno') {
        const triggers = ESTIMATED_FIGHT_SECONDS / 30; // 30s cd = 6 triggers
        abilityDamage += triggers * (estimatedStacksPerTurn * 500) * asaTurnBonusMult;
      } else if (ability.id === 'nullified-barricade') {
        // Divine Field (+50 DL per card played during 60s window)
        const cardsDuringField = Math.round(estimatedCardsPlayedIn180s * (60 / 180));
        abilityDamage += cardsDuringField * 50 * asaTurnBonusMult;
      } else if (ability.id === 'axiomatic-reversal') {
        // 50,000 DL on 120s cd (1.5 triggers in 180s)
        const triggers = ESTIMATED_FIGHT_SECONDS / 120;
        abilityDamage += triggers * 50_000 * asaTurnBonusMult;
      } else if (ability.id === 'whiteout-domain') {
        // Whiteout Domain (+100 DL per card played during 45s window, 120s cd)
        const triggers = Math.max(1, Math.floor(ESTIMATED_FIGHT_SECONDS / 120));
        const cardsDuringWhiteout = Math.round(estimatedCardsPlayedIn180s * ((triggers * 45) / 180));
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
