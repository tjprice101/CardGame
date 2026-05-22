import { ELEMENT_COLORS, isSnowboundCard } from '@/data/elements';
import type { CardDefinition } from '@/types/cards';
import type { BoardState, TurnState } from '@/types/game';

export type EngineKey =
  | 'neutrality'
  | 'light'
  | 'thornbound'
  | 'mechanical'
  | 'prismatic'
  | 'blackGlass'
  | 'snowbound'
  | 'glassAbsolute'
  | 'pyro'
  | 'blazingGarden'
  | 'butterfly'
  | 'eternalSeas';

type CardRolePattern = 'setup' | 'support' | 'resource' | 'payoff' | 'amplifier' | 'finisher';

export interface EngineMetric {
  label: string;
  value: string;
  hint: string;
}

export interface EnginePlanStep {
  title: string;
  detail: string;
  ready: boolean;
}

export interface CardEngineRole {
  key: EngineKey;
  engineLabel: string;
  accent: string;
  badge: string;
  text: string;
}

export interface EngineContributor {
  definitionId: string;
  name: string;
  type: CardDefinition['type'];
  count: number;
  role: CardEngineRole;
}

export interface SetEngineSnapshot {
  key: EngineKey;
  label: string;
  accent: string;
  compact: string;
  detail: string;
  tagline: string;
  summary: string;
  metrics: EngineMetric[];
  nextSteps: EnginePlanStep[];
}

export interface SetEngineSnapshotOptions {
  includeAll?: boolean;
}

const ENGINE_ORDER: EngineKey[] = [
  'neutrality',
  'light',
  'thornbound',
  'mechanical',
  'prismatic',
  'blackGlass',
  'snowbound',
  'glassAbsolute',
  'pyro',
  'blazingGarden',
  'butterfly',
  'eternalSeas',
];

const ENGINE_META: Record<EngineKey, { label: string; accent: string }> = {
  neutrality: { label: 'Neutrality', accent: ELEMENT_COLORS.Neutrality },
  light: { label: 'Heavenly Light', accent: ELEMENT_COLORS.Light },
  thornbound: { label: 'Thornbound Plains', accent: ELEMENT_COLORS.Thornbound },
  mechanical: { label: 'Mechanical Dreams', accent: ELEMENT_COLORS.Mechanical },
  prismatic: { label: 'Prismatic Accord', accent: ELEMENT_COLORS.Prismatic },
  blackGlass: { label: 'Black Glass', accent: ELEMENT_COLORS.Dark },
  snowbound: { label: 'Snowbound Voltage', accent: ELEMENT_COLORS.SnowboundVoltage },
  glassAbsolute: { label: 'Glass Absolute', accent: ELEMENT_COLORS.GlassAbsolute },
  pyro: { label: 'Pyroabyss', accent: ELEMENT_COLORS.Fire },
  blazingGarden: { label: 'Blazing Garden', accent: ELEMENT_COLORS.BlazingGarden },
  butterfly: { label: 'Age of the Butterfly', accent: ELEMENT_COLORS.Butterfly },
  eternalSeas: { label: 'Eternal Seas', accent: ELEMENT_COLORS.EternalSeas },
};

const ROLE_BADGES: Record<CardRolePattern, string> = {
  setup: 'Setup',
  support: 'Support',
  resource: 'Fuel',
  payoff: 'Payoff',
  amplifier: 'Amplifier',
  finisher: 'Finisher',
};

const ENGINE_ROLE_TEXT: Record<EngineKey, Record<CardRolePattern, string>> = {
  neutrality: {
    setup: 'Draws cards or searches the deck  Ekeeping the play chain flowing accelerates Patience on every waiting Seraphim.',
    support: 'Sits on the board and grants extra Patience to adjacent Seraphim each time any card is played.',
    resource: 'Plays frequently and cheaply, triggering Patience accumulation across all active Seraphim.',
    payoff: 'Fires the Patience burst  Econsuming all stored stacks for +15 Oblivion each on attack.',
    amplifier: 'Gives an instant Patience injection to all Seraphim or doubles current stacks in one activation.',
    finisher: 'Cashes a fully charged Patience payoff, meeting the threshold for a bonus draw alongside maximum Oblivion.',
  },
  light: {
    setup: 'Adds Hymn Notes and opens Cadence setup so Resonance tiers can build.',
    support: 'Anchors the choir with Chorus Anchors so note cadence persists through interruptions.',
    resource: 'Feeds Radiance and tempo so the choir keeps advancing toward its next Resonance tier.',
    payoff: 'Converts built Cadence and Resonance into Oblivion once the hymn sequence is complete.',
    amplifier: 'Pushes Resonance harder once multiple Chorus Anchors and distinct note types are active.',
    finisher: 'Triggers Apotheosis Pulse: converts the full cadence sequence into repeated Oblivion echoes.',
  },
  thornbound: {
    setup: 'Builds Trail and positions the war-path before the briars start paying out.',
    support: 'Keeps the procession alive while Trail and Scar accumulate through attrition.',
    resource: 'Loads Trail and sacrifice fodder to feed Scar conversion once the march fires.',
    payoff: 'Converts accumulated Scar and Trail into war-path Oblivion when the procession is live.',
    amplifier: 'Escalates Scar pressure once Trail and the chosen war-path momentum are both established.',
    finisher: 'Triggers Last Procession: consumes all Scar for a burst, then reapplies reduced Scar to staircase again.',
  },
  mechanical: {
    setup: 'Queues diverse Instructions and primes a clean Clock-resolution cycle.',
    support: 'Keeps the Deterministic Kernel open so queued Instructions resolve as planned.',
    resource: 'Loads Strain and machine tempo for the next Overclock or instruction cycle.',
    payoff: 'Converts cleanly resolved Instructions into Oblivion once the machine sequence completes.',
    amplifier: 'Scales the engine once multiple instruction modes and Kernel lines are simultaneously active.',
    finisher: 'Triggers Overclock Loop: executes top Instructions twice, with bonus Oblivion for high mode diversity.',
  },
  prismatic: {
    setup: 'Adds Spectrum channels and advances Refraction depth across the full color range.',
    support: 'Stabilizes the lattice with Prism Nodes while channel diversity accumulates.',
    resource: 'Keeps the spectrum rotating so channel diversity stays live for Ninefold Accord.',
    payoff: 'Converts channel diversity and deep Refraction into prismatic Oblivion payoff.',
    amplifier: 'Pushes refracted boards harder once multiple spectrum colors are simultaneously active.',
    finisher: 'Triggers Ninefold Accord: resolves each unique channel used this turn as a separate Oblivion wave.',
  },
  blackGlass: {
    setup: 'Separates White Flame from Black Flame and begins building Fracture stacks safely.',
    support: 'Holds Grief Oath pressure so contradiction can coexist until the collapse is worth triggering.',
    resource: 'Feeds twin-flame totals so Fracture windows stay live without premature collapse.',
    payoff: 'Cashes balanced flame pressure and accumulated Fracture into a decisive Black Glass collapse.',
    amplifier: 'Escalates Fracture depth once both flame tracks are established and Grief Oaths are active.',
    finisher: 'Triggers Two Truths Cataclysm: consumes Fracture for giant Oblivion and mirrors one prior payoff.',
  },
  snowbound: {
    setup: 'Sets Frost and Voltage pacing so phase alternations generate meaningful Potential stores.',
    support: 'Smooths phase alternation with Conduits while Potential builds on the Frost side.',
    resource: 'Builds Potential so the next Voltage phase switch converts into a real chain burst.',
    payoff: 'Releases stored Potential into Voltage bursts once the polarity cycle is primed.',
    amplifier: 'Pushes alternation payoffs harder once multiple successful phase swaps are active.',
    finisher: 'Triggers Whiteout Surge: releases all stored Potential as repeated micro-bursts scaled by alternations.',
  },
  glassAbsolute: {
    setup: 'Places proof fragments and builds Axiom coverage before the lattice begins resolving.',
    support: 'Stabilizes Axiom connections while adjacent proof lines keep extending across the board.',
    resource: 'Feeds proof depth so the lattice can sustain a longer ordered cascade.',
    payoff: 'Converts proof depth and connected Axioms into a lattice Oblivion burst.',
    amplifier: 'Scales cascade payoff once multiple proof lines are connected and Axioms are live.',
    finisher: 'Triggers Absolute Demonstration: resolves all active proofs in cascade, each boosting the next.',
  },
  pyro: {
    setup: 'Builds signatures, trims Burn Debt, and keeps Heat inside the stable firing band.',
    support: 'Balances Heat and Stability so Pyro auto-breaks are available when attenuation starts biting.',
    resource: 'Moves Embers up or down to push Heat, trigger mixed gain-spend turns, and feed Fire scaling.',
    payoff: 'Turns Heat, cross-set conversion fuel, and Stability into larger Fire Oblivion payouts.',
    amplifier: 'Raises chain pressure once Heat is online and the furnace has enough signatures to stay lit.',
    finisher: 'Cashes a fully stoked Pyro line once Setup Count and signatures are ready for Infinite fire.',
  },
  blazingGarden: {
    setup: 'Plants lineage seeds and opens a Grove Law inside the ember cycle.',
    support: 'Keeps the grove stocked while bloom and burn turns branch across lineages.',
    resource: 'Feeds ember-grove stock so the garden can sustain its Echo-generation cycle.',
    payoff: 'Cashes the active Grove Law, bloom echoes, and grove stock into Oblivion payoff.',
    amplifier: 'Pushes bloom echoes harder once Rose, Sunflower, and Thistle lineages are all active.',
    finisher: 'Triggers Final Chord Bloom: simultaneously blooms all lineages, each modifying the next bloom.',
  },
  butterfly: {
    setup: 'Charges Spectrum and starts the Flutter thresholds toward a descent turn.',
    support: 'Maintains stance tuning so Reflect and Absorb are both available on demand.',
    resource: 'Builds shared Spectrum that every Butterfly card can spend or convert.',
    payoff: 'Releases stored Spectrum into Oblivion and chain at the best timing window.',
    amplifier: 'Boosts threshold pulses and dual-surface turns once Spectrum is high.',
    finisher: 'Triggers Velkoreth Descent-style turns where Reflect and Absorb overlap.',
  },
  eternalSeas: {
    setup: 'Builds Current and establishes White/Black polarity lanes.',
    support: 'Stabilizes Veilmargin alternation so margin charge accrues reliably.',
    resource: 'Stocks Current for release turns while preserving polarity pressure.',
    payoff: 'Converts held Current and margin charge into major Oblivion spikes.',
    amplifier: 'Widens white/black flow balance to improve every future release.',
    finisher: 'Unloads a full Veilmargin convergence after both flows are established.',
  },
};

function formatFixed(value: number, digits = 1): string {
  return value.toFixed(digits).replace(/\.0$/, '');
}

function formatPreview(items: string[], fallback = 'none', limit = 3): string {
  if (items.length === 0) return fallback;
  const preview = items.slice(0, limit).join(' / ');
  return items.length > limit ? `${preview} +${items.length - limit}` : preview;
}

function capitalize(value: string | null | undefined): string {
  if (!value) return 'Unset';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function createMetric(label: string, value: string | number, hint: string): EngineMetric {
  return { label, value: String(value), hint };
}

function createStep(title: string, ready: boolean, detail: string): EnginePlanStep {
  return { title, detail, ready };
}

function getEffectTypes(def: CardDefinition): string[] {
  const types: string[] = [];

  if (def.type === 'Ophanim') {
    types.push(...def.effects.map(effect => effect.type));
  }

  if (def.type === 'Cherubim') {
    types.push(...def.effects.map(effect => effect.type));
    types.push(...def.onPlayEffects.map(effect => effect.type));
  }

  if (def.type === 'Seraphim') {
    types.push(...def.onPlayEffects.map(effect => effect.type));
  }

  if (def.type === 'Angel') {
    types.push(...def.onSummonEffects.map(effect => effect.type));
    types.push(...def.activatedAbility.effects.map(effect => effect.type));
  }

  return types;
}

function hasSomeEffect(def: CardDefinition, candidates: string[]): boolean {
  const types = getEffectTypes(def);
  return candidates.some(candidate => types.includes(candidate));
}

function hasTextSnippet(def: CardDefinition, snippets: string[]): boolean {
  const text = [
    def.description,
    def.type === 'Angel' ? def.activatedAbility.description : '',
    def.type === 'Seraphim' && def.attacks ? `${def.attacks.unsynergized.name} ${def.attacks.synergized.name}` : '',
    def.type === 'Angel' && def.attacks ? `${def.attacks.primary.name} ${def.attacks.exalted.name}` : '',
  ].join(' ').toLowerCase();

  return snippets.some(snippet => text.includes(snippet));
}

function inferCardRolePattern(def: CardDefinition): CardRolePattern {
  if (def.type === 'Angel') return 'finisher';

  if (def.type === 'Seraphim') {
    if (def.baseStats.bonusType === 'ophanim_bonus' || hasTextSnippet(def, ['ophanim'])) return 'amplifier';
    if (def.baseStats.bonusType === 'ember_per_card' || def.baseStats.bonusType === 'resource_generation') return 'resource';
    if (def.baseStats.bonusType === 'chain_bonus' || hasTextSnippet(def, ['chain'])) return 'setup';
    if (def.baseStats.bonusType === 'power_amplifier' || def.baseStats.bonusType === 'score_per_second') return 'amplifier';
    return 'payoff';
  }

  if (def.type === 'Cherubim') {
    if (hasSomeEffect(def, ['cherubim_resource_per_card', 'cherubim_ember_gain', 'cherubim_draw_per_card'])) return 'resource';
    if (hasSomeEffect(def, ['cherubim_adjacent_seraphim_bonus', 'cherubim_seraphim_amp', 'cherubim_attack_buff'])) return 'amplifier';
    if (hasSomeEffect(def, ['draw', 'search_deck_by_type', 'look_top_take', 'look_top_take_drop', 'salvage_any', 'salvage_by_type'])) return 'setup';
    return 'support';
  }

  if (hasSomeEffect(def, ['draw', 'search_deck_by_type', 'look_top_take', 'look_top_take_drop', 'look_top_take_type', 'salvage_any', 'salvage_by_type', 'shuffle_discard', 'copy_last_hr'])) {
    return 'setup';
  }

  if (hasSomeEffect(def, ['radiance_gain', 'radiance_spend', 'ember_gain', 'ember_spend', 'trail_gain', 'trail_spend', 'strain_gain', 'strain_vent', 'prismatic_light_gain', 'monochromatic_shards_gain', 'arctic_charge_gain', 'proof_gain', 'bloom_gain', 'butterfly_spectrum_gain', 'seas_current_gain'])) {
    return 'resource';
  }

  if (hasSomeEffect(def, ['multiply_next', 'score_flat', 'score_multiplier', 'oblivion_flat', 'power_flat', 'power_percent', 'butterfly_release', 'seas_release'])) {
    return 'payoff';
  }

  return 'setup';
}

function getCardRoleDetail(def: CardDefinition): string {
  if (hasSomeEffect(def, ['radiance_gain', 'ember_gain', 'trail_gain', 'strain_gain', 'prismatic_light_gain', 'monochromatic_shards_gain', 'arctic_charge_gain', 'proof_gain', 'bloom_gain', 'butterfly_spectrum_gain', 'seas_current_gain', 'radiance_double'])) {
    return 'It stocks the resources this engine spends to stay online.';
  }

  if (hasSomeEffect(def, ['chain_gain', 'chain_multiplier_set', 'chain_gain', 'multiply_next'])) {
    return 'It sharpens timing so the next payoff window lands cleanly.';
  }

  if (def.type === 'Cherubim' || hasSomeEffect(def, ['cherubim_adjacent_seraphim_bonus', 'cherubim_seraphim_amp', 'cherubim_attack_buff', 'power_flat', 'power_percent'])) {
    return 'It strengthens the board once your setup pieces are already in place.';
  }

  if (def.type === 'Seraphim') {
    return 'Its impact is highest once the engine is already online and ready to convert setup into payoff.';
  }

  if (def.type === 'Angel') {
    return 'It turns completed setup into a real finisher instead of another setup piece.';
  }

  return 'It usually matters most while the engine still has time to convert setup into value.';
}

export function getEngineKeyForCard(def: CardDefinition): EngineKey | null {
  if (def.element === 'Neutrality') return 'neutrality';
  if (def.element === 'Light') return 'light';
  if (def.element === 'Thornbound') return 'thornbound';
  if (isSnowboundCard(def)) return 'snowbound';
  if (def.element === 'Mechanical') return 'mechanical';
  if (def.element === 'Prismatic') return 'prismatic';
  if (def.element === 'Dark') return 'blackGlass';
  if (def.element === 'GlassAbsolute') return 'glassAbsolute';
  if (def.element === 'Fire') return 'pyro';
  if (def.element === 'BlazingGarden') return 'blazingGarden';
  if (def.element === 'Butterfly') return 'butterfly';
  if (def.element === 'EternalSeas') return 'eternalSeas';
  return null;
}

export function getCardEngineRole(def: CardDefinition): CardEngineRole | null {
  const key = getEngineKeyForCard(def);
  if (!key) return null;

  const pattern = inferCardRolePattern(def);
  return {
    key,
    engineLabel: ENGINE_META[key].label,
    accent: ENGINE_META[key].accent,
    badge: ROLE_BADGES[pattern],
    text: `${ENGINE_ROLE_TEXT[key][pattern]} ${getCardRoleDetail(def)}`,
  };
}

export function getCardEngineRoleText(def: CardDefinition): string | null {
  const role = getCardEngineRole(def);
  return role ? `${role.badge}: ${role.text}` : null;
}

export function getSetEngineContributorsForCards(
  definitions: CardDefinition[],
  key: EngineKey,
  limit = 6,
): EngineContributor[] {
  const grouped = new Map<string, EngineContributor>();

  for (const def of definitions) {
    if (getEngineKeyForCard(def) !== key) continue;
    const existing = grouped.get(def.definitionId);
    if (existing) {
      existing.count += 1;
      continue;
    }

    const role = getCardEngineRole(def);
    if (!role) continue;

    grouped.set(def.definitionId, {
      definitionId: def.definitionId,
      name: def.name,
      type: def.type,
      count: 1,
      role,
    });
  }

  const typeRank: Record<CardDefinition['type'], number> = {
    Ophanim: 0,
    Cherubim: 1,
    Seraphim: 2,
    Angel: 3,
  };

  return Array.from(grouped.values())
    .sort((left, right) => typeRank[left.type] - typeRank[right.type] || left.name.localeCompare(right.name))
    .slice(0, limit);
}

function buildEngineSnapshot(
  key: EngineKey,
  turn: TurnState,
  board?: BoardState,
): SetEngineSnapshot {
  const meta = ENGINE_META[key];

  switch (key) {
    case 'neutrality': {
      const frontSlots = board?.frontSlots ?? [];
      const totalPatience = frontSlots.reduce((acc, unit) => {
        if (!unit || (unit.type !== 'Seraphim' && unit.type !== 'Angel')) return acc;
        if (unit.type === 'Seraphim' && !unit.isActive) return acc;
        return acc + (unit.patienceStacks ?? 0);
      }, 0);
      const patienceUnits = frontSlots.filter(u =>
        u && (u.type === 'Seraphim' || u.type === 'Angel') &&
        (u.type !== 'Seraphim' || u.isActive) &&
        (u.patienceStacks ?? 0) > 0,
      ).length;
      const maxPatience = frontSlots.reduce((acc, unit) => {
        if (!unit || (unit.type !== 'Seraphim' && unit.type !== 'Angel')) return acc;
        if (unit.type === 'Seraphim' && !unit.isActive) return acc;
        return Math.max(acc, unit.patienceStacks ?? 0);
      }, 0);
      const activeCherubim = (board?.backSlots ?? []).filter(b => b !== null).length;
      const potentialBonus = totalPatience * 15;
      const chargedThisTurn = turn.neutralityPatienceChargedThisTurn ?? 0;
      const consumedThisTurn = turn.neutralityPatienceConsumedThisTurn ?? 0;
      const chainGainedThisTurn = turn.neutralityChainGainedThisTurn ?? 0;
      const recentTriggers = (turn.neutralityTriggeredEffects ?? []).slice(-3);

      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Patience ${totalPatience} total | Peak ${maxPatience} | ${patienceUnits} unit${patienceUnits !== 1 ? 's' : ''} charged`,
        detail: `Pending Bonus Oblivion ≁E+${potentialBonus} | +${formatFixed(chainGainedThisTurn, 1)} chain gained this turn`,
        tagline: 'Neutrality now reports charged, consumed, and converted Patience in real time.',
        summary: 'Every card you play still charges Patience on eligible Seraphim. Neutrality card effects now surface per-turn charge, consumption, chain gain, and recent triggered events directly in this panel.',
        metrics: [
          createMetric('Total Patience', totalPatience, 'Sum of all Patience stacks across active Seraphim. Each stack = +15 Oblivion on next attack.'),
          createMetric('Patience Charged', chargedThisTurn, 'Total Patience added by Neutrality card effects this turn.'),
          createMetric('Patience Consumed', consumedThisTurn, 'Patience spent or transformed by Neutrality card effects this turn.'),
          createMetric('Chain Gained', `+${formatFixed(chainGainedThisTurn, 1)}`, 'Direct chain added by Neutrality effects this turn.'),
          createMetric('Recent Triggers', recentTriggers.length === 0 ? 'none' : recentTriggers.join(' | '), 'Most recent Neutrality effect activations this turn.'),
        ],
        nextSteps: [
          createStep('Build Patience stacks', totalPatience >= 3, totalPatience >= 3
            ? `${totalPatience} total Patience built. Each stack adds +15 Oblivion to the next Seraphim attack.`
            : 'Keep playing cards  Eevery card played automatically adds +1 Patience to each eligible Seraphim.'),
          createStep('Amplify with Cherubim', activeCherubim >= 1, activeCherubim >= 1
            ? `${activeCherubim} Cherubim on board  Egranting +1 to +3 extra Patience per card played to adjacent Seraphim.`
            : 'Place Neutrality Cherubim to grant +1 E extra Patience per card played to adjacent Seraphim.'),
          createStep('Hit the threshold', maxPatience >= 3, maxPatience >= 3
            ? `Peak Patience is ${maxPatience}  Eat least one Seraphim can trigger its threshold draw bonus on next attack.`
            : 'Reach your Seraphim\'s Patience threshold (3 E depending on rarity) to draw bonus cards when it attacks.'),
        ],
      };
    }
    case 'light': {
      const notes = turn.lightDistinctNotes ?? [];
      const cadence = notes.length;
      const resonance = turn.lightResonance ?? 0;
      const anchors = turn.lightChorusAnchors ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Cadence ${cadence} | Resonance ${resonance} | Anchors ${anchors}`,
        detail: `Notes ${formatPreview(notes)} | Echoes ${(turn.lightCadenceNotes ?? []).length}`,
        tagline: 'Build the choir note by note before the Apotheosis Pulse echoes.',
        summary: 'Alternate card types to grow cadence and Resonance, and use Chorus Anchors to protect it. If your deck includes Infinite cards, meeting Resonance 3 + 3 distinct notes amplifies them to ÁE.22. Open the Guide for full details.',
        metrics: [
          createMetric('Cadence', cadence, 'Distinct Hymn Note types played this turn.'),
          createMetric('Resonance', resonance, 'Raises chain. Drops on repeated notes without an Anchor.'),
          createMetric('Anchors', anchors, 'Absorbs one repeated-note penalty per charge.'),
          createMetric('Echoes', (turn.lightCadenceNotes ?? []).length, 'Total note triggers in the rolling cadence window.'),
        ],
        nextSteps: [
          createStep('Add new notes', cadence >= 3, cadence >= 3
            ? 'Cadence is healthy. Start aiming for the payoff side of the choir.'
            : 'Play distinct Light notes first so cadence grows before the payoff turn.'),
          createStep('Hold anchors', anchors >= 1, anchors >= 1
            ? 'At least one anchor is holding the choir. Protect it while resonance builds.'
            : 'Anchor the choir with persistent Light pieces before leaning on payoff cards.'),
          createStep('Spend resonance late', resonance >= 3, resonance >= 3
            ? 'Resonance is stocked. Shift into Seraphim or Angel payoff pieces.'
            : 'Keep sequencing Light setup until resonance is worth cashing.'),
        ],
      };
    }
    case 'thornbound': {
      const trail = turn.trail ?? 0;
      const scar = turn.thornScar ?? 0;
      const losses = turn.thornLossesThisTurn ?? 0;
      const processions = turn.thornProcessions ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Trail ${trail} | Scar ${scar} | Path ${turn.thornWarPath ?? 'Unset'} | Losses ${losses}`,
        detail: `Processions ${processions}`,
        tagline: 'Let attrition stack Trail and Scar, then choose Aggression or Endurance.',
        summary: 'Build Trail and Scar through card plays and losses, choose a War Path with your first Eternal card, and collect the end-turn Oblivion payout. Open the Guide for full details.',
        metrics: [
          createMetric('Trail', trail, 'Builds from plays and losses. Amplifies chain on Conversion plays.'),
          createMetric('Scar', scar, 'Cashed out at end of turn for Oblivion based on War Path.'),
          createMetric('Path', turn.thornWarPath ?? 'Unset', 'Aggression or Endurance  Eset by your first Eternal card this turn.'),
          createMetric('Processions', processions, 'Last Procession trigger count this turn.'),
        ],
        nextSteps: [
          createStep('Build Trail first', trail >= 8, trail >= 8
            ? 'Trail is respectable. Start converting the march into pressure.'
            : 'Open with Trail builders before asking Thornbound to pay you back.'),
          createStep('Let Scar matter', scar >= 2, scar >= 2
            ? 'Scar is active. This is when Thornbound payoff cards start to matter.'
            : 'Keep layering attrition so Scar becomes worth cashing.'),
          createStep('Commit to a path', Boolean(turn.thornWarPath), Boolean(turn.thornWarPath)
            ? 'A war-path is chosen. Sequence around that line instead of hedging.'
            : 'Choose a Thornbound path before spending your biggest payoff pieces.'),
        ],
      };
    }
    case 'mechanical': {
      const queue = turn.mechanicalInstructionQueue ?? [];
      const diversity = turn.mechanicalInstructionDiversity ?? [];
      const resolved = turn.mechanicalResolvedInstructions ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Resolved ${resolved} | Queue ${queue.length} | Modes ${diversity.length} | Kernel ${turn.mechanicalKernelLocked ? 'Locked' : 'Open'}`,
        detail: `Instructions ${formatPreview(queue)} | Diversity ${formatPreview(diversity)}`,
        tagline: 'Queue clean Instructions, advance the Clock, then Overclock the best sequence.',
        summary: 'Each card enqueues an instruction; Ophanim and Angel cards advance the clock by 2 steps instead of 1. If your deck includes Infinite cards, meeting 3 Resolved + 3 Modes amplifies them to ÁE.21. Open the Guide for full details.',
        metrics: [
          createMetric('Resolved', resolved, 'Instructions executed by the clock this turn.'),
          createMetric('Queue', queue.length, 'Instructions waiting to fire when the clock advances.'),
          createMetric('Modes', diversity.length, 'Distinct instruction types queued. At 3+ (with 3 Resolved), Infinite cards gain ÁE.21 amplification.'),
          createMetric('Kernel', turn.mechanicalKernelLocked ? 'Locked' : 'Open', 'Locked = next instruction fires at full efficiency.'),
        ],
        nextSteps: [
          createStep('Keep the kernel open', !turn.mechanicalKernelLocked, !turn.mechanicalKernelLocked
            ? 'The kernel is flexible. This is the best time to queue diverse instructions.'
            : 'The kernel is locked. Resolve what you have before adding more risk.'),
          createStep('Diversify the queue', diversity.length >= 2, diversity.length >= 2
            ? 'Multiple instruction modes are online. Shift into conversion or payoff pieces.'
            : 'Mix your instruction modes so the engine gets more than one kind of work done.'),
          createStep('Pay off after resolution', resolved >= 3, resolved >= 3
            ? 'Enough instructions have resolved. Mechanical payoff cards should hit harder now.'
            : 'Stay on setup pieces until several instructions have already cleared.'),
        ],
      };
    }
    case 'prismatic': {
      const channels = turn.prismaticDistinctChannels ?? [];
      const channel = capitalize(turn.prismaticCurrentChannel);
      const depth = turn.prismaticRefractionDepth ?? 0;
      const nodes = turn.prismaticNodeCharges ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Channel ${channel} | Refraction ${depth} | Nodes ${nodes} | Colors ${channels.length}`,
        detail: `Spectrum ${formatPreview(channels.map(capitalize))}`,
        tagline: 'Route through every Spectrum color, then fire Ninefold Accord.',
        summary: 'Switch between color channels to build Refraction Depth and amplify chain. If your deck includes Infinite cards, meeting 4 Colors + 3 Refraction amplifies them to ÁE.22. Open the Guide for full details.',
        metrics: [
          createMetric('Channel', channel, 'Current active color channel.'),
          createMetric('Refraction', depth, 'Increases with each channel switch. Amplifies chain.'),
          createMetric('Nodes', nodes, 'Node Charges from Eternal cards. Further amplify chain on channel switch.'),
          createMetric('Colors', channels.length, 'Distinct channels used. At 4+ (with Refraction 3), Infinite cards gain ÁE.22 amplification.'),
        ],
        nextSteps: [
          createStep('Rotate channels', channels.length >= 3, channels.length >= 3
            ? 'Spectrum diversity is healthy. Lean into refraction and payout now.'
            : 'Play into different prismatic colors before you spend your best payoff piece.'),
          createStep('Deepen refraction', depth >= 2, depth >= 2
            ? 'Refraction depth is online. Your payoff cards have real backing now.'
            : 'Keep layering refraction before you try to cash the spectrum.'),
          createStep('Stock nodes', nodes >= 2, nodes >= 2
            ? 'Node charges are ready. Spend them when the color spread is widest.'
            : 'Use setup cards that create or preserve node charges.'),
        ],
      };
    }
    case 'blackGlass': {
      const white = turn.blackGlassWhiteFlame ?? 0;
      const black = turn.blackGlassBlackFlame ?? 0;
      const fracture = turn.blackGlassFracture ?? 0;
      const oaths = turn.blackGlassGriefOaths ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `White ${white} | Black ${black} | Fracture ${fracture} | Oaths ${oaths}`,
        detail: turn.blackGlassCollapsePending ? 'Collapse is primed for the next payoff.' : `Last payoff ${turn.blackGlassLastPayoff ?? 0}`,
        tagline: 'Farm Fracture behind Grief Oaths, then collapse for Two Truths.',
        summary: 'Grow both flames together to generate Fracture, and keep them balanced to avoid Collapse Pending. If your deck includes Infinite cards, meeting Fracture 3 + both flames ≥ 3 amplifies them to ÁE.2. Open the Guide for full details.',
        metrics: [
          createMetric('White Flame', white, 'Grows from Setup/Refund/Cherubim plays.'),
          createMetric('Black Flame', black, 'Grows from Conversion/Finisher/Ophanim/Seraphim plays.'),
          createMetric('Fracture', fracture, 'Built when both flames rise together or stay balanced. At 3+ (both flames ≥ 3), Infinite cards gain ÁE.2 amplification.'),
          createMetric('Oaths', oaths, 'Absorbs one flame-gap collapse per charge.'),
        ],
        nextSteps: [
          createStep('Keep the flames balanced', Math.abs(white - black) <= 2, Math.abs(white - black) <= 2
            ? 'The flame tracks are balanced enough to reward a collapse turn.'
            : 'Feed the weaker flame before firing payoff cards so fracture stays efficient.'),
          createStep('Grow fracture', fracture >= 2, fracture >= 2
            ? 'Fracture is active. Start looking for the collapse window.'
            : 'Keep setting up fracture before cashing the inferno.'),
          createStep('Collapse on purpose', Boolean(turn.blackGlassCollapsePending), Boolean(turn.blackGlassCollapsePending)
            ? 'Collapse is primed. The next payoff card should matter.'
            : 'Avoid premature payoff until the collapse is actually prepared.'),
        ],
      };
    }
    case 'snowbound':
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Phase ${turn.snowboundPhase ?? 'Unset'} | Potential ${turn.snowboundPotential ?? 0} | Alternations ${turn.snowboundAlternations ?? 0} | Conduits ${turn.snowboundConduits ?? 0}`,
        detail: 'Frost grows setup windows. Voltage cashes them in.',
        tagline: 'Store Potential on Frost, spend it all on the Voltage surge.',
        summary: 'Alternate between Frost and Voltage phases to build Potential and chain bonuses. If your deck includes Infinite cards, meeting 3 Alternations + 3 Potential amplifies them to ÁE.21. Open the Guide for full details.',
        metrics: [
          createMetric('Phase', turn.snowboundPhase ?? 'Unset', 'Frost charges Potential; Voltage discharges it to amplify chain.'),
          createMetric('Potential', turn.snowboundPotential ?? 0, 'Charged by Frost plays. Released by Voltage plays to amplify chain.'),
          createMetric('Alternations', turn.snowboundAlternations ?? 0, 'Each phase switch adds 1. At 3+ (with Potential 3), Infinite cards gain ÁE.21 amplification.'),
          createMetric('Conduits', turn.snowboundConduits ?? 0, 'From Eternal cards. Absorbs one same-phase repeat without losing Potential.'),
        ],
        nextSteps: [
          createStep('Build Frost-side value', (turn.snowboundPotential ?? 0) >= 2, (turn.snowboundPotential ?? 0) >= 2
            ? 'Potential is stocked. You can start thinking about the Voltage cashout.'
            : 'Use Frost-side setup cards first so the next phase switch actually matters.'),
          createStep('Alternate deliberately', (turn.snowboundAlternations ?? 0) >= 1, (turn.snowboundAlternations ?? 0) >= 1
            ? 'The cycle is already alternating cleanly. Keep the rhythm going.'
            : 'Avoid getting stuck in one phase; Snowbound pays you for clean swaps.'),
          createStep('Spend with Voltage', (turn.snowboundPhase ?? '') === 'Voltage', (turn.snowboundPhase ?? '') === 'Voltage'
            ? 'Voltage is active. This is when payoff cards should feel the best.'
            : 'Hold the big spender until the engine is actually in Voltage.'),
        ],
      };
    case 'glassAbsolute': {
      const axioms = turn.glassAxioms ?? [];
      const fragments = turn.glassProofFragments ?? 0;
      const depth = turn.glassProofDepth ?? 0;
      const cascade = turn.glassProofCascade ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Proofs ${fragments} | Depth ${depth} | Cascade ${cascade} | Axioms ${axioms.length}`,
        detail: `Axioms ${formatPreview(axioms.map(capitalize))}`,
        tagline: 'Build the theorem lattice, then cascade it in the right order.',
        summary: 'Pack Glass Absolute cards adjacently on the board to form proof links and earn immediate Oblivion. If your deck includes Infinite cards, meeting Cascade 2 + Axioms 2 + Depth 4 amplifies them to ÁE.24. Open the Guide for full details.',
        metrics: [
          createMetric('Proofs', fragments, 'Glass Absolute cards currently on board.'),
          createMetric('Depth', depth, 'Highest depth-plus-token score among board cards.'),
          createMetric('Cascade', cascade, 'Board link count ÷ 2. Each new link grants immediate Oblivion.'),
          createMetric('Axioms', axioms.length, 'Registered rule types from Eternal cards. At 2+ (with Cascade 2 + Depth 4), Infinite cards gain ÁE.24 amplification.'),
        ],
        nextSteps: [
          createStep('Gather fragments', fragments >= 3, fragments >= 3
            ? 'Fragment count is healthy. Start building depth and connected lines.'
            : 'Play fragment builders before you ask Glass Absolute to cash out.'),
          createStep('Deepen the proof', depth >= 2, depth >= 2
            ? 'Proof depth is live. This is when lattice payoff gets interesting.'
            : 'Keep adding depth so the lattice can support a real cascade.'),
          createStep('Connect axioms', axioms.length >= 2, axioms.length >= 2
            ? 'Multiple axioms are online. Sequence around that connection map.'
            : 'Add more axiom coverage before firing your biggest theorem payoff.'),
        ],
      };
    }
    case 'pyro': {
      const pressure = turn.pyroFurnacePressure ?? turn.pyroFervor ?? 0;
      const fault = turn.pyroAbyssFault ?? turn.pyroRupture ?? 0;
      const windows = turn.pyroRuinWindows ?? 0;
      const unstableFervorTokens = turn.pyroUnstableFervorTokens ?? 0;
      const ashTokens = turn.pyroAshTokens ?? 0;
      const resonanceStacks = turn.pyroResonanceStacks ?? 0;
      const convergenceLocked = turn.pyroConvergenceLocked ?? false;
      const legacyAmplifications = unstableFervorTokens + ashTokens + resonanceStacks + (convergenceLocked ? 1 : 0);
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Pressure ${pressure} | Fault ${fault} | Windows ${windows} | Legacy ${legacyAmplifications}`,
        detail: `Legacy Unstable ${unstableFervorTokens} | Ash ${ashTokens} | Resonance ${resonanceStacks}${convergenceLocked ? ' | Converged' : ''}`,
        tagline: 'Build Furnace Pressure, crack it into Abyss Fault, then detonate Ruin Windows on your timing.',
        summary: 'Pyroabyss now revolves around a three-step loop. Pressure is built by setup-heavy Fire plays, converted into Fault through Ophanim/Cherubim lines, then cashed via Ruin Windows for burst chain and Oblivion. Balanced Pressure/Fault lines naturally generate extra windows, while Eternal and Infinite cards widen or cash those windows for premium payoffs.',
        metrics: [
          createMetric('Furnace Pressure', pressure, 'Primary setup pool generated by Fire sequencing. High pressure enables conversion lines.'),
          createMetric('Abyss Fault', fault, 'Converted void pool consumed by finishers and Infinite scaling lines.'),
          createMetric('Ruin Windows', windows, 'Cashout charges used by Eternal/Infinite abilities for chain and Oblivion spikes.'),
          createMetric('Pool Balance', pressure > fault ? `Pressure-bias (+${pressure - fault})` : fault > pressure ? `Fault-bias (+${fault - pressure})` : 'Balanced', 'Keeping pools close creates extra windows and smoother Angel conversion turns.'),
        ],
        nextSteps: [
          createStep('Build Pressure 12+', pressure >= 12, pressure >= 12 ? 'Pressure is online. Start converting before it overcaps.' : 'Lead with setup Fire lines to charge Furnace Pressure.'),
          createStep('Convert into Fault 8+', fault >= 8, fault >= 8 ? 'Fault pool is live for Eternal/Infinite payoff windows.' : 'Use conversion Ophanims/Cherubim to move Pressure into Fault.'),
          createStep('Hold 2+ Ruin Windows', windows >= 2, windows >= 2 ? 'You can now plan a deterministic cashout sequence.' : 'Sequence balanced plays to create more Ruin Windows before firing finishers.'),
        ],
      };
    }
    case 'blazingGarden': {
      const lineages = Array.from(new Set(turn.burningGardenLineagesPlayed ?? []));
      const law = turn.burningGardenLaw ?? 'Unbound';
      const echoes = turn.burningGardenEchoesBloomed ?? 0;
      const grove = board?.emberGrove?.length ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Law ${law} | Echoes ${echoes} | Lineages ${lineages.length} | Grove ${grove}`,
        detail: `Lineages ${formatPreview(lineages)}`,
        tagline: 'Choose a Grove Law, balance your lineages, then trigger Final Chord Bloom.',
        summary: 'Blazing Garden runs an Ember Grove Ecosystem Engine: spent cards become Seeds carrying Rose, Sunflower, or Thistle lineage memory. Re-germinating seeds creates Echo cards with combo utility. Grove Laws apply global lineage modifiers. Final Chord Bloom simultaneously blooms all lineages  Eeach bloom modifies the next, rewarding balanced lineage rhythm.',
        metrics: [
          createMetric('Law', law, 'Grove Law applying a global modifier this turn  ERose adds echoes, Sunflower grants chain safety, Thistle improves conversion precision'),
          createMetric('Echoes', echoes, 'Reduced-power Echo cards re-generated from Seeds  Ecarry lineage memory for combo utility'),
          createMetric('Lineages', lineages.length, 'Rose, Sunflower, Thistle lines active  Eall three present maximizes Final Chord Bloom payoff'),
          createMetric('Grove', grove, 'Cards stored in the Ember Grove  Ethey become Seeds on next echo; more stock = more echo options'),
        ],
        nextSteps: [
          createStep('Choose a law', law !== 'Unbound', law !== 'Unbound'
            ? 'A law is active. Sequence the rest of the turn around that rule.'
            : 'Blazing Garden gets much clearer once you actually bind yourself to a law.'),
          createStep('Branch lineages', lineages.length >= 2, lineages.length >= 2
            ? 'Multiple lineages are live. The garden is ready to echo harder.'
            : 'Keep planting different lineages before asking the grove to pay you back.'),
          createStep('Harvest a stocked grove', grove >= 2, grove >= 2
            ? 'The grove is stocked. This is when bloom and burn cashouts feel best.'
            : 'Avoid spending the garden too early; let the grove actually accumulate stock.'),
        ],
      };
    }
    case 'butterfly': {
      const spectrum = turn.butterflySpectrum ?? 0;
      const stance = turn.butterflyStance ?? 'Unset';
      const flutterLevel = turn.butterflyFlutterLevel ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Spectrum ${spectrum} | Stance ${stance} | Flutter ${flutterLevel}`,
        detail: 'Thresholds: 4 Minor, 8 Major, 12 Descent',
        tagline: 'Charge, Tune, and Release toward the next world-scale Flutter.',
        summary: 'Butterfly cards feed a shared Spectrum meter. Tuning between Reflect and Absorb changes how Releases behave, and hitting high thresholds creates free pulse value before the descent reset.',
        metrics: [
          createMetric('Spectrum', spectrum, 'Shared Butterfly resource spent by release effects.'),
          createMetric('Stance', stance, 'Reflect favors draw/value, Absorb favors damage, Dual does both.'),
          createMetric('Flutter Tier', flutterLevel, '0 none, 1 minor threshold reached, 2 major threshold reached.'),
          createMetric('Descent Ready', spectrum >= 10 ? 'Near' : 'Building', 'At 12 Spectrum, descent-style pulse effects trigger and reset.'),
        ],
        nextSteps: [
          createStep('Charge to first pulse', spectrum >= 4, spectrum >= 4
            ? 'Minor Flutter threshold reached. Start planning your first release timing.'
            : 'Keep charging Spectrum with setup pieces until the first pulse is online.'),
          createStep('Set your stance', stance !== 'Unset', stance !== 'Unset'
            ? `Stance is ${stance}. Sequence cards that exploit this mode.`
            : 'Tune into Reflect or Absorb before spending Spectrum.'),
          createStep('Release at major tier', spectrum >= 8, spectrum >= 8
            ? 'Major tier is active. High-value release effects should now overperform.'
            : 'Build to 8 Spectrum before committing your strongest release card.'),
        ],
      };
    }
    case 'eternalSeas': {
      const current = turn.eternalSeasCurrent ?? 0;
      const polarity = turn.eternalSeasPolarity ?? 'Unset';
      const white = turn.eternalSeasWhiteFlow ?? 0;
      const black = turn.eternalSeasBlackFlow ?? 0;
      const margin = turn.eternalSeasMarginCharge ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Current ${current} | Polarity ${polarity} | Margin ${margin}`,
        detail: `White ${white} | Black ${black}`,
        tagline: 'Alternate white and black flows to supercharge Veilmargin releases.',
        summary: 'Eternal Seas builds one Current pool while tracking white/black flow pressure. When both flows are active, margin charge rises and release effects cash out larger spikes.',
        metrics: [
          createMetric('Current', current, 'Shared resource consumed by Eternal Seas release effects.'),
          createMetric('Polarity', polarity, 'Current active lane for whitewater or blackwater bonuses.'),
          createMetric('Flow Split', `${white}/${black}`, 'White and black flow counters used to grow Veilmargin pressure.'),
          createMetric('Margin Charge', margin, 'Boundary charge that boosts release payoffs when both flows are represented.'),
        ],
        nextSteps: [
          createStep('Establish both flows', white > 0 && black > 0, white > 0 && black > 0
            ? 'Both water states are online. Margin charge can now accumulate quickly.'
            : 'Play cards from both polarity lanes to activate the Veilmargin loop.'),
          createStep('Stock current', current >= 6, current >= 6
            ? 'Current reserve is healthy. You can schedule a strong release.'
            : 'Keep building Current before firing your top-end release cards.'),
          createStep('Cash with margin', margin >= 3, margin >= 3
            ? 'Margin pressure is live. Release effects now gain meaningful bonus damage.'
            : 'Hold release cards until Veilmargin charge has had time to build.'),
        ],
      };
    }
  }
}

// ─── User Guides ────────────────────────────────────────────────────────────

export interface GuideSection {
  heading: string;
  body: string;
}

export interface EngineGuide {
  engineKey: EngineKey;
  title: string;
  intro: string;
  sections: GuideSection[];
}

export const SET_ENGINE_GUIDES: Record<EngineKey, EngineGuide> = {
  neutrality: {
    engineKey: 'neutrality',
    title: 'User Guide to: Neutrality',
    intro: 'The Neutrality engine is called the Patience Engine. One rule drives everything: every card you play charges your waiting Seraphim. When a Seraphim attacks, it consumes every Patience stack it has built  Eand each stack adds +15 Oblivion to that attack. The longer you wait, the harder it hits.',
    sections: [
      {
        heading: 'How Patience Builds',
        body: 'Every time you play ANY card while a Neutrality Seraphim is on the board and waiting to attack, that Seraphim gains +1 Patience automatically. You do not need to activate anything  EPatience accumulates in the background with every single card played.\n\nPatience is stored per Seraphim individually. A Seraphim that has been waiting for 8 cards has 8 Patience. A Seraphim that just fired has 0 Patience and starts building again.\n\nOnly Neutrality Seraphim (those with a defined Patience threshold) participate in this system.',
      },
      {
        heading: 'Seraphim Attack Payoff',
        body: 'When a Neutrality Seraphim attacks, it consumes ALL of its Patience stacks in one burst:\n\n• Each Patience stack adds +15 Oblivion to that attack.\n• 5 Patience = +75 Oblivion bonus. 10 Patience = +150 Oblivion bonus.\n• After firing, Patience resets to 0 and starts building again for the next attack cycle.\n\nNeutrality Seraphim have longer cooldowns by design (5 E cards depending on rarity). That waiting time IS the engine  Ethe delayed attack arrives loaded with stacked Patience.',
      },
      {
        heading: 'Patience Thresholds (Bonus Draw)',
        body: 'Each Neutrality Seraphim has a Patience threshold. If it fires with Patience at or above that threshold, it draws bonus cards in addition to the Oblivion hit:\n\n• Common Seraphim (Null, Void): threshold 3 Patience ↁEdraw 1 card.\n• Rare Seraphim (Balance): threshold 4 Patience ↁEdraw 1 card.\n• Rare Seraphim (Equilibrium): threshold 4 Patience ↁEdraw 2 cards.\n• Epic Seraphim (Still): threshold 5 Patience ↁEdraw 2 cards.\n\nThe bonus draw fires automatically when the threshold is met. If you attack before reaching it, you still get the full +15 Oblivion per stack  Eyou just miss the draw.',
      },
      {
        heading: 'Cherubim: Patience Amplifiers',
        body: 'Neutrality Cherubim have one job: grant extra Patience to the Seraphim directly in front of them, every card you play.\n\n• Common Cherubim: +1 extra Patience per card (adjacent Seraphim gain +2 total instead of +1).\n• Rare Cherubim: +2 extra Patience per card (+3 total per card played).\n• Epic Cherubim: +3 extra Patience per card (+4 total per card played).\n\nA Seraphim sitting adjacent to an Epic Cherubim with a 6-card cooldown has 24 Patience before it fires  Ethat is +360 Oblivion added to the attack before any chain multipliers.\n\nPlace Cherubim next to your highest-rarity Seraphim first to maximise their amplification window.',
      },
      {
        heading: 'Ophanim: The Draw Engine',
        body: 'Neutrality Ophanim are the fuel that runs the patience engine. Every Ophanim you play counts as a card played  Eadding Patience to every waiting Seraphim automatically.\n\nOphanim also draw cards, recycle your deck, and search for Seraphim and Cherubim. A turn full of Ophanim plays means more Patience stacked and a harder-hitting Seraphim attack when the cooldown fires.\n\nDo not hoard Ophanim. The engine rewards playing them early and often.',
      },
      {
        heading: 'Angels: Patience Bursts',
        body: 'Neutrality Angels manipulate Patience directly rather than waiting for it to accumulate naturally:\n\n• On summon: all active Seraphim gain a flat Patience bonus instantly (+5 for The Beginning and the End, +6 for Aegis of Presence, +8 for Scales of Eternity\'s Wake).\n• Activated ability: doubles all current Patience on every active Seraphim simultaneously.\n\nA Seraphim sitting at 6 Patience when an Angel summons and immediately activates goes to 22 Patience after the summon bonus and the doubling  Ethat is +330 Oblivion from Patience alone, added to the next attack.',
      },
    ],
  },

  light: {
    engineKey: 'light',
    title: 'User Guide to: Heavenly Light',
    intro: 'Heavenly Light runs a Choir Cadence Engine. You build a sequence of Hymn Notes by playing different card types, grow Resonance, and amplify chain. The goal is to hit Apotheosis Pulse, the moment when a cadence reaches full power.',
    sections: [
      {
        heading: 'Hymn Notes and Card Types',
        body: 'Every Heavenly Light card has a card type (Ophanim, Cherubim, Seraphim, or Angel). When you play a Light card, the engine automatically registers a Hymn Note equal to that card type. The cadence tracks the last 6 notes you have played, and distinct note types are tracked separately up to a maximum of 4 unique types.',
      },
      {
        heading: 'Resonance',
        body: 'Resonance is the core power meter for Heavenly Light (max 6). Every new note added to the cadence increases Resonance by +1. Playing a Multiplier-class card adds +2 Resonance instead.\n\nIf you play the same note type as the one you just played, Resonance drops by 1 and the cadence resets back to just that one note.\n\nResonance directly amplifies chain: the engine adds up to +1.0 to your current chain multiplier, capped at 1.0, and locks in that value as the minimum chain for the rest of the turn.',
      },
      {
        heading: 'Chorus Anchors',
        body: 'Chorus Anchors protect you from the repeated-note penalty. Each Eternal-rarity Light card you play grants +1 Chorus Anchor (max 3).\n\nWhen you play a repeated note and you have at least 1 Chorus Anchor, the anchor absorbs the repeat: the cadence does not reset, Resonance does not drop, and the anchor counter goes down by 1. Without an anchor, a repeated note resets the cadence and loses Resonance.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'The Choir Cadence engine works fully without Infinite cards. Resonance amplifies chain, Anchors protect your cadence, and every Light card benefits from those effects regardless of rarity.\n\nIf your deck includes Infinite Light cards, they respond to how well the choir has been built:\n\n- x1.22 multiplier (amplified): Resonance >= 3 and distinct note types >= 3.\n- x0.5 multiplier (reduced): either condition is below the threshold.\n\nBuilding the choir well naturally satisfies these conditions. The Infinite card bonus is the reward for playing correctly, not the goal you build around.',
      },
    ],
  },

  thornbound: {
    engineKey: 'thornbound',
    title: 'User Guide to: Thornbound',
    intro: 'Thornbound is an attrition engine. Every card you play and every card you lose builds Trail and Scar. At the end of the turn, all of that accumulated pressure pays out as a burst of Oblivion. The engine rewards commitment: the longer the turn, the bigger the end-turn explosion.',
    sections: [
      {
        heading: 'Trail',
        body: 'Trail is a resource that builds as you play Thornbound cards. Setup-class and Refund-class cards grant +2 Trail per play; all other classes grant +1 Trail.\n\nTrail is also gained when cards are lost. Losing cards adds Trail and Scar simultaneously. Thornbound Conversion-class cards use Trail to amplify chain.',
      },
      {
        heading: 'Scar',
        body: 'Scar accumulates every time you play a Thornbound card and every time you lose a card. Scar is the primary input for the end-turn Oblivion payout. The higher Scar goes, the more Oblivion you collect at the end of the turn.\n\nUnlike Trail, Scar is not spent during the turn. It just accumulates and is cashed out all at once when you end the turn.',
      },
      {
        heading: 'War Path',
        body: 'The War Path is set the first time you play an Eternal-rarity Thornbound card in a turn.\n\n- Aggression: chosen when the Eternal card is a Conversion or Finisher class. It uses Scar x14 as its base and immediately rewards sacrifice or expire events.\n- Endurance: chosen when the Eternal card is any other class. It uses Scar x18 as its base and Trail x3 as a multiplied bonus.\n- Unbound: if no Eternal card has been played yet, the War Path is Unbound and uses Scar x10 as its base.\n\nThe first Eternal card locks the path for the turn.',
      },
      {
        heading: 'End-Turn Payout',
        body: 'When you end the turn, the engine calculates a final Oblivion burst:\n\nPayout = (Scar x war path multiplier) + (Trail x trail multiplier) + (Cards Lost This Turn x 4)\n\nWar path multipliers: Endurance = 18, Aggression = 14, Unbound = 10. Trail multipliers: Endurance = 3, everything else = 1.\n\nThis means Endurance heavily rewards long turns with large Trail, while Aggression rewards aggressive sacrifice plays.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'The Attrition March engine works fully without Infinite cards. Trail, Scar, and the end-turn payout all function based on how much attrition you have built.\n\nIf your deck includes Infinite Thornbound cards, they check how deep the march has gone:\n\n- x1.2 multiplier (amplified): Trail >= 8 and Scar >= 4.\n- x0.48 multiplier (reduced): either condition is below threshold.\n\nThese numbers reflect a well-run turn of Thornbound play. The Infinite bonus rewards the march you were already doing.',
      },
    ],
  },

  mechanical: {
    engineKey: 'mechanical',
    title: 'User Guide to: Mechanical Dreams',
    intro: 'Mechanical Dreams is an instruction queue engine. Every card you play enqueues a micro-instruction. The engine\'s "clock" then executes those instructions in sequence, triggering real game effects. Your job is to fill the queue with the right instructions in the right order.',
    sections: [
      {
        heading: 'How Instructions Are Assigned',
        body: 'Each Mechanical Dreams card, when played, adds one instruction to the queue based on its type and action class:\n\n- draw: Setup-class cards\n- copy: Refund-class cards\n- multiply: Multiplier-class cards\n- trigger: Finisher-class cards\n- gain: Cherubim playing Conversion\n- convert: all other Conversion-class cards\n\nCherubim-type cards and Setup or Refund-class cards are priority cards: they push their instruction to the front of the queue rather than the back.',
      },
      {
        heading: 'The Queue and the Clock',
        body: 'The instruction queue holds up to 8 pending instructions. Ophanim-type and Angel-type cards advance the clock by 2 steps when played; all other cards advance it by 1 step.\n\nEach clock step pops the front instruction from the queue and executes it. Draw pulls a card immediately, gain grants Embers or Radiance, copy and multiply empower the next card, convert grants mixed resources, and trigger deals immediate Oblivion based on resolved instructions.\n\nThe clock fires immediately when a card is played, so you see the effects in real time.',
      },
      {
        heading: 'Kernel Lock',
        body: 'Playing an Eternal-rarity Mechanical card locks the kernel. A locked kernel means the next clock step executes at full efficiency (efficiency = 1). After that step fires, the lock is released. Eternal cards give you a way to ensure the next queued instruction lands at full power.',
      },
      {
        heading: 'Instruction Diversity',
        body: 'The engine tracks how many distinct instruction types you have queued across the turn (max 6 unique types). Instruction diversity is one of the conditions for Infinite card full power.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'The Instruction Stack engine works fully without Infinite cards. Every instruction the clock executes produces real effects regardless of card rarity.\n\nIf your deck includes Infinite Mechanical Dreams cards, they measure how active the engine has been:\n\n- x1.21 multiplier (amplified): Resolved Instructions >= 3 and Instruction Diversity >= 3.\n- x0.5 multiplier (reduced): either condition is below threshold.\n\nA busy, diverse queue naturally satisfies these conditions. The amplification is a bonus for running the engine well, not a requirement to make the engine function.',
      },
    ],
  },

  prismatic: {
    engineKey: 'prismatic',
    title: 'User Guide to: Prismatic Accord',
    intro: 'Prismatic Accord is a channel-switching engine. Cards have color channels, and switching between different channels builds Refraction Depth  Ewhich amplifies chain. The more you alternate channels, the higher chain climbs.',
    sections: [
      {
        heading: 'Color Channels',
        body: 'Every Prismatic card is assigned to one of six color channels based on its name:\n\n• Amber  Ecards with "gold", "sun", or "aurel" in their name.\n• Azure  Ecards with "sky", "storm", "aurora", or "ice" in their name.\n• Crimson  Ecards with "rose", "ember", or "flame" in their name.\n• Emerald  Ecards with "plain", "root", "grove", or "verd" in their name.\n• Violet  Ecards with "mirror", "veil", "refraction", or "spectrum" in their name.\n• White  EEternal-rarity and Infinite-rarity cards, and Angel-type cards that do not match any other pattern.\n\nCards that do not match any keyword fall back: Cherubim ↁEEmerald, Ophanim ↁEViolet, everything else ↁEAmber.',
      },
      {
        heading: 'Refraction Depth',
        body: 'Refraction Depth accumulates when you switch channels between consecutive plays (max 9). Every channel switch grants +1 Refraction Depth; a Multiplier-class card on a channel switch grants +2.\n\nEvery channel switch also amplifies chain: +0.06 per switch. If you stay on the same channel, you get a smaller chain bonus (+0.04) and no Refraction Depth.',
      },
      {
        heading: 'Node Charges',
        body: 'Eternal-rarity Prismatic cards grant +1 Node Charge (max 3). Charges are consumed on a channel switch: if you switch channels and have a Node Charge available, the charge is spent and you get an extra +0.12 chain gain boost on top of the normal +0.06. This effectively makes charged channel switches worth +0.18 chain gain.',
      },
      {
        heading: 'Cross-Set Conversion Bonus',
        body: 'If you play a Prismatic Conversion-class card immediately after a card from a different set, the engine immediately grants +18 flat Oblivion and raises the chain gain by +0.08. This makes Prismatic exceptionally good in mixed-set decks where you naturally alternate between sets.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'The Spectrum Refraction engine works fully without Infinite cards  Eevery channel switch raises the chain gain, Node Charges boost it further, and the cross-set bonus fires on any Conversion play. None of that requires Infinite cards.\n\nIf your deck includes Infinite Prismatic cards, they read how broadly the spectrum has been used:\n\n• ÁE.22 multiplier (amplified): Distinct Channels ≥ 4 AND Refraction Depth ≥ 3.\n• ÁE.46 multiplier (reduced): either condition is below threshold.\n\nSpreading across four channels and building Refraction is what you do naturally when playing Prismatic well. The Infinite bonus comes with it.',
      },
    ],
  },

  blackGlass: {
    engineKey: 'blackGlass',
    title: 'User Guide to: Black Glass Inferno',
    intro: 'Black Glass Inferno is a dual-flame balance engine. White Flame and Black Flame grow separately based on the type of cards you play. Keeping both flames in balance generates Fracture  Eand high Fracture unlocks Infinite card full power.',
    sections: [
      {
        heading: 'White Flame and Black Flame',
        body: 'Every Black Glass card played adds to one or both flame counters (max 30 each):\n\n• White Flame (+2): Setup-class, Refund-class, and Cherubim-type cards.\n• Black Flame (+2): Conversion-class, Finisher-class, Ophanim-type, and Seraphim-type cards.\n• Eternal-rarity cards grant +1 to BOTH flames simultaneously.',
      },
      {
        heading: 'Fracture',
        body: 'Fracture accumulates as you play cards and is the primary unlock metric (max 18):\n\n• +2 Fracture when a single card adds to BOTH flames (e.g., an Eternal card or a card that satisfies both conditions).\n• +1 Fracture when both flames are at 3 or more AND the gap between them is 2 or less.\n\nKeeping both flames close together in value and above 3 is the most efficient way to build Fracture.',
      },
      {
        heading: 'The Flame Gap and Collapse',
        body: 'If the gap between White Flame and Black Flame ever reaches 6 or more, a penalty fires:\n\n• If you have a Grief Oath available, it is consumed and you gain +1 Fracture as compensation.\n• If you have NO Grief Oaths, Collapse Pending is set to true.\n\nCollapse Pending blocks Infinite card full power for the rest of the turn. Avoid letting the flames diverge by more than 5.',
      },
      {
        heading: 'Grief Oaths',
        body: 'Eternal-rarity Black Glass cards grant +1 Grief Oath (max 3). Grief Oaths act as insurance: they absorb one flame-gap collapse event per oath, converting what would have been a penalty into a small Fracture bonus. Without oaths, any gap ≥ 6 sets Collapse Pending.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'The Contradiction engine works fully without Infinite cards  Egrowing both flames, building Fracture, and managing Grief Oaths are all independently rewarding mechanics regardless of what rarity you play.\n\nIf your deck includes Infinite Black Glass cards, they check the state of the contradiction:\n\n• ÁE.2 multiplier (amplified): Fracture ≥ 3, both flames ≥ 3, and Collapse Pending is NOT active.\n• ÁE.47 multiplier (reduced): any condition is not met.\n\nA well-balanced game of flames naturally hits these numbers. The Infinite amplification is the payoff for sustaining the contradiction, not the purpose of the engine.',
      },
    ],
  },

  snowbound: {
    engineKey: 'snowbound',
    title: 'User Guide to: Snowbound Voltage',
    intro: 'Snowbound Voltage is an alternation engine with two phases: Frost and Voltage. You charge up Potential during Frost plays, then release it during Voltage plays for chain gain bonuses. Alternating between phases is the core mechanic.',
    sections: [
      {
        heading: 'Frost and Voltage Phases',
        body: 'Every Snowbound Voltage card is assigned to a phase based on its action class:\n\n• Frost  ESetup-class and Refund-class cards.\n• Voltage  EConversion-class, Multiplier-class, and Finisher-class cards.\n\nPlaying a Frost card while the previous Snowbound card was a Voltage card (or vice versa) counts as an alternation.',
      },
      {
        heading: 'Alternations',
        body: 'Each time you switch phases (Frost ↁEVoltage or Voltage ↁEFrost), Alternations increases by +1 (max 12).\n\nIf you play two cards of the same phase in a row without a Conduit, the penalty fires: Potential decreases by 1.\n\nAlternations count toward the Infinite card gate and also increase the size of each Voltage discharge.',
      },
      {
        heading: 'Potential',
        body: 'Potential is charged during Frost plays and discharged during Voltage plays (max 20).\n\n• Frost play: +2 Potential, +3 Potential if you just alternated.\n• Voltage play: the engine discharges up to (4 + Alternations) points of Potential. Each point discharged amplifies chain by +0.05. Approximately 60% of the discharged Potential is consumed; the rest remains.',
      },
      {
        heading: 'Conduits',
        body: 'Eternal-rarity Snowbound Voltage cards grant +1 Conduit (max 3). A Conduit is consumed when you play the same phase twice in a row (which would normally reduce Potential). Instead of paying the Potential penalty, the Conduit absorbs the repeat and still grants +1 Alternation as if you had switched phases. Conduits let you play multiple same-phase cards without breaking your Alternation count.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'The Polarity engine works fully without Infinite cards  EPotential charges during Frost and fires chain gain bonuses during Voltage, and Conduits protect the rhythm, all regardless of card rarity.\n\nIf your deck includes Infinite Snowbound Voltage cards, they read how well the alternation cycle is running:\n\n• ÁE.21 multiplier (amplified): Alternations ≥ 3 AND Potential ≥ 3.\n• ÁE.44 multiplier (reduced): either condition is below threshold.\n\nThree full phase switches with Potential charged is simply what a working Snowbound turn looks like. The Infinite amplification follows naturally.',
      },
    ],
  },

  glassAbsolute: {
    engineKey: 'glassAbsolute',
    title: 'User Guide to: Glass Absolute',
    intro: 'Glass Absolute is a board-geometry engine. Power comes from how many Glass Absolute cards you have on the board and how closely they are positioned to each other. The engine reads the board layout every time you play a card and rewards dense formations.',
    sections: [
      {
        heading: 'Proof Metrics: Fragments, Depth, and Cascade',
        body: 'Every time you play a Glass Absolute card, the engine scans the board and calculates three values:\n\n• Fragments  Ehow many Glass Absolute cards are currently on the board.\n• Depth  Ethe highest depth-plus-token score among all board cards. Each board slot tracks its own prismatic depth and spectrum tokens.\n• Cascade (Proofs)  Ethe number of valid "links" between adjacent Glass Absolute cards on the board (divided by 2). Two board cards are linked if they are in adjacent slots AND their depth values differ by 1 or less.\n\nNew proofs (links formed since the previous card play) immediately grant Oblivion: each new proof is worth (24 Oblivion + Depth ÁE4 Oblivion).',
      },
      {
        heading: 'Axioms from Eternal Cards',
        body: 'Playing an Eternal-rarity Glass Absolute card registers an Axiom (max 3 unique axiom types):\n\n• Multiplier Axiom  Eregistered by Angel-type cards or Multiplier-class cards. Immediately amplifies chain by +0.1.\n• Bridge Axiom  Eregistered by Ophanim-type cards or Conversion-class cards. While this axiom is active, any Conversion play immediately after a card from a different set grants +2 Depth to the board.\n• Cascade Axiom  Eregistered by all other Eternal cards.\n\nAxioms are tracked by type  Eyou cannot register the same axiom twice.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'The Proof Lattice engine works fully without Infinite cards  Eevery board link formed grants immediate Oblivion, Axioms change the rules of subsequent plays, and Depth boosts that payout. None of this is gated on Infinite cards.\n\nIf your deck includes Infinite Glass Absolute cards, they check how far the lattice has developed:\n\n• ÁE.24 multiplier (amplified): Proof Cascade ≥ 2, Axioms ≥ 2, and Proof Depth ≥ 4.\n• ÁE.43 multiplier (reduced): any condition is below threshold.\n\nA dense board with registered Axioms naturally satisfies these numbers. The Infinite bonus is the lattice paying off at full depth.',
      },
    ],
  },

  pyro: {
    engineKey: 'pyro',
    title: 'User Guide to: Pyroabyss',
    intro: 'Pyroabyss is a furnace engine layered on top of Fire payouts. Every Fire award is shaped by class attenuation, Heat, Burn Debt, Stability, and cross-set conversion fuel. You do not just stack Embers anymore; you manage the whole burn cycle.',
    sections: [
      {
        heading: 'Attenuation and Furnace Breaks',
        body: 'Pyroabyss uses the same five action classes as Neutrality: setup, multiplier, refund, conversion, and finisher. Repeating a class degrades its multiplier in the same order: 100% -> 75% -> 55% -> 40%.\n\nPyro can auto-break a decayed class back to 100%, but only if you have at least 3 Stability to spend. Each break costs 3 Stability, each class can only be broken once per turn, and the deck only gets 1 break in a pure Pyro deck or 2 breaks in a mixed-set deck.',
      },
      {
        heading: 'Heat',
        body: 'Heat runs from 0 to 40 and directly scales positive Fire payouts. The Heat multiplier is 1 + Heat x 0.02, capped at x1.6.\n\nHeat rises from Ember gains, Conversion-class plays (+2 Heat), and Ophanim plays (+1 Heat). Heat falls from Ember spends and from any Radiance gain (-1 Heat).\n\nThe stable firing band is 5 to 18 Heat. Playing inside that band grants +1 Stability. Falling below 5 or going above 18 instead costs 1 Stability.',
      },
      {
        heading: 'Burn Debt',
        body: 'Burn Debt is the penalty for running too hot. After each Fire play, any Heat above 14 adds Burn Debt at a rate of (Heat - 14) x 0.08, up to a cap of 18.\n\nDebt then recovers based on the class you just played: Setup or Refund removes 0.35 Debt; any other class removes 0.1. Burn Debt directly weakens Fire payouts through a penalty multiplier, so leaving it unchecked will erase a lot of your furnace scaling.',
      },
      {
        heading: 'Stability and Cross Fuel',
        body: 'Stability is Pyroabyss\'s flat reward layer. Every stack adds +5 flat Oblivion to positive Fire payouts, and Stability is also the resource spent on auto-breaks.\n\nA Fire play gains extra Stability from ending in the 5-18 Heat band, both gaining and spending Embers during the same play, being Setup-class, and being Eternal-rarity.\n\nPyro also tracks cross-set fuel. Whenever a Conversion-class Fire card is played immediately after a card from a different element, that previous element is recorded. Conversion-class Fire payouts then gain +20% per distinct recorded source, up to 3 sources total for a maximum x1.6 conversion bonus.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'The Pyro furnace works without Infinite cards, but Infinite Fire cards check whether the turn was actually built correctly.\n\nThey gain:\n- x1.22 multiplier when Setup Count >= 3 and Signatures >= 3\n- x0.42 multiplier otherwise\n\nSetup Count increases on every non-Infinite Pyro card you play, up to 6. Signatures record unique card-type plus action-class combinations such as Ophanim:setup or Cherubim:conversion, also up to 6. The set wants you to build a broad furnace turn first, then cash the Infernal payoff after the engine has real shape.',
      },
    ],
  },

  blazingGarden: {
    engineKey: 'blazingGarden',
    title: 'User Guide to: Blazing Garden',
    intro: 'Blazing Garden is a board-persistence and lineage engine. Cards stay on the board and burn for multiple turns. The Garden Law (set by your first Eternal card) shapes how the engine behaves. Building multiple lineages and keeping Burn-phase cards alive is the path to the Infinite card gate.',
    sections: [
      {
        heading: 'Board Persistence and Burn Phase',
        body: 'Unlike most cards, Blazing Garden cards do not leave the board at the end of the turn  Ethey enter a "Burn" phase and stay in their board slots for 2 more turns. Each turn they remain in Burn, their turn counter decrements. When the counter reaches zero, the card "chars" and leaves the board.\n\nCards in Burn phase count as active engines  Ethe more Burn-phase cards on the board simultaneously, the closer you are to the Infinite card gate.',
      },
      {
        heading: 'Lineages',
        body: 'Every Blazing Garden card belongs to a lineage (Rose, Sunflower, or Thistle) based on its definition. The engine tracks which distinct lineages you have played across the turn (in a rolling window of 8 plays).\n\nHaving multiple distinct lineages active benefits the engine: all three lineages being present maximises the Final Chord Bloom payoff when Infinite cards fire.',
      },
      {
        heading: 'Garden Law',
        body: 'The first Eternal-rarity Blazing Garden card you play in a turn sets the Garden Law, which applies a global rule for the rest of that turn:\n\n• Thistle Law: Conversion-class plays raise the chain gain by +0.08.\n• Other laws affect bloom behavior and echo generation.\n\nThe Garden Law can only be set once per turn  Ethe first Eternal card locks it in.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'The Ember Grove Ecosystem engine works fully without Infinite cards  Eboard persistence, lineages, Grove Law modifiers, and echo generation all function based on how you play the ecosystem, not on card rarity.\n\nIf your deck includes Infinite Blazing Garden cards, they check how far the garden has grown:\n\n• ÁE.24 multiplier (amplified): Cards Played This Turn ≥ 4, at least 2 Blazing Garden cards in Burn phase on the board, and at least 1 card in the Ember Grove.\n• ÁE.45 multiplier (reduced): any condition is not met.\n\nFour plays, two persistent Burn cards, and a stocked Grove are all natural outcomes of a normal Blazing Garden turn. The Infinite bonus crowns the garden when it is actually blooming.',
      },
    ],
  },
  butterfly: {
    engineKey: 'butterfly',
    title: 'User Guide to: Age of the Butterfly',
    intro: 'Age of the Butterfly runs a Flutter Spectrum Engine. All set cards either Charge Spectrum, Tune stance (Reflect or Absorb), or Release Spectrum. Your goal is to hit threshold pulses at 4 and 8, then time a decisive descent cycle.',
    sections: [
      {
        heading: 'Charge, Tune, Release',
        body: 'Every Butterfly card contributes by design: Charge effects raise Spectrum, Tune effects set stance, and Release effects spend Spectrum for payoff. Reflect favors draw/value and Absorb favors raw damage/pressure. Dual stance combines both.',
      },
      {
        heading: 'Flutter Thresholds',
        body: `The engine has natural breakpoints as Spectrum grows:

• 4 Spectrum: minor pulse value.
• 8 Spectrum: major pulse value and stronger chain pressure.
• 12 Spectrum: descent-style payoff trigger and reset.

      Because thresholds are shared, every card played can set up a later finisher even if that card is itself a setup piece.`,
      },
      {
        heading: 'Infinite Card Amplification',
        body: `The Flutter Spectrum engine is fully functional without Infinite cards. Infinite Butterfly cards simply check whether you have actually built the engine:

• ÁE.23 multiplier (amplified): Spectrum ≥ 8 and Flutter Tier ≥ 2.
• ÁE.46 multiplier (reduced): otherwise.

      This keeps Infinite payoffs tied to real setup quality instead of standalone power.`,
      },
    ],
  },
  eternalSeas: {
    engineKey: 'eternalSeas',
    title: 'User Guide to: Eternal Seas',
    intro: 'Eternal Seas runs a Veilmargin Current Engine. You build one Current pool, alternate White and Black polarity, and then convert boundary pressure into release bursts.',
    sections: [
      {
        heading: 'Current and Polarity',
        body: 'Cards add to Current while also steering polarity. White and Black lanes both matter: when both lanes are represented, Veilmargin pressure starts accumulating and future releases scale harder.',
      },
      {
        heading: 'Veilmargin Pressure',
        body: 'Margin Charge is the set-wide multiplier state. It rises when both water states are active and powers up release effects. Alternating lanes deliberately is the core skill expression of the set.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: `The Veilmargin loop works with base and Eternal cards alone. Infinite Eternal Seas cards reward completed setup:

• ÁE.23 multiplier (amplified): Current ≥ 9 and Margin Charge ≥ 3.
• ÁE.46 multiplier (reduced): otherwise.

      You get best results when you stock Current first, then spend during high margin windows.`,
      },
    ],
  },
};

// ─── End User Guides ─────────────────────────────────────────────────────────

export function getSetEngineSnapshotForCard(
  def: CardDefinition,
  turn: TurnState,
  board?: BoardState,
): SetEngineSnapshot | null {
  const key = getEngineKeyForCard(def);
  return key ? buildEngineSnapshot(key, turn, board) : null;
}

export function getSetEngineSnapshotsForCards(
  definitions: CardDefinition[],
  turn: TurnState,
  board?: BoardState,
  options?: SetEngineSnapshotOptions,
): SetEngineSnapshot[] {
  const present = new Set<EngineKey>();
  for (const def of definitions) {
    const key = getEngineKeyForCard(def);
    if (key) present.add(key);
  }

  const keys = options?.includeAll
    ? ENGINE_ORDER
    : ENGINE_ORDER.filter(key => present.has(key));

  return keys
    .map(key => buildEngineSnapshot(key, turn, board));
}