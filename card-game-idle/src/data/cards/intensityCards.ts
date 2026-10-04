import type { CardDefinition, CardRarity, LightCardDefinition, SpectrumLevel } from '@/types/cards';
import type { CardEffect } from '@/types/effects';
import { getSpectrumAinBase, getSpectrumBridgeBase, getSpectrumScaling, getSpectrumSophBase } from './spectrumPower';

const slug = (name: string): string => name.toLowerCase().replace(/['’,]/g, '').replace(/ /g, '-');
const identity = (name: string, type: CardDefinition['type'], rarity: CardRarity) => {
  const prefix = rarity === 'Eternal' ? 'eternal' : rarity === 'Infinite' ? 'infinite' : type === 'AinSophAur' ? 'ain-soph-aur' : type.toLowerCase();
  return `${prefix}-intensity-${slug(name)}`;
};
const origin = (rarity: CardRarity) => rarity === 'Eternal' ? 'boss' as const : rarity === 'Infinite' ? 'infinite' as const : 'base' as const;

function light(name: string, level: SpectrumLevel, rarity: CardRarity, description: string, effects: CardEffect[]): LightCardDefinition {
  const id = identity(name, 'Light', rarity);
  const ain = getSpectrumAinBase(rarity, level, origin(rarity));
  const soph = getSpectrumSophBase(rarity, level, origin(rarity));
  const inferno = level >= 3;
  const cost = inferno ? level + (rarity === 'Infinite' ? 3 : rarity === 'Eternal' ? 1 : 0) : 1;
  return {
    definitionId: id, type: 'Light', name, rarity, spectrumLevel: level, description: `Soph placement: ${description}`, artKey: id.replace(/-/g, '_'),
    ainAttack: {
      id: `${id}:ain-attack`, label: 'Ain', name: 'Ashlight Strike', description: `${ain} base Divine Light, scaled by Collection Power.`,
      baseDivineLight: ain, cooldownCards: 2, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(ain) }, tags: ['intensity', 'ain-attack'],
    },
    sophAttack: {
      id: `${id}:soph-attack`, label: 'Soph', name: inferno ? 'Last Seam Eruption' : 'White Ember Strike',
      description: `${soph} base Divine Light, scaled by Collection Power. Consume ${cost} Limitless ${inferno ? 'Inferno' : 'Light'} Stacks.`,
      baseDivineLight: soph, cooldownCards: 3, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(soph) },
      stackCost: { kind: 'fixed', value: cost }, stackResource: inferno ? 'inferno' : 'light', tags: ['intensity', 'soph-attack'],
    },
    sophPlacementEffects: effects, sacrificeStackRate: 25,
  };
}

function dark(name: string, level: SpectrumLevel, rarity: CardRarity, description: string, effects: CardEffect[]): CardDefinition {
  const id = identity(name, 'Dark', rarity);
  return {
    definitionId: id, type: 'Dark', name, rarity, spectrumLevel: level, description, artKey: id.replace(/-/g, '_'),
    sophEffects: effects, activationCost: { kind: 'fixed', value: level < 2 ? 0 : 1 },
    cooldownCardsPlayed: 3, postActivationFate: level === 0 ? 'discard' : 'hand', persistent: level > 0, sacrificeStackRate: 25,
  };
}

function asa(name: string, level: SpectrumLevel, rarity: CardRarity, description: string, effects: CardEffect[]): CardDefinition {
  const id = identity(name, 'AinSophAur', rarity);
  const base = getSpectrumBridgeBase(rarity, level, origin(rarity));
  return {
    definitionId: id, type: 'AinSophAur', name, rarity, spectrumLevel: level, description, artKey: id.replace(/-/g, '_'),
    summonMaterialCount: 2, summonMaterials: [{ cardTypes: ['Light'], count: 1 }, { cardTypes: ['Dark'], count: 1 }],
    onSummonEffects: effects,
    bridgeAttack: {
      id: `${id}:bridge`, name: 'Bridge the Last Seam', description: `${base} base Divine Light, scaled by Collection Power.`,
      baseDivineLight: base, cooldownCards: 3, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(base) },
    },
  };
}

export const paleventHerald = light('Palevent Herald', 0, 'Common',
  'Kindle 2 Inferno if your furnace is empty; otherwise draw 1. Gain 1 Light Stack.',
  [{ type: 'inferno_threshold_draw', threshold: 1, belowGain: 2, draw: 1 }, { type: 'light_stacks_flat', value: 1 }]);

export const intensityBaseCards: CardDefinition[] = [
  paleventHerald,
  dark('Nacreless Choir', 0, 'Common', 'Store 2 embers. Your next two Intensity hand plays each kindle 1 Inferno.',
    [{ type: 'inferno_embers', value: 2 }]),
  light('Handful of Daybreak', 0, 'Common', 'Kindle 1 Inferno for each Soph-side card on your board.',
    [{ type: 'inferno_board_kindle', perCard: 1, side: 'soph' }]),
  dark('Relics Beneath the Burn', 0, 'Common', 'Cycle the leftmost other hand card to the bottom of the deck, draw its replacement, and kindle 2 Inferno.',
    [{ type: 'inferno_ash_cycle', count: 1, perCard: 2 }]),
  light("Caldera's First Breath", 1, 'Rare', 'Give each Soph support 1 charge and kindle 1 Inferno per charged support.',
    [{ type: 'inferno_charge_forge', charge: 1, perCharged: 1 }]),
  dark('Maw Beneath Morning', 1, 'Rare', 'With 3+ Inferno, return the oldest Intensity Light/Dark discard to hand and kindle 2 Inferno.',
    [{ type: 'inferno_recall', count: 1, minInferno: 3, perCard: 2 }]),
  light('The Unburning Boundary', 1, 'Rare', 'Kindle 1 Inferno, then double your next positive Inferno gain this turn.',
    [{ type: 'inferno_next_gain', multiplier: 2, kindle: 1 }]),
  dark('Vestment of the Buried Sun', 1, 'Rare', 'Prepare your next high-level Light Soph attack with 30 bonus Divine Light per current Inferno, up to 300.',
    [{ type: 'inferno_temper', perStack: 30, cap: 300 }]),
  dark('Throat of the Deep', 2, 'Rare', 'Cycle your leftmost two other hand cards and kindle 1 Inferno per replacement.',
    [{ type: 'inferno_ash_cycle', count: 2, perCard: 1 }]),
  light('A Horizon Set Alight', 2, 'Rare', 'At 5+ Inferno draw 2; below it kindle 3. Store an ember for your next Intensity hand play.',
    [{ type: 'inferno_threshold_draw', threshold: 5, belowGain: 3, draw: 2 }, { type: 'inferno_embers', value: 1 }]),
  dark('What the Depths Remember', 2, 'Rare', 'Kindle 2 Inferno per distinct Intensity card in discard, up to 6.',
    [{ type: 'inferno_memory', perDistinct: 2, cap: 6 }]),
  light('The Chosen Remnant', 3, 'Epic', 'Rekindle half the Inferno spent this turn, minimum 2, then prepare 25 bonus Divine Light per current Inferno, up to 400.',
    [{ type: 'inferno_rekindle', fraction: 0.5, minimum: 2 }, { type: 'inferno_temper', perStack: 25, cap: 400 }]),
  dark('The Earth Refuses Silence', 3, 'Epic', 'Kindle 2 Inferno for each complete 4 Inferno generated this turn, up to 6.',
    [{ type: 'inferno_pressure', divisor: 4, perStep: 2, cap: 6 }]),
  asa('The Unsevered Contradiction', 3, 'Epic', 'Kindle 3 Inferno per remaining Light/Dark pair and 1 per unpaired support. Store 2 embers.',
    [{ type: 'inferno_balance', perPair: 3, unmatchedGain: 1 }, { type: 'inferno_embers', value: 2 }]),
  asa('Fifth Pulse, Open Heaven', 4, 'Epic', 'At 5+ Inferno release 350 Divine Light without spending it, then kindle 3 and triple your next gain.',
    [{ type: 'inferno_eruption', threshold: 5, divineLight: 350, kindle: 3 }, { type: 'inferno_next_gain', multiplier: 3, kindle: 0 }]),
  dark('Night That Burns Forever', 4, 'Epic', 'Rekindle all Inferno spent this turn, minimum 3. Store 3 embers.',
    [{ type: 'inferno_rekindle', fraction: 1, minimum: 3 }, { type: 'inferno_embers', value: 3 }]),
  asa('The Weight of All Horizons', 5, 'Legendary', 'Kindle 2 Inferno per remaining Ain card, then bank up to 800 bonus Divine Light at 40 per Inferno.',
    [{ type: 'inferno_board_kindle', perCard: 2, side: 'ain' }, { type: 'inferno_temper', perStack: 40, cap: 800 }]),
  asa('When Both Ends Meet', 5, 'Legendary', 'Kindle 5 per support pair and 2 per unpaired support. With 8+ Inferno recall the oldest Intensity Light/Dark discard, kindling 1.',
    [{ type: 'inferno_balance', perPair: 5, unmatchedGain: 2 }, { type: 'inferno_recall', count: 1, minInferno: 8, perCard: 1 }]),
  asa('Center of the Unmaking', 5, 'Legendary', 'At 10+ Inferno release 650 Divine Light, kindle 4, then cycle two hand cards for 2 Inferno each.',
    [{ type: 'inferno_eruption', threshold: 10, divineLight: 650, kindle: 4 }, { type: 'inferno_ash_cycle', count: 2, perCard: 2 }]),
];

export const intensityEternalCards: CardDefinition[] = [
  dark('Cathedral Below All Seas', 3, 'Eternal', 'With 6+ Inferno recall the oldest two Intensity Light/Dark discards, kindle 2 each, then temper your next eruption by 60 per Inferno, up to 1200.',
    [{ type: 'inferno_recall', count: 2, minInferno: 6, perCard: 2 }, { type: 'inferno_temper', perStack: 60, cap: 1200 }]),
  asa('The Crown Divided Against Itself', 3, 'Eternal', 'Kindle 4 per remaining support pair and 2 per unpaired support, then kindle 2 and double the next gain.',
    [{ type: 'inferno_balance', perPair: 4, unmatchedGain: 2 }, { type: 'inferno_next_gain', multiplier: 2, kindle: 2 }]),
  light('Sovereign of Unbearable Noon', 3, 'Eternal', 'At 8+ Inferno draw 2; otherwise kindle 5. Prepare 75 bonus Divine Light per Inferno, up to 1500.',
    [{ type: 'inferno_threshold_draw', threshold: 8, belowGain: 5, draw: 2 }, { type: 'inferno_temper', perStack: 75, cap: 1500 }]),
  dark('The Bell That Buries Distance', 3, 'Eternal', 'Cycle the leftmost three other hand cards for 2 Inferno each, then rekindle half the spent Inferno, minimum 2.',
    [{ type: 'inferno_ash_cycle', count: 3, perCard: 2 }, { type: 'inferno_rekindle', fraction: 0.5, minimum: 2 }]),
  asa('Verdict After the Last Dawn', 3, 'Eternal', 'Kindle 3 per distinct Intensity discard, up to 12. At 12+ Inferno release 1200 Divine Light and kindle 2.',
    [{ type: 'inferno_memory', perDistinct: 3, cap: 12 }, { type: 'inferno_eruption', threshold: 12, divineLight: 1200, kindle: 2 }]),
];

export const intensityInfiniteCards: CardDefinition[] = [
  dark('The Unfathomed Return', 4, 'Infinite', 'With 10+ Inferno recall the oldest three Intensity Light/Dark discards for 2 Inferno each, then rekindle all spent Inferno, minimum 4.',
    [{ type: 'inferno_recall', count: 3, minInferno: 10, perCard: 2 }, { type: 'inferno_rekindle', fraction: 1, minimum: 4 }]),
  asa('Crown With No Final King', 4, 'Infinite', 'Kindle 6 per remaining support pair and 3 per unpaired support. Store 5 embers and triple your next gain.',
    [{ type: 'inferno_balance', perPair: 6, unmatchedGain: 3 }, { type: 'inferno_embers', value: 5 }, { type: 'inferno_next_gain', multiplier: 3, kindle: 0 }]),
  light('Daybreak Without End', 4, 'Infinite', 'At 12+ Inferno draw 3; otherwise kindle 8. Kindle 3 and double the next gain, then temper 100 Divine Light per Inferno, up to 2400.',
    [{ type: 'inferno_threshold_draw', threshold: 12, belowGain: 8, draw: 3 }, { type: 'inferno_next_gain', multiplier: 2, kindle: 3 }, { type: 'inferno_temper', perStack: 100, cap: 2400 }]),
  asa('A Furnace Outside Time', 5, 'Infinite', 'Give all Soph supports 2 charge and kindle 3 per charged support, then kindle 3 per 6 Inferno generated this turn, up to 12.',
    [{ type: 'inferno_charge_forge', charge: 2, perCharged: 3 }, { type: 'inferno_pressure', divisor: 6, perStep: 3, cap: 12 }]),
  asa('The Seam That Holds Eternity', 5, 'Infinite', 'Rekindle all spent Inferno, minimum 6. At 16+ Inferno release 2400 Divine Light and kindle 4; prepare 100 per Inferno, up to 3000.',
    [{ type: 'inferno_rekindle', fraction: 1, minimum: 6 }, { type: 'inferno_eruption', threshold: 16, divineLight: 2400, kindle: 4 }, { type: 'inferno_temper', perStack: 100, cap: 3000 }]),
];

export const intensityCards: CardDefinition[] = [...intensityBaseCards, ...intensityEternalCards, ...intensityInfiniteCards];
export const INTENSITY_PACK_POOL = intensityBaseCards.map(card => card.definitionId);
