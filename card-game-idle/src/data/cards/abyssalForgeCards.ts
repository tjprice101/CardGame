import type { AngelDefinition, CardDefinition, CherubimDefinition, OphanimDefinition, SeraphimDefinition } from '@/types/cards';

// ����������������������������������������������������������������������������������������������������������������������������������������������������������
// Abyssal Forge ? "The Reforging"
// ����������������������������������������������������������������������������������������������������������������������������������������������������������
//
// Set #15. Comes after Eternal Seas. Core mechanic: a per-turn Recast Ledger
// records every card played; Forge cards reach back into the ledger and
// re-fire prior plays at fractional power. Eternal cards introduce Nacre
// Recasts (full-power re-fires). Infinite cards introduce the Unrecorded Hue
// (rest-of-turn auto-recasts) and Ouroboric Recast (re-fire every entry).
//
// Engine: see `CardEffectExecutor.ts` for forge_* effect handlers and the
// ensureForgeTurn helper. Per-turn state lives on TurnState.

const ABYSSAL_FORGE = 'AbyssalForge' as const;

type SeraphSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: SeraphimDefinition['rarity'];
  artKey: string;
  bonusType: SeraphimDefinition['baseStats']['bonusType'];
  bonusValue: number;
  onPlayEffects: SeraphimDefinition['onPlayEffects'];
  unsynergizedName: string;
  synergizedName: string;
  unsynergizedBase: number;
  synergizedBase: number;
  unsynergizedCooldown: number;
  synergizedCooldown: number;};

type CherubSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: CherubimDefinition['rarity'];
  artKey: string;
  maxDurability?: number;
  effects: CherubimDefinition['effects'];
  onPlayEffects: CherubimDefinition['onPlayEffects'];
};

type OphanimSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: OphanimDefinition['rarity'];
  artKey: string;
  effects: OphanimDefinition['effects'];
};

type AngelSpec = {
  definitionId: string;
  name: string;
  description: string;
  rarity: AngelDefinition['rarity'];
  artKey: string;
  summonCost: string[];
  onSummonEffects: AngelDefinition['onSummonEffects'];
  activatedAbility: AngelDefinition['activatedAbility'];
  primaryName: string;
  exaltedName: string;
  primaryBase: number;
  exaltedBase: number;
  primaryCooldown: number;
  exaltedCooldown: number;
  primaryScaling: number;
  exaltedScaling: number;
  baseStats: AngelDefinition['baseStats'];
};

function buildSeraphim(spec: SeraphSpec): SeraphimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Seraphim',
    element: ABYSSAL_FORGE,
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    baseStats: {
      bonusType: spec.bonusType,
      bonusValue: spec.bonusValue,
      synergyRequirement: ABYSSAL_FORGE,
    },
    onPlayEffects: spec.onPlayEffects,
    attacks: {
      unsynergized: {
        id: `${spec.definitionId}:unsyn`,
        label: 'Unsynergized',
        name: spec.unsynergizedName,
        description: 'Forge-hammer strike.',
        baseOblivion: spec.unsynergizedBase,
        cooldownCards: spec.unsynergizedCooldown,
        costs: [],
      },
      synergized: {
        id: `${spec.definitionId}:syn`,
        label: 'Synergized',
        name: spec.synergizedName,
        description: 'Re-tempered cut.',
        baseOblivion: spec.synergizedBase,
        cooldownCards: spec.synergizedCooldown,
        costs: [],
        requiresAngelOnBoard: true,
      },
    },
  };
}

function buildCherubim(spec: CherubSpec): CherubimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Cherubim',
    element: ABYSSAL_FORGE,
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    ...(spec.maxDurability !== undefined ? { maxDurability: spec.maxDurability } : {}),
    effects: spec.effects,
    onPlayEffects: spec.onPlayEffects,
  };
}

function buildOphanim(spec: OphanimSpec): OphanimDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Ophanim',
    element: ABYSSAL_FORGE,
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    effects: spec.effects,
  };
}

function buildAngel(spec: AngelSpec): AngelDefinition {
  return {
    definitionId: spec.definitionId,
    type: 'Angel',
    element: ABYSSAL_FORGE,
    rarity: spec.rarity,
    name: spec.name,
    description: spec.description,
    artKey: spec.artKey,
    summonCost: spec.summonCost,
    onSummonEffects: spec.onSummonEffects,
    activatedAbility: spec.activatedAbility,
    attacks: {
      primary: {
        id: `${spec.definitionId}:primary`,
        label: 'Primary',
        name: spec.primaryName,
        description: 'Hammer-strike.',
        baseOblivion: spec.primaryBase,
        cooldownCards: spec.primaryCooldown,
        costs: [],
      },
      exalted: {
        id: `${spec.definitionId}:exalted`,
        label: 'Exalted',
        name: spec.exaltedName,
        description: 'Reforged apex.',
        baseOblivion: spec.exaltedBase,
        cooldownCards: spec.exaltedCooldown,
        costs: [],
      },
    },
    baseStats: spec.baseStats,
  };
}

// ���� Seraphim (8) ������������������������������������������������������������������������������������������������������������������������
const baseSeraphim: SeraphimDefinition[] = [
  buildSeraphim({
    definitionId: 'af-ser-lampfin-minnow-choir',
    name: 'Lampfin Minnow Choir',
    description: 'On play: Gain 1 Reforge Charge; Draw 1 card. While on board: +10 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'af_ser_lampfin_minnow_choir',
    bonusType: 'oblivion_per_card',
    bonusValue: 10,
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 1 }, { type: 'draw', value: 1 }],
    unsynergizedName: 'Lamp Strike',
    synergizedName: 'Choir Strike',
    unsynergizedBase: 230, synergizedBase: 404,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'af-ser-slagback-crawler',
    name: 'Slagback Crawler',
    description: 'On play: Gain 1 Reforge Charge; Recast 1 random played card at 25% power. While on board: +24 Oblivion per card played while active',
    rarity: 'Common',
    artKey: 'af_ser_slagback_crawler',
    bonusType: 'oblivion_per_card',
    bonusValue: 24,
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 1 }, { type: 'forge_recast_random', power: 0.25, count: 1 }],
    unsynergizedName: 'Slag Bite',
    synergizedName: 'Slag Rend',
    unsynergizedBase: 242, synergizedBase: 416,
    unsynergizedCooldown: 4, synergizedCooldown: 5,
  }),
  buildSeraphim({
    definitionId: 'af-ser-helith-nun-saffron-eel',
    name: 'Helith-nun, Saffron Eel',
    description: 'On play: Gain 2 Reforge Charges; Temper this card: x0.5 power. While on board: +14 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'af_ser_helith_nun_saffron_eel',
    bonusType: 'oblivion_per_card',
    bonusValue: 14,
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 2 }, { type: 'forge_temper', targetMode: 'self', factor: 0.5 }],
    unsynergizedName: 'Saffron Coil',
    synergizedName: 'Tempered Coil',
    unsynergizedBase: 360, synergizedBase: 620,
    unsynergizedCooldown: 4, synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'af-ser-coalfin-pilgrim-shark',
    name: 'Coalfin Pilgrim Shark',
    description: 'On play: Gain 1 Reforge Charge; Drop 1 Pearl; Recast last card at 50% power. While on board: +36 Oblivion per card played while active',
    rarity: 'Rare',
    artKey: 'af_ser_coalfin_pilgrim_shark',
    bonusType: 'oblivion_per_card',
    bonusValue: 36,
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 1 }, { type: 'forge_pearl_drop', value: 1 }, { type: 'forge_recast_last', power: 0.5 }],
    unsynergizedName: 'Pilgrim Bite',
    synergizedName: 'Coalfin Rend',
    unsynergizedBase: 372, synergizedBase: 636,
    unsynergizedCooldown: 4, synergizedCooldown: 6,
  }),
  buildSeraphim({
    definitionId: 'af-ser-cerumel-verdant-anglerfish',
    name: 'Cerumel, The Verdant Anglerfish',
    description: 'On play: Gain 2 Reforge Charges; Recast last card at 75% power; Drop 1 Pearl. While on board: +18 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'af_ser_cerumel_verdant_anglerfish',
    bonusType: 'oblivion_per_card',
    bonusValue: 18,
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 2 }, { type: 'forge_recast_last', power: 0.75 }, { type: 'forge_pearl_drop', value: 1 }],
    unsynergizedName: 'Verdant Lure',
    synergizedName: 'Anglerfish Verdict',
    unsynergizedBase: 620, synergizedBase: 1080,
    unsynergizedCooldown: 5, synergizedCooldown: 7,
  }),
  buildSeraphim({
    definitionId: 'af-ser-ophrax-vermilion-kraken',
    name: 'Ophrax, The Vermilion Kraken',
    description: 'On play: Gain 2 Reforge Charges; Recast last 3 cards at 50% power. While on board: +56 Oblivion per card played while active',
    rarity: 'Epic',
    artKey: 'af_ser_ophrax_vermilion_kraken',
    bonusType: 'oblivion_per_card',
    bonusValue: 56,
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 2 }, { type: 'forge_recast_last_n', count: 3, power: 0.5 }],
    unsynergizedName: 'Kraken Lash',
    synergizedName: 'Vermilion Verdict',
    unsynergizedBase: 640, synergizedBase: 1108,
    unsynergizedCooldown: 5, synergizedCooldown: 7,
  }),
  buildSeraphim({
    definitionId: 'af-ser-tessareth-opal-manta',
    name: 'Tessareth, The Opal Manta',
    description: 'On play: Gain 3 Reforge Charges; Drop 2 Pearls; Recast last 2 cards at 75% power; Draw 1 card. While on board: +24 Oblivion per card played while active',
    rarity: 'Legendary',
    artKey: 'af_ser_tessareth_opal_manta',
    bonusType: 'oblivion_per_card',
    bonusValue: 24,
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 3 }, { type: 'forge_pearl_drop', value: 2 }, { type: 'forge_recast_last_n', count: 2, power: 0.75 }, { type: 'draw', value: 1 }],
    unsynergizedName: 'Opal Glide',
    synergizedName: 'Opal Manta Verdict',
    unsynergizedBase: 880, synergizedBase: 1500,
    unsynergizedCooldown: 6, synergizedCooldown: 8,
  }),
  buildSeraphim({
    definitionId: 'af-ser-vairoch-sapphire-bellows',
    name: 'Vairoch, The Sapphire Bellows',
    description: 'On play: Gain 3 Reforge Charges; Anvil-Seal this card (+1400 Oblivion bonus on next play). While on board: +88 Oblivion per card played while active',
    rarity: 'Legendary',
    artKey: 'af_ser_vairoch_sapphire_bellows',
    bonusType: 'oblivion_per_card',
    bonusValue: 88,
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 3 }, { type: 'forge_anvil_seal', target: 'self', burstOblivion: 1400 }],
    unsynergizedName: 'Sapphire Exhale',
    synergizedName: 'Cobalt-Flame Verdict',
    unsynergizedBase: 920, synergizedBase: 1572,
    unsynergizedCooldown: 6, synergizedCooldown: 8,
  })];

// ���� Cherubim (8) ������������������������������������������������������������������������������������������������������������������������
const baseCherubim: CherubimDefinition[] = [
  buildCherubim({
    definitionId: 'af-cher-bellows-acolyte',
    name: 'Bellows Acolyte',
    description: 'On play: Gain 1 Reforge Charge. While on board: Gain 1 Reforge Charge every 3 cards played; Buffs Seraphim and Angel attacks: base +18',
    rarity: 'Common',
    artKey: 'af_cher_bellows_acolyte',
    effects: [{ type: 'cherubim_charge_per_n_cards', n: 3 }, { type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 18 }],
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'af-cher-apprentice-lampwright',
    name: 'Apprentice Lampwright',
    description: 'On play: Drop 1 Pearl. While on board: Auto-Temper the next Seraphim played (+30%); Buffs Seraphim and Angel attacks: base +20',
    rarity: 'Common',
    artKey: 'af_cher_apprentice_lampwright',
    effects: [{ type: 'cherubim_temper_on_next_seraphim', factor: 0.3 }, { type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 20 }],
    onPlayEffects: [{ type: 'forge_pearl_drop', value: 1 }],
  }),
  buildCherubim({
    definitionId: 'af-cher-quench-mistress',
    name: 'Quench-Mistress',
    description: 'On play: Gain 1 Reforge Charge; Drop 2 Pearls. While on board: Buffs Seraphim and Angel attacks: base +28',
    rarity: 'Rare',
    artKey: 'af_cher_quench_mistress',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 28 }],
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 1 }, { type: 'forge_pearl_drop', value: 2 }],
  }),
  buildCherubim({
    definitionId: 'af-cher-nacre-touched-initiate',
    name: 'Nacre-touched Initiate',
    description: 'On play: Recast last card at 50% power. While on board: +0.5 extra Pearl per recast event; Buffs Seraphim and Angel attacks: base +30',
    rarity: 'Rare',
    artKey: 'af_cher_nacre_touched_initiate',
    effects: [{ type: 'cherubim_pearl_per_recast_bonus', value: 0.5 }, { type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 30 }],
    onPlayEffects: [{ type: 'forge_recast_last', power: 0.5 }],
  }),
  buildCherubim({
    definitionId: 'af-cher-ioreks-echo',
    name: "Iorek's Echo",
    description: 'On play: Nacre-Recast last card at 100% power; Gain 1 Reforge Charge; Raise Reforge Charge cap by 2. While on board: Buffs Seraphim and Angel attacks: base +45, cooldown -1',
    rarity: 'Epic',
    artKey: 'af_cher_ioreks_echo',
    effects: [{ type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 45, cooldownDeltaCards: -1 }],
    onPlayEffects: [{ type: 'forge_nacre_recast', targetMode: 'last', power: 1.0 }, { type: 'forge_reforge_charge_gain', value: 1 }, { type: 'forge_reforge_charge_cap_raise', value: 2 }],
  }),
  buildCherubim({
    definitionId: 'af-cher-pearl-welded-cantor',
    name: 'Pearl-welded Cantor',
    description: 'On play: Drop 3 Pearls. While on board: +60 Oblivion per recast event; Buffs Seraphim and Angel attacks: base +42',
    rarity: 'Epic',
    artKey: 'af_cher_pearl_welded_cantor',
    effects: [{ type: 'cherubim_recast_oblivion_bonus', value: 60 }, { type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 42 }],
    onPlayEffects: [{ type: 'forge_pearl_drop', value: 3 }],
  }),
  buildCherubim({
    definitionId: 'af-cher-first-lampwright-iorek',
    name: 'First Lampwright, Iorek',
    description: 'On play: Temper all Seraphim on board: x0.5 power; Gain 2 Reforge Charges. While on board: All Oblivion gain +70%',
    rarity: 'Legendary',
    artKey: 'af_cher_first_lampwright_iorek',
    maxDurability: 9,
    effects: [{ type: 'cherubim_global_oblivion_mult', value: 0.70 }],
    onPlayEffects: [{ type: 'forge_temper', targetMode: 'all_seraphim_on_board', factor: 0.5 }, { type: 'forge_reforge_charge_gain', value: 2 }],
  }),
  buildCherubim({
    definitionId: 'af-cher-anvilborn-sovereign',
    name: 'Anvilborn Sovereign',
    description: 'On play: Gain 3 Reforge Charges; Drop 3 Pearls; Gain 1 Forge Crown. While on board: Gain 1 Reforge Charge every 2 cards played; Buffs Seraphim and Angel attacks: base +66',
    rarity: 'Legendary',
    artKey: 'af_cher_anvilborn_sovereign',
    effects: [{ type: 'cherubim_charge_per_n_cards', n: 2 }, { type: 'cherubim_attack_buff', targetUnitType: 'Any', bonusBaseOblivion: 66 }],
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 3 }, { type: 'forge_pearl_drop', value: 3 }, { type: 'eternal_stack_gain', stack: 'forge', value: 1 }],
  })];

// ���� Ophanim (8) ��������������������������������������������������������������������������������������������������������������������������
const baseOphanim: OphanimDefinition[] = [
  buildOphanim({
    definitionId: 'af-oph-saffron-ember-wheel',
    name: 'Saffron Ember Wheel',
    description: 'Gain 2 Reforge Charges; Draw 1 card',
    rarity: 'Common',
    artKey: 'af_oph_saffron_ember_wheel',
    effects: [{ type: 'forge_reforge_charge_gain', value: 2 }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'af-oph-cobalt-ember-wheel',
    name: 'Cobalt Ember Wheel',
    description: 'Drop 2 Pearls',
    rarity: 'Common',
    artKey: 'af_oph_cobalt_ember_wheel',
    effects: [{ type: 'forge_pearl_drop', value: 2 }],
  }),
  buildOphanim({
    definitionId: 'af-oph-forge-wheel-sigil',
    name: 'Forge Wheel Sigil',
    description: 'Gain 1 Reforge Charge; Recast last card at 50% power; Draw 1 card',
    rarity: 'Rare',
    artKey: 'af_oph_forge_wheel_sigil',
    effects: [{ type: 'forge_reforge_charge_gain', value: 1 }, { type: 'forge_recast_last', power: 0.5 }, { type: 'draw', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'af-oph-quenching-ring',
    name: 'Quenching Ring',
    description: 'Anvil-Seal last played card (+480 Oblivion bonus on next play); Gain 1 Reforge Charge',
    rarity: 'Rare',
    artKey: 'af_oph_quenching_ring',
    effects: [{ type: 'forge_anvil_seal', target: 'last_played', burstOblivion: 480 }, { type: 'forge_reforge_charge_gain', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'af-oph-chromatic-ember-cluster',
    name: 'Chromatic Ember Cluster',
    description: 'Recast last 2 cards at 75% power; Drop 1 Pearl',
    rarity: 'Epic',
    artKey: 'af_oph_chromatic_ember_cluster',
    effects: [{ type: 'forge_recast_last_n', count: 2, power: 0.75 }, { type: 'forge_pearl_drop', value: 1 }],
  }),
  buildOphanim({
    definitionId: 'af-oph-anvilstorm-halo',
    name: 'Anvilstorm Halo',
    description: 'Spend 20 Pearls (+100 Oblivion per Pearl); Recast 2 random played cards at 50% power',
    rarity: 'Epic',
    artKey: 'af_oph_anvilstorm_halo',
    effects: [{ type: 'forge_pearl_cashout', spend: 20, oblivionPerPearl: 100 }, { type: 'forge_recast_random', power: 0.5, count: 2 }],
  }),
  buildOphanim({
    definitionId: 'af-oph-crown-of-the-forge-beneath',
    name: 'Crown of the Forge-beneath',
    description: 'Gain 1 Forge Crown; Gain 2 Reforge Charges; Raise Reforge Charge cap by 1; Drop 3 Pearls; Cash out all Forge Crowns (+80 Oblivion per crown)',
    rarity: 'Legendary',
    artKey: 'af_oph_crown_of_the_forge_beneath',
    effects: [{ type: 'eternal_stack_gain', stack: 'forge', value: 1 }, { type: 'forge_reforge_charge_gain', value: 2 }, { type: 'forge_reforge_charge_cap_raise', value: 1 }, { type: 'forge_pearl_drop', value: 3 }, { type: 'forge_crown_cashout', oblivionPerCrown: 80 }],
  }),
  buildOphanim({
    definitionId: 'af-oph-ouroglas-discarded-scale',
    name: "Ouroglas's Discarded Scale",
    description: 'Gain 2 Forge Crowns; Recast last 4 cards at 60% power; Drop 2 Pearls',
    rarity: 'Legendary',
    artKey: 'af_oph_ouroglas_discarded_scale',
    effects: [{ type: 'eternal_stack_gain', stack: 'forge', value: 2 }, { type: 'forge_recast_last_n', count: 4, power: 0.6 }, { type: 'forge_pearl_drop', value: 2 }],
  })];

// ���� Angels (6) ����������������������������������������������������������������������������������������������������������������������������
const baseAngels: AngelDefinition[] = [
  buildAngel({
    definitionId: 'af-angel-covenant-herald',
    name: 'Covenant Herald',
    description: 'On summon: Gain 3 Reforge Charges; Draw 1 card. After 2 cards played: Recast last card at 80% power. While on board: +40 Oblivion per card played while on board',
    rarity: 'Rare',
    artKey: 'af_angel_covenant_herald',
    summonCost: ['af-ser-lampfin-minnow-choir', 'af-ser-slagback-crawler'],
    onSummonEffects: [{ type: 'forge_reforge_charge_gain', value: 3 }, { type: 'draw', value: 1 }],
    activatedAbility: {
      name: 'Covenant Echo',
      cardsPlayedRequirement: 2,
      description: 'Recast last card at 80% power',
      effects: [{ type: 'forge_recast_last', power: 0.8 }],
    },
    primaryName: 'Covenant Strike',
    exaltedName: 'Heralded Verdict',
    primaryBase: 418, exaltedBase: 738,
    primaryCooldown: 4, exaltedCooldown: 6,
    primaryScaling: 1.24, exaltedScaling: 1.42,
    baseStats: { basePower: 58, bonusType: 'oblivion_per_card', bonusValue: 40 },
  }),
  buildAngel({
    definitionId: 'af-angel-lampwright-sovereign',
    name: 'Lampwright Sovereign',
    description: 'On summon: Drop 3 Pearls; Gain 2 Reforge Charges. After 2 cards played: Recast last 2 cards at 60% power. While on board: +44 Oblivion per card played while on board',
    rarity: 'Rare',
    artKey: 'af_angel_lampwright_sovereign',
    summonCost: ['af-ser-helith-nun-saffron-eel', 'af-ser-coalfin-pilgrim-shark'],
    onSummonEffects: [{ type: 'forge_pearl_drop', value: 3 }, { type: 'forge_reforge_charge_gain', value: 2 }],
    activatedAbility: {
      name: 'Reforging Pulse',
      cardsPlayedRequirement: 2,
      description: 'Recast last 2 cards at 60% power',
      effects: [{ type: 'forge_recast_last_n', count: 2, power: 0.6 }],
    },
    primaryName: 'Pearl Strike',
    exaltedName: 'Sovereign Verdict',
    primaryBase: 430, exaltedBase: 758,
    primaryCooldown: 4, exaltedCooldown: 6,
    primaryScaling: 1.24, exaltedScaling: 1.43,
    baseStats: { basePower: 62, bonusType: 'oblivion_per_card', bonusValue: 44 },
  }),
  buildAngel({
    definitionId: 'af-angel-crowned-one-sapphire',
    name: 'Crowned One, Sapphire Bellows',
    description: 'On summon: Anvil-Seal this card (+800 Oblivion bonus on next play). After 3 cards played: Nacre-Recast last card at 100% power. While on board: +50 Oblivion per card played while on board',
    rarity: 'Epic',
    artKey: 'af_angel_crowned_one_sapphire',
    summonCost: ['af-ser-cerumel-verdant-anglerfish', 'af-ser-coalfin-pilgrim-shark'],
    onSummonEffects: [{ type: 'forge_anvil_seal', target: 'self', burstOblivion: 800 }],
    activatedAbility: {
      name: 'Nacre Bloom',
      cardsPlayedRequirement: 3,
      description: 'Nacre-Recast last card at 100% power',
      effects: [{ type: 'forge_nacre_recast', targetMode: 'last', power: 1.0 }],
    },
    primaryName: 'Sapphire Cut',
    exaltedName: 'Cobalt-Flame Edict',
    primaryBase: 520, exaltedBase: 912,
    primaryCooldown: 5, exaltedCooldown: 7,
    primaryScaling: 1.29, exaltedScaling: 1.46,
    baseStats: { basePower: 74, bonusType: 'oblivion_per_card', bonusValue: 50 },
  }),
  buildAngel({
    definitionId: 'af-angel-crowned-one-saffron',
    name: 'Crowned One, Saffron Coil',
    description: 'On summon: Temper all Seraphim on board: x0.4 power; Gain 1 Reforge Charge. After 3 cards played: Recast last 3 cards at 75% power. While on board: +52 Oblivion per card played while on board',
    rarity: 'Epic',
    artKey: 'af_angel_crowned_one_saffron',
    summonCost: ['af-ser-helith-nun-saffron-eel', 'af-ser-ophrax-vermilion-kraken'],
    onSummonEffects: [{ type: 'forge_temper', targetMode: 'all_seraphim_on_board', factor: 0.4 }, { type: 'forge_reforge_charge_gain', value: 1 }],
    activatedAbility: {
      name: 'Saffron Resound',
      cardsPlayedRequirement: 3,
      description: 'Recast last 3 cards at 75% power',
      effects: [{ type: 'forge_recast_last_n', count: 3, power: 0.75 }],
    },
    primaryName: 'Saffron Lash',
    exaltedName: 'Coiled Verdict',
    primaryBase: 532, exaltedBase: 928,
    primaryCooldown: 5, exaltedCooldown: 7,
    primaryScaling: 1.30, exaltedScaling: 1.47,
    baseStats: { basePower: 78, bonusType: 'oblivion_per_card', bonusValue: 52 },
  }),
  buildAngel({
    definitionId: 'af-angel-iorek-reforged',
    name: 'Iorek Reforged',
    description: 'On summon: Gain 5 Reforge Charges; Drop 4 Pearls. After 4 cards played: Nacre-Recast last 3 cards at 100% power. While on board: +65 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'af_angel_iorek_reforged',
    summonCost: ['af-ser-tessareth-opal-manta', 'af-ser-vairoch-sapphire-bellows'],
    onSummonEffects: [{ type: 'forge_reforge_charge_gain', value: 5 }, { type: 'forge_pearl_drop', value: 4 }],
    activatedAbility: {
      name: 'Reforged Apex',
      cardsPlayedRequirement: 4,
      description: 'Nacre-Recast last 3 cards at 100% power',
      effects: [{ type: 'forge_nacre_recast', targetMode: 'lastN', count: 3, power: 1.0 }],
    },
    primaryName: 'Reforged Cut',
    exaltedName: 'Iorek Verdict',
    primaryBase: 702, exaltedBase: 1238,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.34, exaltedScaling: 1.52,
    baseStats: { basePower: 92, bonusType: 'oblivion_per_card', bonusValue: 65 },
  }),
  buildAngel({
    definitionId: 'af-angel-bearer-unrecorded-hue',
    name: 'Bearer of the Unrecorded Hue',
    description: 'On summon: Gain 3 Reforge Charges; Drop 4 Pearls. After 4 cards played: Ignite the Unrecorded Hue. While on board: +70 Oblivion per card played while on board',
    rarity: 'Legendary',
    artKey: 'af_angel_bearer_unrecorded_hue',
    summonCost: ['af-ser-tessareth-opal-manta', 'af-ser-ophrax-vermilion-kraken'],
    onSummonEffects: [{ type: 'forge_reforge_charge_gain', value: 3 }, { type: 'forge_pearl_drop', value: 4 }],
    activatedAbility: {
      name: 'Hue Ignition',
      cardsPlayedRequirement: 4,
      description: 'Ignite the Unrecorded Hue',
      effects: [{ type: 'forge_unrecorded_ignite' }],
    },
    primaryName: 'Hue Slash',
    exaltedName: 'Unrecorded Verdict',
    primaryBase: 720, exaltedBase: 1268,
    primaryCooldown: 6, exaltedCooldown: 8,
    primaryScaling: 1.35, exaltedScaling: 1.53,
    baseStats: { basePower: 98, bonusType: 'oblivion_per_card', bonusValue: 70 },
  })];

// ���� Eternal (5) ��������������������������������������������������������������������������������������������������������������������������
const eternalCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'af-et-forge-beneath',
    name: 'The Forge-beneath',
    description: 'On play: Gain 4 Reforge Charges; Gain 2 Forge Crowns; Raise Reforge Charge cap by 2; Nacre-Recast last card at 100% power. While on board: +28 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'af_et_forge_beneath',
    bonusType: 'oblivion_per_card',
    bonusValue: 28,
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 4 }, { type: 'eternal_stack_gain', stack: 'forge', value: 2 }, { type: 'forge_reforge_charge_cap_raise', value: 2 }, { type: 'forge_nacre_recast', targetMode: 'last', power: 1.0 }],
    unsynergizedName: 'Forge-beneath Strike',
    synergizedName: 'Elder Forge Verdict',
    unsynergizedBase: 1010, synergizedBase: 1770,
    unsynergizedCooldown: 6, synergizedCooldown: 8,
  }),
  buildSeraphim({
    definitionId: 'af-et-ouroglas-dreaming',
    name: 'Ouroglas Dreaming',
    description: 'On play: Gain 3 Reforge Charges; Gain 3 Forge Crowns; Drop 5 Pearls; Nacre-Recast last 2 cards at 100% power. While on board: +95 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'af_et_ouroglas_dreaming',
    bonusType: 'oblivion_per_card',
    bonusValue: 95,
    onPlayEffects: [{ type: 'forge_reforge_charge_gain', value: 3 }, { type: 'eternal_stack_gain', stack: 'forge', value: 3 }, { type: 'forge_pearl_drop', value: 5 }, { type: 'forge_nacre_recast', targetMode: 'lastN', count: 2, power: 1.0 }],
    unsynergizedName: 'Ouroglas Dream',
    synergizedName: 'Coiled Dream Verdict',
    unsynergizedBase: 1040, synergizedBase: 1820,
    unsynergizedCooldown: 6, synergizedCooldown: 8,
  }),
  buildSeraphim({
    definitionId: 'af-et-quenched-drift',
    name: 'The Quenched Drift',
    description: 'On play: Gain 2 Forge Crowns; Anvil-Seal this card (+1200 Oblivion bonus on next play); Gain 4 Reforge Charges. While on board: +30 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'af_et_quenched_drift',
    bonusType: 'oblivion_per_card',
    bonusValue: 30,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'forge', value: 2 }, { type: 'forge_anvil_seal', target: 'self', burstOblivion: 1200 }, { type: 'forge_reforge_charge_gain', value: 4 }],
    unsynergizedName: 'Quench Cut',
    synergizedName: 'Drifted Verdict',
    unsynergizedBase: 1060, synergizedBase: 1860,
    unsynergizedCooldown: 6, synergizedCooldown: 8,
  }),
  buildSeraphim({
    definitionId: 'af-et-nacre-touched-procession',
    name: 'The Nacre-touched Procession',
    description: 'On play: Gain 2 Forge Crowns; Nacre-Coat all played cards; Gain 3 Reforge Charges. While on board: +105 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'af_et_nacre_touched_procession',
    bonusType: 'oblivion_per_card',
    bonusValue: 105,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'forge', value: 2 }, { type: 'forge_nacre_coat', targetMode: 'all_played' }, { type: 'forge_reforge_charge_gain', value: 3 }],
    unsynergizedName: 'Procession Cut',
    synergizedName: 'Nacre Procession Verdict',
    unsynergizedBase: 1080, synergizedBase: 1900,
    unsynergizedCooldown: 6, synergizedCooldown: 8,
  }),
  buildSeraphim({
    definitionId: 'af-et-pearled-pantheon',
    name: 'The Pearled Pantheon',
    description: 'On play: Gain 3 Forge Crowns; Drop 8 Pearls; Gain 4 Reforge Charges; Nacre-Recast last 3 cards at 100% power. While on board: +33 Oblivion per card played while active',
    rarity: 'Eternal',
    artKey: 'af_et_pearled_pantheon',
    bonusType: 'oblivion_per_card',
    bonusValue: 33,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'forge', value: 3 }, { type: 'forge_pearl_drop', value: 8 }, { type: 'forge_reforge_charge_gain', value: 4 }, { type: 'forge_nacre_recast', targetMode: 'lastN', count: 3, power: 1.0 }],
    unsynergizedName: 'Pearled Verdict',
    synergizedName: 'Pantheon Verdict',
    unsynergizedBase: 1110, synergizedBase: 1950,
    unsynergizedCooldown: 6, synergizedCooldown: 8,
  })];

// ���� Infinite (5) ������������������������������������������������������������������������������������������������������������������������
const infinityCards: CardDefinition[] = [
  buildSeraphim({
    definitionId: 'af-inf-ouroglas-uncoiled',
    name: 'Ouroglas Uncoiled',
    description: 'On play: Gain 4 Forge Crowns; Ouroboric Recast at 50% power; Gain 5 Reforge Charges. While on board: +180 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'af_inf_ouroglas_uncoiled',
    bonusType: 'oblivion_per_card',
    bonusValue: 180,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'forge', value: 4 }, { type: 'forge_ouroboric_recast', power: 0.5 }, { type: 'forge_reforge_charge_gain', value: 5 }],
    unsynergizedName: 'Uncoiled Strike',
    synergizedName: 'Coil Apocalypse',
    unsynergizedBase: 2060, synergizedBase: 3600,
    unsynergizedCooldown: 7, synergizedCooldown: 9,
  }),
  buildSeraphim({
    definitionId: 'af-inf-abyssal-forge-itself',
    name: 'The Abyssal Forge Itself',
    description: 'On play: Gain 5 Forge Crowns; Drop 6 Pearls; Nacre-Recast last 5 cards at 100% power; Cash out all Forge Crowns (+160 Oblivion per crown). While on board: +40 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'af_inf_abyssal_forge_itself',
    bonusType: 'oblivion_per_card',
    bonusValue: 40,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'forge', value: 5 }, { type: 'forge_pearl_drop', value: 6 }, { type: 'forge_nacre_recast', targetMode: 'lastN', count: 5, power: 1.0 }, { type: 'forge_crown_cashout', oblivionPerCrown: 160 }],
    unsynergizedName: 'Forge Itself',
    synergizedName: 'Abyssal Verdict',
    unsynergizedBase: 2120, synergizedBase: 3700,
    unsynergizedCooldown: 7, synergizedCooldown: 9,
  }),
  buildSeraphim({
    definitionId: 'af-inf-unrecorded-hue',
    name: 'The Unrecorded Hue',
    description: 'On play: Gain 3 Forge Crowns; Ignite the Unrecorded Hue; Drop 10 Pearls. While on board: +45 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'af_inf_unrecorded_hue',
    bonusType: 'oblivion_per_card',
    bonusValue: 45,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'forge', value: 3 }, { type: 'forge_unrecorded_ignite' }, { type: 'forge_pearl_drop', value: 10 }],
    unsynergizedName: 'Unrecorded Cut',
    synergizedName: 'Unrecorded Apocalypse',
    unsynergizedBase: 2080, synergizedBase: 3640,
    unsynergizedCooldown: 7, synergizedCooldown: 9,
  }),
  buildSeraphim({
    definitionId: 'af-inf-covenant-coiled-fire',
    name: 'Covenant of Coiled Fire',
    description: 'On play: Gain 4 Forge Crowns; Gain 6 Reforge Charges; Nacre-Recast last 4 cards at 100% power; Nacre-Coat all played cards. While on board: +200 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'af_inf_covenant_coiled_fire',
    bonusType: 'oblivion_per_card',
    bonusValue: 200,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'forge', value: 4 }, { type: 'forge_reforge_charge_gain', value: 6 }, { type: 'forge_nacre_recast', targetMode: 'lastN', count: 4, power: 1.0 }, { type: 'forge_nacre_coat', targetMode: 'all_played' }],
    unsynergizedName: 'Coiled Fire',
    synergizedName: 'Covenant Apocalypse',
    unsynergizedBase: 2160, synergizedBase: 3770,
    unsynergizedCooldown: 7, synergizedCooldown: 9,
  }),
  buildSeraphim({
    definitionId: 'af-inf-reforging-world',
    name: 'The Reforging of the World',
    description: 'On play: Gain 6 Forge Crowns; Ignite the Unrecorded Hue; Ouroboric Recast at 100% power; Cash out all Forge Crowns (+220 Oblivion per crown). While on board: +50 Oblivion per card played while active',
    rarity: 'Infinite',
    artKey: 'af_inf_reforging_world',
    bonusType: 'oblivion_per_card',
    bonusValue: 50,
    onPlayEffects: [{ type: 'eternal_stack_gain', stack: 'forge', value: 6 }, { type: 'forge_unrecorded_ignite' }, { type: 'forge_ouroboric_recast', power: 1.0 }, { type: 'forge_crown_cashout', oblivionPerCrown: 220 }],
    unsynergizedName: 'World Verdict',
    synergizedName: 'Reforging of the World',
    unsynergizedBase: 2240, synergizedBase: 3900,
    unsynergizedCooldown: 7, synergizedCooldown: 9,
  })];

export const abyssalForgeCards: CardDefinition[] = [
  ...baseSeraphim,
  ...baseCherubim,
  ...baseOphanim,
  ...baseAngels,
  ...eternalCards,
  ...infinityCards];

export const abyssalForgePackPool = abyssalForgeCards.map(card => card.definitionId);
