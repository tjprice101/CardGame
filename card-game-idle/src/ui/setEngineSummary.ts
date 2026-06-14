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
  | 'eternalSeas'
  | 'abyssalForge'
  | 'deathFlamedHell'
  | 'wishedUponAStar';

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
  'abyssalForge',
  'deathFlamedHell',
  'wishedUponAStar',
];
const ENGINE_META: Record<EngineKey, { label: string; accent: string }> = {
  neutrality: { label: 'Neutrality', accent: ELEMENT_COLORS.Neutrality },
  light: { label: 'Heavenly Light', accent: ELEMENT_COLORS.Light },
  thornbound: { label: 'Thornbound Plains', accent: ELEMENT_COLORS.Thornbound },
  mechanical: { label: 'Mechanical Dreams', accent: ELEMENT_COLORS.Mechanical },
  prismatic: { label: 'Prismatic', accent: ELEMENT_COLORS.Prismatic },
  blackGlass: { label: 'Black Glass', accent: ELEMENT_COLORS.Dark },
  snowbound: { label: 'Snowbound Voltage', accent: ELEMENT_COLORS.SnowboundVoltage },
  glassAbsolute: { label: 'Glass Absolute', accent: ELEMENT_COLORS.GlassAbsolute },
  pyro: { label: 'Pyroabyss', accent: ELEMENT_COLORS.Fire },
  blazingGarden: { label: 'Blazing Garden', accent: ELEMENT_COLORS.BlazingGarden },
  butterfly: { label: 'Age of the Butterfly', accent: ELEMENT_COLORS.Butterfly },
  eternalSeas: { label: 'Eternal Seas', accent: ELEMENT_COLORS.EternalSeas },
  abyssalForge: { label: 'Abyssal Forge', accent: ELEMENT_COLORS.AbyssalForge },
  deathFlamedHell: { label: 'Death-flamed Hell', accent: ELEMENT_COLORS.DeathFlamedHell },
  wishedUponAStar: { label: 'Wished Upon a Star', accent: ELEMENT_COLORS.WishedUponAStar },
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
    setup: 'Draws cards or searches the deck while building Patience on waiting Seraphim.',
    support: 'Sits on board and adds Patience to adjacent Seraphim each card played.',
    resource: 'Adds flat Patience so setup turns still progress toward burst.',
    payoff: 'Consumes Patience stacks to convert setup into Oblivion.',
    amplifier: 'Injects extra Patience or doubles existing stacks.',
    finisher: 'Resolves all Patience at once for a single burst turn.',
  },
  light: {
    setup: 'Adds note variety and Cadence so Light lines scale naturally.',
    support: 'Maintains note continuity and resonance pacing between setup and payoff.',
    resource: 'Builds Radiance and note depth for stronger release windows.',
    payoff: 'Converts Cadence and Radiance into concentrated Oblivion bursts.',
    amplifier: 'Pushes Halo and Cadence scaling once anchors are online.',
    finisher: 'Discharges stacked resonance after a complete Cadence spread.',
  },
  thornbound: {
    setup: 'Builds Trail quickly so Scar conversion starts early.',
    support: 'Preserves procession pressure while feeding Scar efficiently.',
    resource: 'Converts card flow into Scar for stronger threshold turns.',
    payoff: 'Delivers stronger effects once Scar thresholds are reached.',
    amplifier: 'Pushes threshold turns harder after Scar is established.',
    finisher: 'Converts high Scar totals into the largest Oblivion spikes.',
  },
  mechanical: {
    setup: 'Advances Clock ticks while building Strain toward the next Chime.',
    support: 'Stabilizes tick pacing so Chime windows line up with your best cards.',
    resource: 'Adds or vents Strain to control how hard each Chime hits.',
    payoff: 'Cashes Chime timing into burst damage and a primed attack window.',
    amplifier: 'Improves Chime bursts or strengthens the next Mechanical attack after a Chime.',
    finisher: 'Spends a primed Chime on a Mechanical attack for the set\'s biggest burst turn.',
  },
  prismatic: {
    setup: 'Adds Spectrum channels and advances Refraction depth across the full color range.',
    support: 'Stabilizes the lattice with Prism Nodes while channel diversity accumulates.',
    resource: 'Keeps the spectrum rotating so channel diversity stays live for fixed-spend payoff windows.',
    payoff: 'Converts channel diversity and deep Refraction into prismatic Oblivion payoff.',
    amplifier: 'Pushes refracted boards harder once multiple spectrum colors are simultaneously active.',
    finisher: 'Converts a broad channel spread into a multi-wave Oblivion finisher.',
  },
  blackGlass: {
    setup: 'Builds White and Black Flame directly from explicit card effects.',
    support: 'Keeps both flame meters close so scaling stays efficient.',
    resource: 'Alternates White-side and Black-side plays to build Rhythm.',
    payoff: 'Converts balanced flames and Rhythm into stronger payouts.',
    amplifier: 'Adds both-flame growth so alternation and balance are easier to maintain.',
    finisher: 'Spikes Oblivion once both flames and Rhythm are already online.',
  },
  snowbound: {
    setup: 'Locks into Frost and starts banking Arctic Charge for later release.',
    support: 'Keeps phase control clean so your next builder or spender lands in the right stance.',
    resource: 'Stocks Arctic Charge until a real Voltage cashout is worth the turn.',
    payoff: 'Turns stored Arctic Charge into a Voltage burst instead of sitting on setup forever.',
    amplifier: 'Rewards larger stored charge pools before you fire the discharge turn.',
    finisher: 'Triggers a full Voltage release after Frost-built charge has been banked.',
  },
  glassAbsolute: {
    setup: 'Builds fragment tiers first, then starts banking Refraction Charge for conversion turns.',
    support: 'Stabilizes dense formation windows so Refraction Charge spend lines land at full value.',
    resource: 'Refraction Charge is the shared Eternal/Infinite ancillary resource and fuels burst scaling.',
    payoff: 'Converts charge plus formation density into immediate Oblivion spikes and empowered followups.',
    amplifier: 'Infinite overlays add queue, floor, and ledger riders on top of the same charge track.',
    finisher: 'Cashes high-charge formation turns into large multi-step Glass burst windows.',
  },
  pyro: {
    setup: 'Builds Heat early so Fire attacks and burst cards come online quickly.',
    support: 'Keeps Heat gain, threshold checks, and burst timing aligned between setup and payoff.',
    resource: 'Stocks Heat as the core base resource that all Pyro lines build around.',
    payoff: 'Converts banked Heat into immediate Oblivion burst at the right window.',
    amplifier: 'Boosts Heat generation or sharpens burst timing once the core loop is active.',
    finisher: 'Cashes a prepared Heat bank into one decisive Fire turn.',
  },
  blazingGarden: {
    setup: 'Establishes Burn uptime and branches lineages while Eternal cards start Wild Pollen banking.',
    support: 'Keeps Ember Grove stocked and Echo lines active so seeded turns do not stall out.',
    resource: 'Builds Wild Pollen through Eternal generators for later seed conversion.',
    payoff: 'Spends banked Wild Pollen through seed effects for amplified Oblivion and score pressure.',
    amplifier: 'Raises seeded payout quality once lineages and Burn uptime are already stable.',
    finisher: 'Converts a prepared Burn and Grove board plus pollen bank into one decisive bloom burst.',
  },
  butterfly: {
    setup: 'Charges Spectrum and starts Formation coverage toward a descent turn.',
    support: 'Fills missing unit types so Formation reaches 4 before the main conversion line.',
    resource: 'Builds shared Spectrum that every Butterfly card can spend or convert.',
    payoff: 'Releases stored Spectrum into Oblivion at the best timing window.',
    amplifier: 'Boosts threshold pulses once major Flutter tiers are online.',
    finisher: 'Triggers a Descent reset turn after full Flutter build-up.',
  },
  eternalSeas: {
    setup: 'Loads Undertow quickly so same-turn release lines are online early.',
    support: 'Skims Foam while sequencing to keep card flow stable without adding a second base lane.',
    resource: 'Undertow is the main burst pool; Foam is the light manual draw extender at 5.',
    payoff: 'Converts stocked Undertow into direct Oblivion through release windows.',
    amplifier: 'Deepwake overlays raise Undertow conversion efficiency and Foam return.',
    finisher: 'Cashes a prepared Deepwake surge into one decisive Undertow release turn.',
  },
  abyssalForge: {
    setup: 'Start by dropping Pearls and banking Forge Crowns so the forge has something to cash out.',
    support: 'Keep Reforge Charges ready so recast effects can fire when the window opens.',
    resource: 'Build Pearls and Forge Crowns together so each recast has more value to replay.',
    payoff: 'Turn banked Pearls and Forge Crowns into Oblivion after the recast loop is established.',
    amplifier: 'Use Nacre and recast effects to make earlier plays matter again at higher value.',
    finisher: 'End the turn by igniting the Unrecorded Hue and cashing out Forge Crowns for the burst.',
  },
  deathFlamedHell: {
    setup: 'Stokes Pyre Embers with cohort plays while the base cards stay veiled.',
    support: 'Keeps Cinder Crown pressure available so the reveal side has something to spend later.',
    resource: 'Bridges Embers and Crowns around the flip, not around a separate resource engine.',
    payoff: 'Converts a revealed base card plus the loaded resources into the burst window.',
    amplifier: 'Escalates Oblivion output once the veiled setup has been flipped at the right time.',
    finisher: 'Ends the turn with a reveal burst: the back face comes off when the board is ready.',
  },
  wishedUponAStar: {
    setup: 'Places Starlight Charges and Dream Lattice so the three star cashout windows can open.',
    support: 'Sits on board and scales attacks while the Starlight and Dream Lattice stockpile builds.',
    resource: 'Stocks Starlight and Dream Lattice so the star cashout payloads grow bigger each turn.',
    payoff: 'Converts Starlight, Dream Lattice, or Star Crowns into Oblivion through one of the star cashouts.',
    amplifier: 'Deepens both the Starlight and Dream tracks so every star cashout multiplies harder.',
    finisher: 'Triggers all three cashouts in one play - Starbirth, Wish Burst, and Constellation Lock.',
  },
};

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
  return {
    label: sanitizeEngineText(label),
    value: sanitizeEngineText(String(value)),
    hint: sanitizeEngineText(hint),
  };
}

function createStep(title: string, ready: boolean, detail: string): EnginePlanStep {
  return {
    title: sanitizeEngineText(title),
    detail: sanitizeEngineText(detail),
    ready,
  };
}

function sanitizeEngineText(value: string): string {
  return value
    .replace(/\uFEFF/g, '')
    // Corruption artifacts observed in shipped copy (e.g. "Evisible", " Eand", "ↁEdraw").
    .replace(/[\u2000-\u200A]\s*E(?=[A-Za-z])/g, ' ')
    .replace(/ↁ\s*E/g, ' - ')
    .replace(/�\s*f?E/g, ' - ')
    .replace(/\bE(?=visible\b)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function sanitizeSnapshot(snapshot: SetEngineSnapshot): SetEngineSnapshot {
  return {
    ...snapshot,
    label: sanitizeEngineText(snapshot.label),
    compact: sanitizeEngineText(snapshot.compact),
    detail: sanitizeEngineText(snapshot.detail),
    tagline: sanitizeEngineText(snapshot.tagline),
    summary: sanitizeEngineText(snapshot.summary),
    metrics: snapshot.metrics.map(metric => ({
      ...metric,
      label: sanitizeEngineText(metric.label),
      value: sanitizeEngineText(metric.value),
      hint: sanitizeEngineText(metric.hint),
    })),
    nextSteps: snapshot.nextSteps.map(step => ({
      ...step,
      title: sanitizeEngineText(step.title),
      detail: sanitizeEngineText(step.detail),
    })),
  };
}

function countBurningGardenUnits(board: BoardState | undefined): number {
  if (!board) return 0;
  let count = 0;
  for (const slot of board.frontSlots) {
    if (slot?.burningGardenPhase === 'Burn') count += 1;
  }
  for (const slot of board.backSlots) {
    if (slot?.burningGardenPhase === 'Burn') count += 1;
  }
  return count;
}

function getEffectTypes(def: CardDefinition): string[] {
  const types: string[] = [];
  const pushEffectTypes = (effects: Array<{ type: string } | null | undefined>): void => {
    for (const effect of effects) {
      if (!effect) continue;
      types.push(effect.type);
    }
  };

  if (def.type === 'Ophanim') {
    pushEffectTypes(def.effects);
  }

  if (def.type === 'Cherubim') {
    pushEffectTypes(def.effects);
    pushEffectTypes(def.onPlayEffects);
  }

  if (def.type === 'Seraphim') {
    pushEffectTypes(def.onPlayEffects);
  }

  if (def.type === 'Angel') {
    pushEffectTypes(def.onSummonEffects);
    pushEffectTypes(def.activatedAbility.effects);
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
    if (def.baseStats.bonusType === 'pyro_heat_per_card' || def.baseStats.bonusType === 'resource_generation') return 'resource';
    if (hasTextSnippet(def, ['sequence'])) return 'setup';
    if (def.baseStats.bonusType === 'power_amplifier' || def.baseStats.bonusType === 'score_per_second') return 'amplifier';
    return 'payoff';
  }

  if (def.type === 'Cherubim') {
    if (hasSomeEffect(def, ['cherubim_resource_per_card', 'cherubim_pyro_heat_gain', 'cherubim_draw_per_card'])) return 'resource';
    if (hasSomeEffect(def, ['cherubim_adjacent_seraphim_bonus', 'cherubim_seraphim_amp', 'cherubim_attack_buff'])) return 'amplifier';
    if (hasSomeEffect(def, ['draw', 'search_deck_by_type', 'look_top_take', 'look_top_take_drop', 'salvage_any', 'salvage_by_type'])) return 'setup';
    return 'support';
  }

  if (hasSomeEffect(def, ['draw', 'search_deck_by_type', 'look_top_take', 'look_top_take_drop', 'look_top_take_type', 'salvage_any', 'salvage_by_type', 'shuffle_discard', 'copy_last_hr'])) {
    return 'setup';
  }

  if (hasSomeEffect(def, ['radiance_gain', 'radiance_spend', 'pyro_heat_gain', 'pyro_heat_spend', 'trail_gain', 'trail_spend', 'strain_gain', 'strain_vent', 'prismatic_light_gain', 'resonance_charge_gain', 'resonance_charge_spend', 'monochromatic_shards_gain', 'arctic_charge_gain', 'bloom_gain', 'butterfly_spectrum_gain', 'seas_undertow_gain', 'seas_foam_gain'])) {
    return 'resource';
  }

  if (hasSomeEffect(def, ['score_flat', 'score_multiplier', 'oblivion_flat', 'power_flat', 'power_percent', 'butterfly_release', 'seas_undertow_release'])) {
    return 'payoff';
  }

  return 'setup';
}

function getCardRoleDetail(def: CardDefinition): string {
  if (hasSomeEffect(def, ['radiance_gain', 'pyro_heat_gain', 'trail_gain', 'strain_gain', 'prismatic_light_gain', 'resonance_charge_gain', 'resonance_charge_spend', 'monochromatic_shards_gain', 'arctic_charge_gain', 'bloom_gain', 'butterfly_spectrum_gain', 'seas_undertow_gain', 'seas_foam_gain', 'radiance_double'])) {
    return 'It stocks the resources this engine spends to stay online.';
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
  if (def.element === 'AbyssalForge') return 'abyssalForge';
  if (def.element === 'DeathFlamedHell') return 'deathFlamedHell';
  if (def.element === 'WishedUponAStar') return 'wishedUponAStar';
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
      const seraphimCount = frontSlots.filter(u => u?.type === 'Seraphim').length;
      const angelCount = frontSlots.filter(u => u?.type === 'Angel').length;
      const patienceEligible = seraphimCount > 0 || angelCount > 0;
      const totalPatience = frontSlots.reduce((acc, unit) => {
        if (!unit || (unit.type !== 'Seraphim' && unit.type !== 'Angel')) return acc;
        return acc + (unit.patienceStacks ?? 0);
      }, 0);
      const patienceUnits = frontSlots.filter(u =>
        u && (u.type === 'Seraphim' || u.type === 'Angel') &&
        (u.patienceStacks ?? 0) > 0,
      ).length;
      const maxPatience = frontSlots.reduce((acc, unit) => {
        if (!unit || (unit.type !== 'Seraphim' && unit.type !== 'Angel')) return acc;
        return Math.max(acc, unit.patienceStacks ?? 0);
      }, 0);
      const activeCherubim = (board?.backSlots ?? []).filter(b => b !== null).length;
      const potentialBonus = totalPatience * 15;
      const chargedThisTurn = turn.neutralityPatienceChargedThisTurn ?? 0;
      const consumedThisTurn = turn.neutralityPatienceConsumedThisTurn ?? 0;
      const recentTriggers = (turn.neutralityTriggeredEffects ?? []).slice(-3);

      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: patienceEligible
          ? `Patience ${totalPatience} total | Peak ${maxPatience} | ${patienceUnits} unit${patienceUnits !== 1 ? 's' : ''} charged`
          : 'Patience paused — no Seraphim or Angel on board',
        detail: `Pending Bonus Oblivion ≁E+${potentialBonus} | Patience active this turn`,
        tagline: 'Neutrality now reports charged, consumed, and converted Patience in real time.',
        summary: 'Every card you play charges +1 Patience on each Seraphim on board, as long as at least one Seraphim or Angel is present. If neither is on board, Patience does not accumulate.',
        metrics: [
          createMetric('Eligibility', patienceEligible ? 'Active' : 'Paused', patienceEligible
            ? `${seraphimCount} Seraphim, ${angelCount} Angel on board.`
            : 'No Seraphim or Angel on board — Patience paused.'),
          createMetric('Total Patience', totalPatience, 'Sum of all Patience stacks across Seraphim and Angels on board. Each stack = +15 Oblivion on next attack.'),
          createMetric('Patience Charged', chargedThisTurn, 'Total Patience added by Neutrality card effects this turn.'),
          createMetric('Patience Consumed', consumedThisTurn, 'Patience spent or transformed by Neutrality card effects this turn.'),
          createMetric('Recent Triggers', recentTriggers.length === 0 ? 'none' : recentTriggers.join(' | '), 'Most recent Neutrality effect activations this turn.'),
        ],
        nextSteps: [
          createStep('Place a Seraphim or Angel', patienceEligible, patienceEligible
            ? `${seraphimCount} Seraphim and ${angelCount} Angel on board — Patience is flowing.`
            : 'No Seraphim or Angel on board — Patience cannot accumulate. Place a Seraphim or summon an Angel.'),
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
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Notes ${cadence} | Cadence ${resonance} | Halo ${(turn.eternalStacks?.light ?? 0)}`,
        detail: `Notes ${formatPreview(notes)} | Echoes ${(turn.lightCadenceNotes ?? []).length}`,
        tagline: 'Build Cadence cleanly, then convert stocked Halo and Radiance into a focused burst.',
        summary: 'Alternate card types to build note variety and Cadence. Eternity and Infinity Light cards add Halo as a direct stock-and-spend layer for burst turns. If your deck includes Infinite cards, meeting Cadence 3 + 3 distinct notes amplifies them to x1.35. Open the Guide for full details.',
        metrics: [
          createMetric('Hymn Notes', cadence, 'Distinct Hymn Note types played this turn.'),
          createMetric('Cadence', resonance, 'Builds attack power. Drops on repeated notes.'),
          createMetric('Halo', turn.eternalStacks?.light ?? 0, 'Stocked by Eternity/Infinity Light cards and spent by Halo threshold/cashout effects.'),
          createMetric('Echoes', (turn.lightCadenceNotes ?? []).length, 'Total note triggers in the rolling cadence window.'),
        ],
        nextSteps: [
          createStep('Add new notes', cadence >= 3, cadence >= 3
            ? 'Note variety is healthy. Start aiming for the payoff side of the choir.'
            : 'Play distinct Light notes first so note variety grows before the payoff turn.'),
          createStep('Build Cadence', resonance >= 3, resonance >= 3
            ? 'Cadence is stocked. Shift into Seraphim or Angel payoff pieces.'
            : 'Keep sequencing Light setup until Cadence is worth cashing.'),
        ],
      };
    }
    case 'thornbound': {
      const trail = turn.trail ?? 0;
      const scar = turn.thornScar ?? 0;
      const spirals = turn.secondaryCounters?.thorn ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Trail ${trail} | Scar ${scar} | Briar Spiral ${spirals} | Threshold ${scar >= 6 ? '6+' : scar >= 4 ? '4+' : scar >= 2 ? '2+' : '0'}`,
        detail: 'Use the Trail orb button to convert 1 Trail into 1 Scar. Eternal cards add Briar Spiral blooms.',
        tagline: 'Build Trail, convert manually, then use Eternal Briar Spiral to amplify payoff turns.',
        summary: 'Thornbound is a visible base loop plus an Eternal amplifier: gain Trail from plays, convert Trail into Scar, then fire cards that improve at Scar thresholds. Eternal Thornbound cards add Briar Spiral as a stack-and-bloom layer that scales Trail and burst timing. There is no automatic end-turn burst in the base engine.',
        metrics: [
          createMetric('Trail', trail, 'Generated from Thornbound plays. You manually convert it into Scar.'),
          createMetric('Scar', scar, 'Built only by manual conversion in the base loop.'),
          createMetric('Briar Spiral', spirals, 'Eternal Thornbound amplifier. Built and consumed by Briar Spiral bloom effects.'),
          createMetric('Threshold 2', scar >= 2 ? 'Online' : 'Offline', 'First Scar threshold many base cards reference.'),
          createMetric('Threshold 4', scar >= 4 ? 'Online' : 'Offline', 'Mid Scar threshold for stronger base payoffs.'),
        ],
        nextSteps: [
          createStep('Build Trail first', trail >= 8, trail >= 8
            ? 'Trail reserve is healthy. Start converting into Scar every turn.'
            : 'Open with Trail builders before you worry about threshold payoffs.'),
          createStep('Let Scar matter', scar >= 2, scar >= 2
            ? 'Threshold payoffs are online. Sequence your best effects now.'
            : 'Convert Trail into Scar until at least threshold 2 is active.'),
          createStep('Push to threshold 4', scar >= 4, scar >= 4
            ? 'Mid threshold is online. Your base Thornbound cards should spike harder now.'
            : 'Keep converting one point at a time until threshold 4 is active.'),
        ],
      };
    }
    case 'mechanical': {
      const strain = turn.strain ?? 0;
      const reactorCores = turn.eternalStacks?.mech ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Strain ${strain} | Reactor Cores ${reactorCores}`,
        detail: `Strain band peaks at 6\u201312 | Reactor Cores cash out for +oblivion`,
        tagline: 'Build Strain to fuel Reactor Cores, then cash out on big plays.',
        summary: 'Mechanical Dreams now runs on a clean Strain \u2192 Reactor Core loop. Strain in the 6\u201312 band amplifies every Mechanical play; Reactor Cores stack via Eternal/Infinite cards and cash out for burst damage.',
        metrics: [
          createMetric('Strain', strain, 'Strain in the 6\u201312 band multiplies Mechanical oblivion.'),
          createMetric('Reactor Cores', reactorCores, 'Eternal/Infinite Mechanical stack \u2014 spend or cash out for bursts.'),
        ],
        nextSteps: [
          createStep('Build Strain', strain >= 6, strain >= 6
            ? 'Strain band is active. Mechanical plays are amplified.'
            : 'Play setup cards that add Strain until you hit 6.'),
          createStep('Accrue Reactor Cores', reactorCores >= 4, reactorCores >= 4
            ? 'You have enough Cores to fire a meaningful cashout.'
            : 'Play Eternal/Infinite Mechanical cards that gain Reactor Cores.'),
          createStep('Vent before overload', strain <= 12, strain <= 12
            ? 'Strain is within the productive band.'
            : 'Vent Strain to drop back into the 6\u201312 band before the penalty bites.'),
        ],
      };
    }
    case 'prismatic': {
      const channels = turn.prismaticDistinctChannels ?? [];
      const channel = capitalize(turn.prismaticCurrentChannel);
      const depth = turn.prismaticRefractionDepth ?? 0;
      const charges = turn.prismaticNodeCharges ?? 0;
      const resonance = turn.prismaticResonanceCharge ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Channel ${channel} | Refraction ${depth} | Prism Charge ${charges} | Resonance ${resonance} | Colors ${channels.length}`,
        detail: `Spectrum ${formatPreview(channels.map(capitalize))}`,
        tagline: 'Switch channels to build Refraction, stock Prism Charge, and cash a fixed-spend payoff.',
        summary: 'Prismatic base play is a depth-first loop: switch channels to build Refraction Depth and gain Prism Charge, then spend fixed charge amounts on payoff cards. Prismatic Eternity and Infinite cards share one overlay resource, Resonance Charge, built and spent by explicit card effects. Infinite lines are stronger Resonance spenders with extra channel/refraction riders, not a separate amplification subsystem. Open the Guide for full details.',
        metrics: [
          createMetric('Channel', channel, 'Current active color channel.'),
          createMetric('Refraction', depth, 'Increases with each channel switch. Amplifies attack power.'),
          createMetric('Prism Charge', charges, 'Base Prismatic gains +1 on channel switch (max 3). Payoff cards spend fixed charge chunks.'),
          createMetric('Resonance Charge', resonance, 'Built and spent by Prismatic Eternity and Infinite card effects.'),
          createMetric('Colors', channels.length, 'Distinct channels used. Many Prismatic Infinity riders check 4+ or 5+ colors.'),
        ],
        nextSteps: [
          createStep('Rotate channels', channels.length >= 3, channels.length >= 3
            ? 'Spectrum diversity is healthy. Lean into refraction and payout now.'
            : 'Play into different prismatic colors before you spend your best payoff piece.'),
          createStep('Deepen refraction', depth >= 2, depth >= 2
            ? 'Refraction depth is online. Your payoff cards have real backing now.'
            : 'Keep layering refraction before you try to cash the spectrum.'),
          createStep('Bank charge', charges >= 2, charges >= 2
            ? 'Prism Charge is banked. This is a good window for fixed-spend payoff cards.'
            : 'Keep switching channels to build Prism Charge before your biggest spender.'),
        ],
      };
    }
    case 'blackGlass': {
      const white = turn.blackGlassWhiteFlame ?? 0;
      const black = turn.blackGlassBlackFlame ?? 0;
      const fracture = turn.blackGlassFracture ?? 0;
      const eclipse = turn.eternalStacks?.glass ?? 0;
      const gap = Math.abs(white - black);
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `White ${white} | Black ${black} | Fracture ${fracture} | Eclipse ${eclipse}`,
        detail: `Gap ${gap} | Last payoff ${turn.blackGlassLastPayoff ?? 0}`,
        tagline: 'Balance both flames, build Fracture, and time Eclipse bursts for payoff turns.',
        summary: 'Black Glass runs on two visible meters plus one Eternal/Infinite extension. White and Black flames fuel Fracture, flame balance improves burst quality, and Eclipse is the only high-rarity ancillary resource. Open the Guide for full details.',
        metrics: [
          createMetric('White Flame', white, 'Built by White-flame cards and fuels balanced payoffs.'),
          createMetric('Black Flame', black, 'Built by Black-flame cards and fuels balanced payoffs.'),
          createMetric('Fracture', fracture, 'Built by Black Glass setup lines and used to scale burst turns.'),
          createMetric('Eclipse', eclipse, 'Generated and spent by Black Glass Eternal/Infinite cards for burst conversion.'),
          createMetric('Flame Gap', gap, 'Smaller gaps produce stronger card-payoff scaling.'),
        ],
        nextSteps: [
          createStep('Keep the gap tight', gap <= 2, gap <= 2
            ? 'Flames are close enough for strong payout efficiency.'
            : 'Play into the weaker flame to reduce the gap before your payoff cards.'),
          createStep('Build fracture', fracture >= 4, fracture >= 4
            ? 'Fracture depth is online and will improve Eclipse burst quality.'
            : 'Sequence fracture builders before committing your major burst cards.'),
          createStep('Stage Eclipse', eclipse >= 4, eclipse >= 4
            ? 'Eclipse stock is ready for a meaningful spend or full burst.'
            : 'Play Black Glass Eternal/Infinite setup cards before your detonation turn.'),
          createStep('Push both flames', Math.min(white, black) >= 6, Math.min(white, black) >= 6
            ? 'Both meters are deep enough for top-end Black Glass scaling.'
            : 'Keep feeding both meters so one side does not fall behind.'),
        ],
      };
    }
    case 'snowbound':
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Phase ${turn.snowboundPhase ?? 'Unset'} | Arctic Charge ${turn.arcticCharge ?? 0}`,
        detail: 'Frost loads the battery. Voltage spends it.',
        tagline: 'Build Arctic Charge in Frost, cash it out in Voltage.',
        summary: 'Base Snowbound cards are explicitly marked Frost or Voltage. Frost cards stock Arctic Charge; Voltage cards convert that stored charge into burst payoff. If your deck includes Infinite cards, Voltage with 12+ Arctic Charge gives the full bonus. Open the Guide for full details.',
        metrics: [
          createMetric('Phase', turn.snowboundPhase ?? 'Unset', 'Frost cards are builders. Voltage cards are cashout cards.'),
          createMetric('Arctic Charge', turn.arcticCharge ?? 0, 'Your shared Snowbound battery. Frost grows it; Voltage cards spend it for extra burst.'),
          createMetric('Infinite Gate', (turn.snowboundPhase ?? '') === 'Voltage' && (turn.arcticCharge ?? 0) >= 12 ? 'Ready' : 'Not ready', 'Infinite Snowbound cards reach full power when you are in Voltage with 12+ Arctic Charge.'),
        ],
        nextSteps: [
          createStep('Load the battery', (turn.arcticCharge ?? 0) >= 8, (turn.arcticCharge ?? 0) >= 8
            ? 'Arctic Charge is stocked. You have enough banked to justify a Voltage turn.'
            : 'Lead with Frost cards until the battery actually matters.'),
          createStep('Commit to the right stance', Boolean(turn.snowboundPhase), Boolean(turn.snowboundPhase)
            ? `You are currently in ${turn.snowboundPhase}. Sequence the next Snowbound card around that role.`
            : 'Your next Snowbound card decides whether you are building or cashing out.'),
          createStep('Spend with Voltage', (turn.snowboundPhase ?? '') === 'Voltage' && (turn.arcticCharge ?? 0) > 0, (turn.snowboundPhase ?? '') === 'Voltage' && (turn.arcticCharge ?? 0) > 0
            ? 'Voltage is active. This is when payoff cards should feel the best.'
            : 'Hold the big spender until the engine is actually in Voltage.'),
        ],
      };
    case 'glassAbsolute': {
      const fragments = turn.glassProofFragments ?? 0;
      const refractionCharge = turn.secondaryCounters?.absol ?? 0;
      const waveQueue = turn.glassWaveQueue ?? 0;
      const ledger = turn.glassWhiteLedger ?? 0;
      const chargeFloor = turn.glassDepthFloor ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Fragments ${fragments} | Formation ${fragments >= 7 ? 'Full' : fragments >= 5 ? 'Stable' : fragments >= 3 ? 'Online' : 'Building'} | Refraction ${refractionCharge}`,
        detail: `Overlays: Refraction ${refractionCharge} | Queue ${waveQueue} | Ledger ${ledger} | Floor ${chargeFloor}`,
        tagline: 'Base loop: flood fragments, then cash dense formation turns.',
        summary: 'Base Glass Absolute is fragments-first: each base Glass play scales from your current fragment count with tier bonuses at 3, 5, and 7 fragments. Eternal and Infinite cards now share Refraction Charge as one ancillary mechanic. Infinite cards are stronger charge converters that add queue, floor, and ledger riders instead of switching to a separate subsystem.',
        metrics: [
          createMetric('Fragments', fragments, 'Glass Absolute cards currently on board. This is the core base scaler.'),
          createMetric('Formation Tier', fragments >= 7 ? 'Tier 3' : fragments >= 5 ? 'Tier 2' : fragments >= 3 ? 'Tier 1' : 'Tier 0', 'Tier bonuses unlock at 3, 5, and 7 fragments.'),
          createMetric('Refraction Charge', refractionCharge, 'Shared by Eternal and Infinite Glass cards; build and spend it for amplified conversions.'),
          createMetric('Wave Queue (Infinite)', waveQueue, 'Built by Infinite queue lines and spent by release cards for added burst.'),
          createMetric('White Ledger (Infinite)', ledger, 'Stored payout bank for Color After White end-turn conversion.'),
          createMetric('Charge Floor (Infinite)', chargeFloor, 'Minimum Refraction Charge pressure sustained by Yreth floor effects.'),
        ],
        nextSteps: [
          createStep('Gather fragments', fragments >= 3, fragments >= 3
            ? 'Tier 1 is online. Your base Glass cards are now paying meaningful formation bonuses.'
            : 'Play more base Glass cards to reach the first formation tier.'),
          createStep('Push dense formation', fragments >= 5, fragments >= 5
            ? 'Tier 2 is active. This is the strongest base rhythm window.'
            : 'Keep filling the board to hit 5 fragments before spending major finishers.'),
          createStep('Refraction conversion line', refractionCharge >= 4, refractionCharge >= 4
            ? 'Refraction Charge is stocked. Eternal and Infinite Glass cards can now convert this into stronger fragment cashouts.'
            : 'If you include higher-rarity Glass cards, build Refraction Charge before spending conversion pieces.'),
        ],
      };
    }
    case 'pyro': {
      const heat = turn.pyroHeat ?? 0;
      const infernoTiers = turn.eternalStacks?.pyro ?? 0;
      const chromaEmbers = turn.secondaryCounters?.pyro ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Heat ${heat} | Inferno ${infernoTiers} | Chroma ${chromaEmbers}`,
        detail: 'Base Fire uses Heat; Eternal/Infinite/Transcendent layers add Inferno + Chroma overlays.',
        tagline: 'Build Heat, burst from Heat, then layer Inferno and Chroma for high-tier conversions.',
        summary: 'Pyroabyss now has a base-first loop: gain Heat, hit thresholds, and cash Heat burst windows. Eternal/Infinite/Transcendent cards stay scalable by adding Inferno stack interactions and Chroma Ember ignition on top of that same base rhythm.',
        metrics: [
          createMetric('Heat', heat, 'Base Pyro resource. Built by stoke cards and spent by burst cards.'),
          createMetric('Inferno', infernoTiers, 'Higher-rarity Fire stack used by Eternal/Infinite/Transcendent effects.'),
          createMetric('Chroma Embers', chromaEmbers, 'Higher-rarity secondary stack consumed by ignite payoffs.'),
          createMetric('Attack Heat Mult', `x${(1 + Math.min(0.75, heat * 0.025)).toFixed(2)}`, 'Fire Seraphim and Angel attacks gain +2.5% per Heat, capped at +75%.'),
          createMetric('Eternal Chroma Mult', `x${(1 + Math.min(0.16, chromaEmbers * 0.04)).toFixed(2)}`, 'Eternal Fire Seraphim and Angel attacks gain +4% per Chroma Ember, capped at +16%, then consume all Chroma Embers.'),
          createMetric('Infinite Chroma Mult', `x${(1 + Math.min(0.25, chromaEmbers * 0.05)).toFixed(2)}`, 'Infinite Fire Seraphim and Angel attacks gain +5% per Chroma Ember, capped at +25%, then consume all Chroma Embers.'),
          createMetric('Heat Tier', heat >= 15 ? 'Cataclysm' : heat >= 10 ? 'Inferno' : heat >= 5 ? 'Major' : heat >= 1 ? 'Minor' : 'Cold', 'Higher Heat counts increase Fire attack and base burst scaling.'),
        ],
        nextSteps: [
          createStep('Cross Major Heat', heat >= 5, heat >= 5
            ? 'Major Heat reached. Your base burst cards are now efficient.'
            : 'Stack early Heat builders before committing burst cards.'),
          createStep('Burst at high Heat', heat >= 10, heat >= 10
            ? 'High Heat online. This is a strong base Pyro cashout window.'
            : 'Keep building Heat before your largest base burst card.'),
          createStep('Seed ember bank', chromaEmbers >= 3, chromaEmbers >= 3
            ? 'Ember bank is online. Your ignite cards will now convert efficiently.'
            : 'Add Chroma Ember generators before your first ignite payoff card.'),
          createStep('Layer Inferno/Chroma', infernoTiers >= 6 && chromaEmbers >= 4, infernoTiers >= 6 && chromaEmbers >= 4
            ? 'Overlay resources are primed. This is a full high-tier Pyro window.'
            : 'When running higher-rarity Pyro cards, build both Inferno and Chroma before apex spenders.'),
        ],
      };
    }
    case 'blazingGarden': {
      const lineages = Array.from(new Set(turn.burningGardenLineagesPlayed ?? []));
      const echoes = turn.burningGardenEchoesBloomed ?? 0;
      const freeEchoes = turn.burningGardenArrayFreeEchoes ?? 0;
      const grove = board?.emberGrove?.length ?? 0;
      const pollen = turn.secondaryCounters?.garden ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Pollen ${pollen} | Echoes ${echoes} | Lineages ${lineages.length} | Grove ${grove}`,
        detail: `Lineages ${formatPreview(lineages)}`,
        tagline: 'Keep Burn units alive, stock Ember Grove, then convert Eternal-generated Wild Pollen into burst turns.',
        summary: 'Blazing Garden play is a persistence loop: cards move through Bloom to Burn, then char into Ember Grove. Echo pulls bring charred cards back for combo extension, and lineage variety raises bloom quality. Wild Pollen is now generated by Eternal cards, then spent by seeded payoff cards to amplify Oblivion and score multipliers.',
        metrics: [
          createMetric('Wild Pollen', pollen, 'Generated by Eternal cards and consumed by Seed effects for amplified payouts.'),
          createMetric('Echoes', echoes, 'Reduced-power Echo cards re-generated from Seeds  Ecarry lineage memory for combo utility'),
          createMetric('Free Echoes', freeEchoes, 'Extra echo pulls available this turn without spending the default one-per-turn use.'),
          createMetric('Lineages', lineages.length, 'Rose, Sunflower, Thistle lines active  Eall three present maximizes Final Chord Bloom payoff'),
          createMetric('Grove', grove, 'Cards stored in the Ember Grove  Ethey become Seeds on next echo; more stock = more echo options'),
        ],
        nextSteps: [
          createStep('Build Eternal pollen bank', pollen >= 3, pollen >= 3
            ? 'Wild Pollen is banked. You can safely route into seeded amplification.'
            : 'Play your Eternal generators first so your next Seed effect has fuel.'),
          createStep('Establish Burn uptime', countBurningGardenUnits(board) >= 2, countBurningGardenUnits(board) >= 2
            ? 'Multiple Burn units are active. Your Grove engine is online.'
            : 'Ignite and maintain at least two Burn units before forcing payoff lines.'),
          createStep('Branch lineages', lineages.length >= 2, lineages.length >= 2
            ? 'Multiple lineages are live. Echo turns gain better coverage.'
            : 'Play a second lineage before committing your strongest bloom payoff.'),
          createStep('Harvest a stocked grove', grove >= 2, grove >= 2
            ? 'The grove is stocked. This is when bloom and burn cashouts feel best.'
            : 'Avoid spending the garden too early; let the grove actually accumulate stock.'),
        ],
      };
    }
    case 'butterfly': {
      const spectrum = turn.butterflySpectrum ?? 0;
      const formation = turn.butterflyFormation ?? 0;
      const formationTypes = turn.butterflyFormationTypesSeen ?? [];
      const flutterLevel = turn.butterflyFlutterLevel ?? 0;
      const wingResonance = turn.eternalStacks?.flutter ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Spectrum ${spectrum} | Formation ${formation}/4 | Flutter ${flutterLevel} | Resonance ${wingResonance}`,
        detail: 'Thresholds: 4 Minor, 8 Major, 12 Descent',
        tagline: 'Build Flutter through card flow, complete Formation, then cash a Descent cycle.',
        summary: 'Butterfly base play runs a Formation cycle: first play of each unit type in a cycle increases Formation, while Butterfly setup advances Flutter toward 4, 8, and 12 thresholds. Butterfly Eternity and Infinite cards add Wing Resonance, which cashes current Spectrum and Formation into larger payoff windows without replacing the base loop.',
        metrics: [
          createMetric('Spectrum', spectrum, 'Shared Butterfly resource spent by release effects and reset by Descent at 12.'),
          createMetric('Formation', `${formation}/4`, 'First play of Seraphim, Cherubim, Ophanim, and Angel each cycle increases Formation.'),
          createMetric('Formation Types', formatPreview(formationTypes), 'Distinct Butterfly unit types already played this cycle.'),
          createMetric('Flutter Tier', flutterLevel, '0 none, 1 minor threshold reached (4), 2 major threshold reached (8).'),
          createMetric('Wing Resonance', wingResonance, 'Generated by Butterfly Eternity and Infinite cards, then spent by Resonant Wing payoffs that scale from current Spectrum and Formation.'),
          createMetric('Descent Ready', spectrum >= 10 ? 'Near' : 'Building', 'At 12 Spectrum, Descent triggers and resets Spectrum + Formation cycle state.'),
        ],
        nextSteps: [
          createStep('Charge to first pulse', spectrum >= 4, spectrum >= 4
            ? 'Minor Flutter threshold reached. Start planning your first release timing.'
            : 'Keep charging Spectrum with setup pieces until the first pulse is online.'),
          createStep('Complete Formation', formation >= 4, formation >= 4
            ? 'Formation is complete. Your cycle has covered all four Butterfly unit types.'
            : 'Play missing Butterfly unit types to finish Formation before your biggest conversion turn.'),
          createStep('Release at major tier', spectrum >= 8, spectrum >= 8
            ? 'Major tier is active. High-value release effects should now overperform.'
            : 'Build to 8 Spectrum before committing your strongest release card.'),
          createStep('Bank Wing Resonance', wingResonance >= 2, wingResonance >= 2
            ? 'Wing Resonance is stocked. Your Butterfly higher-rarity payoff cards can convert this cycle cleanly.'
            : 'If your Eternity/Infinite line is online, bank a little Wing Resonance before forcing the payoff turn.'),
        ],
      };
    }
    case 'eternalSeas': {
      const undertow = turn.eternalSeasUndertow ?? 0;
      const foam = turn.eternalSeasFoam ?? 0;
      const deepwake = turn.secondaryCounters?.deepwake ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Undertow ${undertow} | Foam ${foam} | Deepwake ${deepwake}`,
        detail: 'Spend 5 Foam in the HUD to draw 1 card',
        tagline: 'Build Undertow in-turn, release it for burst, and skim Foam into manual draw.',
        summary: 'Base Eternal Seas cards build Undertow and same-turn Foam. Higher-rarity cards now share one overlay keyword, Deepwake: Eternal cards bank and surge it for precision or apex conversions, while Infinite cards use stronger but role-distinct Deepwake profiles (reservoir, micro-surge, pressure hybrid, recursive loop, and catastrophic all-in).',
        metrics: [
          createMetric('Undertow', undertow, 'Base Eternal Seas setup pool. Release it during the same turn for direct Oblivion.'),
          createMetric('Foam', foam, 'Light support pool. Spend 5 Foam from the HUD to draw 1 card.'),
          createMetric('Foam Draw Ready', foam >= 5 ? 'Ready' : 'Building', 'Manual draw is live once Foam reaches 5.'),
          createMetric('Deepwake', deepwake, 'Eternal-only overlay pool. Deepwake Surge effects amplify Undertow conversion and Foam gain.'),
        ],
        nextSteps: [
          createStep('Stock Undertow 6+', undertow >= 6, undertow >= 6
            ? 'Undertow is loaded. Your next release window should hit hard.'
            : 'Lead with setup cards before committing the heavy release pieces.'),
          createStep('Bank Foam 5+', foam >= 5, foam >= 5
            ? 'Foam draw is online. Click the HUD button when you need card flow.'
            : 'Let release lines and support cards skim enough Foam for the manual draw.'),
          createStep('Bank Deepwake for surge windows', deepwake >= 2, deepwake >= 2
            ? 'Deepwake is loaded for an Eternal surge turn.'
            : 'Use Eternal setup cards to bank Deepwake before firing your surge finisher.'),
        ],
      };
    }
    case 'abyssalForge': {
      const forges = turn.eternalStacks?.forge ?? 0;
      const charges = turn.reforgeCharges ?? 0;
      const cap = turn.reforgeChargeCap ?? 0;
      const events = turn.forgeRecastEventsThisTurn ?? 0;
      const imprint = (turn.recastLedger ?? []).reduce((sum, entry) => sum + Math.max(0, entry.imprintStacks ?? 0), 0);
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Imprint ${imprint} | Charges ${charges}${cap ? `/${cap}` : ''} | Crowns ${forges}`,
        detail: `Recast events this turn: ${events}`,
        tagline: 'Abyssal Forge: build recast pressure in the base loop, then route Eternal and Infinite turns through Imprint spend windows.',
        summary: 'Abyssal Forge base cards still run on Reforge Charges and recasts. Eternal and Infinite Abyssal cards now share one streamlined overlay, Imprint: mark played cards, then spend Imprint on targeted recast spikes or direct Oblivion bursts.',
        metrics: [
          createMetric('Imprint', imprint, 'Eternal and Infinite Abyssal overlay. Built on ledger entries and consumed by Imprint spend effects.'),
          createMetric('Forge Crowns', forges, 'Banked Crowns ready to spend on the final cashout.'),
          createMetric('Reforge Charges', charges, 'Charges spent by recast and Nacre effects.'),
          createMetric('Recast Events', events, 'Total recast events fired this turn.'),
        ],
        nextSteps: [
          createStep('Prime Imprint', imprint >= 3, imprint >= 3 ? 'Imprint is online for an Eternal spend effect.' : 'Use Eternal Abyssal cards to imprint played cards before spending.'),
          createStep('Bank Forge Crowns', forges >= 2, forges >= 2 ? 'Crowns are ready for cashout.' : 'Build Forge Crowns before firing Infinite cashout lines.'),
          createStep('Stock Charges', charges >= 1, charges >= 1 ? 'Recasts are available.' : 'Build Reforge Charges to enable recasts.'),
          createStep('Trigger recasts', events >= 1, events >= 1 ? 'Recast sequence is live.' : 'Spend charges to start the recast sequence.'),
        ],
      };
    }
    case 'deathFlamedHell': {
      const embers = turn.eternalStacks?.pyre ?? 0;
      const crowns = turn.secondaryCounters?.pyre ?? 0;
      const veilMarks = turn.dfhVeilMarks ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Pyre Embers ${embers} | Cinder Crowns ${crowns} | Veil Marks ${veilMarks}`,
        detail: 'Bank Embers and Crowns, then route Veil Marks into immediate cashouts or attack-linked spend turns.',
        tagline: 'Death-flamed Hell: base pressure through Pyre and Crowns, capped by Veil Mark conversions.',
        summary: 'Death-flamed Hell plays through two base resources (Pyre Embers and Cinder Crowns), then layers Veil Marks from higher-rarity cards into direct cashouts and attack-bonus burst windows.',
        metrics: [
          createMetric('Pyre Embers', embers, 'Primary fuel built by base Death-flamed Hell plays. Use it to keep the procession moving.'),
          createMetric('Cinder Crowns', crowns, 'Reveal-side pressure built by ritual setbacks and ritual payoffs. Spend it when the turn is ready to burst.'),
          createMetric('Veil Marks', veilMarks, 'Eternal/Infinite overlay. Spend marks through DFH cashout effects or mark-fueled attack riders.'),
        ],
        nextSteps: [
          createStep('Flip a base card', embers >= 1, embers >= 1 ? 'A base card is ready to reveal.' : 'Play a base Death-flamed Hell card, then flip it from the hand.'),
          createStep('Bank Embers', embers >= 5, embers >= 5 ? 'The pyre has enough pressure to matter.' : 'Keep building Pyre Embers before you reveal the line.'),
          createStep('Prime Veil Marks', veilMarks >= 6, veilMarks >= 6 ? 'Veil Marks are loaded for a high-value spend turn.' : 'Play an Eternal or Infinite Death-flamed Hell card to charge Veil Marks.'),
        ],
      };
    }
    case 'wishedUponAStar': {
      const starlight = turn.starlightCharges ?? 0;
      const dream = turn.dreamLattice ?? 0;
      const starCrowns = turn.eternalStacks?.wuas ?? 0;
      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: `Starlight ${starlight} | Dream Lattice ${dream} | Star Crowns ${starCrowns}`,
        detail: 'Stock Starlight and Dream Lattice, then fire one of the three star cashouts.',
        tagline: 'Wished Upon a Star: Starlight, Dream Lattice, and Star Crowns feed three layered cashouts.',
        summary: 'Wished Upon a Star stockpiles Starlight Charges and Dream Lattice over multiple turns, then converts them through Nova Wish Burst, Constellation Lock, or Infinite Starbirth.',
        metrics: [
          createMetric('Starlight Charges', starlight, 'Primary cashout fuel. Drives Nova Wish Burst (Oblivion = Starlight × Dream multiplier) and Infinite Starbirth (Oblivion = Seraphim × Starlight).'),
          createMetric('Dream Lattice', dream, 'Secondary amplifier. Scales Nova Wish Burst and grants draw on Starbirth. Decays each turn unless preserved by Solarvex Ward.'),
          createMetric('Star Crowns', starCrowns, 'Eternal-tier stack earned by Wishwright cards. Spent by Constellation Lock Release for Oblivion per Crown consumed.'),
        ],
        nextSteps: [
          createStep('Build Starlight', starlight >= 6, starlight >= 6 ? `${starlight} Starlight Charges banked — cashout payloads are meaningful.` : 'Play Starlight-generating cards to build the primary cashout pool.'),
          createStep('Stack Dream Lattice', dream >= 4, dream >= 4 ? `Dream Lattice at ${dream} — Nova Wish Burst and Starbirth are both amplified.` : 'Stack Dream Lattice with Cherubim and Ophanim to deepen cashout multipliers.'),
          createStep('Earn Star Crowns', starCrowns >= 3, starCrowns >= 3 ? `${starCrowns} Star Crowns ready for Constellation Lock Release.` : 'Play Eternal WUAS cards to earn Star Crowns for the Constellation cashout.'),
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

const RAW_SET_ENGINE_GUIDES: Record<EngineKey, EngineGuide> = {
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
        body: 'Neutrality Cherubim have one job: grant extra Patience to the Seraphim directly in front of them, every card you play.\n\n• Common Cherubim: +1 extra Patience per card (adjacent Seraphim gain +2 total instead of +1).\n• Rare Cherubim: +2 extra Patience per card (+3 total per card played).\n• Epic Cherubim: +3 extra Patience per card (+4 total per card played).\n\nA Seraphim sitting adjacent to an Epic Cherubim with a 6-card cooldown has 24 Patience before it fires  Ethat is +360 Oblivion added to the attack before any multipliers.\n\nPlace Cherubim next to your highest-rarity Seraphim first to maximise their amplification window.',
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
    intro: 'Heavenly Light runs on two core pieces and one advanced layer: Cadence and Radiance are the base engine, while Halo is the Eternity/Infinity stock-and-spend layer.',
    sections: [
      {
        heading: 'Card Types',
        body: 'Every Heavenly Light card has a job. Seraphim build and cash in power, Cherubim protect the sequence, Ophanim generate or spend Radiance, and Angels create bigger payoff turns.',
      },
      {
        heading: 'Cadence',
        body: 'Cadence is your choir meter. Playing a different note type adds 1 Cadence, and Multiplier-class cards add 2. Repeating the same note normally drops Cadence and resets the sequence, so keep the line varied if you want your Seraphim attacks to stay strong.',
      },
      {
        heading: 'Radiance',
        body: 'Radiance is your fuel. You gain it from Light cards, spend it on stronger plays, and use it to turn a built-up hand into bigger payoff turns.',
      },
      {
        heading: 'Halo (Eternity/Infinity Layer)',
        body: 'Halo is not required for the base Light loop, but Eternity and Infinity Light cards convert it into major burst. Build Halo on setup turns, then spend or cash it out only when your Cadence and Radiance state is already strong.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'Infinite Light cards are not the core loop. They simply reward you for already building a good one. If Cadence is 3 or higher and you have played at least 3 different note types, Infinite Light cards get their boosted multiplier. If either condition is lower, they stay reduced.',
      },
    ],
  },

  thornbound: {
    engineKey: 'thornbound',
    title: 'User Guide to: Thornbound',
    intro: 'Thornbound is a manual conversion engine with an Eternal amplifier. Play Thornbound cards to build Trail, convert Trail into Scar one point at a time from the HUD, and use Eternal Briar Spiral cards to amplify payoff turns.',
    sections: [
      {
        heading: 'Trail',
        body: 'Trail is the setup resource. Every Thornbound play adds Trail (Setup/Refund cards add more). You do not spend Trail automatically in the core loop. You choose when to convert it.',
      },
      {
        heading: 'Scar',
        body: 'Scar is built manually. Use the Trail orb button to convert 1 Trail into 1 Scar. This makes Scar growth visible and intentional instead of automatic.',
      },
      {
        heading: 'Thresholds',
        body: 'Most base Thornbound bonuses now check Scar thresholds instead of waiting for end-turn math.\n\nCommon breakpoints are:\n- Scar 2: first bonus layer\n- Scar 4: stronger mid-turn payoff\n- Scar 6: top base-set rider\n\nThreshold checks are usually non-consuming, so once you reach a level, multiple cards can benefit from it.',
      },
      {
        heading: 'Briar Spiral (Eternal Layer)',
        body: 'Briar Spiral is an Eternal-only Thornbound amplifier shown on the HUD next to Trail and Scar. Generator cards seed Spirals, converter cards turn Trail banks into more Spirals, amplifier cards bloom a controlled number of Spirals, and finisher cards bloom all Spirals in one burst window.',
      },
      {
        heading: 'No Base End-Turn Burst',
        body: 'The base Thornbound loop no longer includes an automatic end-turn Scar payout. Your value comes from in-turn threshold effects and better sequencing around when you convert Trail to Scar.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'The base loop works without Infinite cards. Infinite Thornbound splits into distinct Briar Spiral amplifier jobs: Gravebloom Singularity is the back-row Spiral forge, Thornbound Last Procession is the Spiral refinery, Thorn Widow Engine is the precision two-spiral surge, and Thornbound Elegy Titan is the catastrophic all-in bloom finisher.',
      },
    ],
  },

  mechanical: {
    engineKey: 'mechanical',
    title: 'User Guide to: Mechanical Dreams',
    intro: 'Mechanical Dreams is a Clock-Chime engine. Every Mechanical card play advances the Clock. Every 3 ticks, a Chime fires: it deals burst damage, spends Strain, and primes your next Mechanical attack.',
    sections: [
      {
        heading: 'Clock Ticks',
        body: 'Each Mechanical card play advances Clock ticks immediately. Ophanim and Angel plays still accelerate tempo by giving 2 ticks; other Mechanical plays give 1 tick.\n\nYou are no longer managing instruction classes. You are managing tick timing.',
      },
      {
        heading: 'Chime Rule',
        body: 'At fixed intervals (every 3 ticks by default), the Clock emits a Chime. A Chime does three things at once:\n\n- bursts immediate Oblivion\n- spends a chunk of Strain\n- primes your next Mechanical attack\n\nIf Chime occurs on a non-attack play, the prime is stored for later (max 1 stored).',
      },
      {
        heading: 'Strain Management',
        body: 'Strain is still your fuel. Build it before Chime turns, then cash Chime windows when your best attacks are available.\n\nToo little Strain gives weak Chimes; uncontrolled Strain causes wasted tempo. The set\'s core loop is build -> chime -> spend -> rebuild.',
      },
      {
        heading: 'Stored Chime Cap',
        body: 'Only one Chime prime can be stored at once. If another Chime occurs while one is already primed, you still get the burst, but prime storage does not stack beyond 1.',
      },
      {
        heading: 'Eternity Extension: Reactor Core',
        body: 'Mechanical Eternity cards now use one extension layer only: Reactor Core. Every Chime also grants Reactor Core progress, and Eternity cards convert Reactor Cores into burst payoffs through simple spend/cashout checkpoints.\n\nYou no longer need a separate secondary subsystem to understand or pilot Mechanical Eternity turns.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'The Clock-Chime loop works fully without Infinite cards. Base Mechanical power comes from timing Chimes and spending primes on the right attacks.\n\nMechanical Infinite cards stay on the same Reactor Core extension as Eternity cards, but with larger Core thresholds and heavier two-stage burst lines. They are stronger finishers, not a separate subsystem.',
      },
    ],
  },

  prismatic: {
    engineKey: 'prismatic',
    title: 'User Guide to: Prismatic',
    intro: 'Prismatic is a channel-switching engine. Base cards build Refraction Depth, and higher-rarity cards use Resonance Charge as the shared payoff layer.',
    sections: [
      {
        heading: 'Color Channels',
        body: 'Every Prismatic card is assigned to one of six color channels based on its name:\n\n• Amber  Ecards with "gold", "sun", or "aurel" in their name.\n• Azure  Ecards with "sky", "storm", "aurora", or "ice" in their name.\n• Crimson  Ecards with "rose", "ember", or "flame" in their name.\n• Emerald  Ecards with "plain", "root", "grove", or "verd" in their name.\n• Violet  Ecards with "mirror", "veil", "refraction", or "spectrum" in their name.\n• White  EEternal-rarity and Infinite-rarity cards, and Angel-type cards that do not match any other pattern.\n\nCards that do not match any keyword fall back: Cherubim ↁEEmerald, Ophanim ↁEViolet, everything else ↁEAmber.',
      },
      {
        heading: 'Refraction Depth',
        body: 'Refraction Depth accumulates when you switch channels between consecutive plays (max 9). Every channel switch grants +1 Refraction Depth; a Multiplier-class card on a channel switch grants +2.\n\nEvery channel switch increases your attack power. If you stay on the same channel, you do not gain Refraction Depth.',
      },
      {
        heading: 'Higher-Rarity Resonance',
        body: 'Prismatic Eternity and Infinite cards use one overlay resource only: Resonance Charge. Resonance Charge is built by explicit card effects and spent by explicit spend checkpoints.\n\nThe base loop stays channel switching plus Refraction Depth, while higher-rarity cards layer Resonance spending on top.',
      },
      {
        heading: 'Resonance Overlay (Eternity + Infinity)',
        body: 'Prismatic Eternity and Infinite cards use one overlay resource only: Resonance Charge. Resonance Charge is built by explicit card effects and spent by explicit spend checkpoints.\n\nBase channel-switch events do not generate Resonance Charge; they only deepen Refraction. The higher-rarity layer is where Resonance lives.',
      },
      {
        heading: 'Infinite Extension: Resonance Finishers',
        body: 'The base spectrum loop works fully without Infinite cards: switching channels grows Refraction Depth, and higher-rarity payoffs convert that setup into burst value.\n\nPrismatic Infinite cards stay on the same Resonance system as Eternity cards, but at higher spend thresholds with stronger riders:\n\n- Axiom Rain: deep deck filter plus Resonance cashout.\n- Choir Splinter: turn-wide score scaling with Resonance spend.\n- Collapse Lattice: back-row support that banks then spends Resonance.\n- Judgement Array: Angel finisher with large Resonance gate and search support.\n\nChannel spread and refraction depth still matter because several Infinite riders check distinct channels and depth before awarding full value.',
      },
    ],
  },

  blackGlass: {
    engineKey: 'blackGlass',
    title: 'User Guide to: Black Glass Inferno',
    intro: 'Black Glass Inferno is a two-meter alternation engine. White Flame and Black Flame are built directly by card effects. Keeping them close and alternating sides improves your payoff turns.',
    sections: [
      {
        heading: 'Two Flame Meters',
        body: 'The base set only tracks two meters:\n\n• White Flame (max 30)\n• Black Flame (max 30)\n\nCards explicitly say when they add White Flame or Black Flame. There is no class-based setup/refund/conversion keyword system for this engine.',
      },
      {
        heading: 'Rhythm (Alternation Meter)',
        body: 'Fracture rises as Black Glass cards build tension between your two flame lanes. It is one of the primary scalars for Black Glass burst turns, especially once Eternal/Infinite Eclipse converters are online.\n\nIn practice, sequence your Fracture builders before you commit your largest burst card.',
      },
      {
        heading: 'Balance Window',
        body: 'Your Black Glass scaling is strongest when the two meters stay close. The engine reads the flame gap (|White - Black|):\n\n• Gap 0-1: strongest payoff scaling\n• Gap 2-3: stable scaling\n• Gap 4+: reduced scaling\n\nIn practice, feed the weaker meter before you fire your biggest payoff cards.',
      },
      {
        heading: 'Base-Set Simplicity Rules',
        body: 'The base Black Glass implementation intentionally avoids layered subsystems:\n\n• No class-driven flame growth logic\n• No Collapse Pending planning loop in base play\n• No Grief Oath setup loop in base play\n\nThe base identity is just: build two meters, alternate sides, stay balanced, cash out.',
      },
      {
        heading: 'Eternity Extension: Eclipse',
        body: 'Black Glass Eternity now adds one extension only: Eclipse. Eternal cards generate Eclipse, then spend or burst Eclipse for payoff. Eclipse burst strength scales with the same base engine you already pilot: tighter flame balance and stronger rhythm/fracture states produce better results.\n\nThere is no separate Veil Shard sub-loop in the Eternal layer.',
      },
      {
        heading: 'Infinite Extension: Eclipse Detonations',
        body: 'Infinite Black Glass cards stay on the same Eclipse extension as Eternal cards; they do not introduce a second ancillary loop.\n\nTheir role split is: larger Eclipse generation, stricter spend thresholds, and heavier burst riders tied to flame balance and Fracture depth.\n\nPilot rule: stock Eclipse first, then spend it in a prepared window where both flame balance and Fracture are already strong.',
      },
    ],
  },

  snowbound: {
    engineKey: 'snowbound',
    title: 'User Guide to: Snowbound Voltage',
    intro: 'Snowbound Voltage is a two-stance battery engine. Every base Snowbound card is explicitly marked Frost or Voltage. Frost cards build Arctic Charge; Voltage cards spend that shared battery for burst Oblivion. Eternity cards add one overlay resource: Polar Capacitors.',
    sections: [
      {
        heading: 'Frost and Voltage Phases',
        body: 'Base Snowbound cards no longer infer phase from card class. They state their phase directly:\n\n• Frost  Ebuilder cards that add Arctic Charge and stabilize the turn.\n• Voltage  Epayoff cards that convert banked Arctic Charge into burst output.\n\nThe current phase is simply the last Snowbound stance you committed to.',
      },
      {
        heading: 'Frost Cards',
        body: 'Frost cards are your setup side. They bank Arctic Charge and usually give supportive resources like draw, Radiance, or Strain on top.\n\nIf you want a stronger Voltage turn later, your job is simple: spend early actions on Frost cards first.',
      },
      {
        heading: 'Voltage Cards',
        body: 'Voltage cards are your spender side. When you enter Voltage with a real Arctic Charge bank, those cards cash that battery into a larger Oblivion burst.\n\nVoltage is not where you set up. It is where you collect.',
      },
      {
        heading: 'Arctic Charge',
        body: 'Arctic Charge is the only core Snowbound resource you need to track.\n\n• Frost grows Arctic Charge.\n• Voltage spends Arctic Charge.\n• The bigger the charge bank, the bigger your discharge turns.\n\nThis means Snowbound sequencing is readable from the card itself: build first, release second.',
      },
      {
        heading: 'Eternity Overlay: Polar Capacitors',
        body: 'Snowbound Eternity cards use a single overlay resource: Polar Capacitors. Capacitors are explicitly granted by card effects and explicitly spent by release effects.\n\nRelease behavior is phase-locked:\n\n• In Voltage, each released capacitor converts into bonus Oblivion.\n• In Frost, each released capacitor converts into extra Arctic Charge.\n\nSo the base loop stays Frost/Voltage battery play, while Eternity adds one simple bank-and-release layer on top.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'The battery engine works fully without Infinite cards  EFrost still builds charge and Voltage still spends it. None of that requires rarity support.\n\nSnowbound Infinite cards keep the same Polar Capacitor system as Eternity cards, but with stronger release coefficients and stricter role splits (precision release, full-bank detonation, and high-capacity reservoir lines).\n\nIf your deck includes Infinite Snowbound Voltage cards, they still care about one clean battery state:\n\n• ÁE.21 multiplier (amplified): you are in Voltage and Arctic Charge ≥ 12.\n• ÁE.44 multiplier (reduced): either condition is below threshold.\n\nThe Infinite bonus rewards a properly stocked discharge turn instead of a hidden class puzzle.',
      },
    ],
  },

  glassAbsolute: {
    engineKey: 'glassAbsolute',
    title: 'User Guide to: Glass Absolute',
    intro: 'Glass Absolute is now a fragments-first engine in base play. You build board presence with Glass cards, and each base Glass card scales directly from your current fragment count with clean formation tiers.',
    sections: [
      {
        heading: 'Base Loop: Fragments and Formation Tiers',
        body: 'Base Glass uses one primary number: Fragments (how many Glass Absolute cards are currently on board).\n\nEvery base Glass card play grants a fragments-scaled payout, then checks a formation tier bonus:\n\n• Tier 1 at 3+ fragments\n• Tier 2 at 5+ fragments\n• Tier 3 at 7+ fragments\n\nThat is the core identity for base cards: fill the board with fragments, then cash dense formation turns.',
      },
      {
        heading: 'Advanced Overlay (Eternal/Infinite Only)',
        body: 'Glass higher-rarity play uses one ancillary mechanic: Refraction Charge. Eternal cards build and spend this resource to amplify fragment-tier windows, and Infinite cards use the same charge pool at stronger thresholds with queue/floor/ledger riders.\n\nIf you are learning base Glass first, focus on fragments + formation tiers, then layer Refraction Charge once that base loop is stable.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'Base Glass is fully functional without Infinite cards. Infinite Glass cards stay on Refraction Charge, but convert it at higher thresholds and with stronger riders:\n\n• Full-fire ready: Refraction Charge ≥ 8, Fragments ≥ 5, and either Wave Queue ≥ 2 or White Ledger active.\n• Reduced-fire: if those conditions are not met, Infinite lines still pay out, but at a lower multiplier.\n\nThis keeps Infinite power tied to a prepared charge-and-formation window while preserving one shared mechanic across rarities.',
      },
    ],
  },

  pyro: {
    engineKey: 'pyro',
    title: 'User Guide to: Pyroabyss',
    intro: 'Pyroabyss now uses a role-split Heat loop: stoke cards build Heat, tutor cards line up payoffs, threshold cards reward timing, and burst cards convert the bank.',
    sections: [
      {
        heading: 'Core Loop: Heat',
        body: 'Base Pyro cards use one core resource: Heat.\n\n• Stoke cards add Heat and maintain hand flow.\n• Tutor cards fetch Seraphim/Cherubim pieces for planned turns.\n• Threshold cards reward crossing Heat bands with extra value.\n• Burst cards convert stocked Heat into direct Oblivion.\n\nFire Seraphim and Angel attacks scale at +2.5% per Heat (up to +75%).',
      },
      {
        heading: 'Higher-Rarity Overlay: Inferno + Chroma',
        body: 'Eternal, Infinite, and Transcendent Fire cards add two overlay lanes on top of base Heat:\n\n• Inferno stack interactions for threshold and conversion turns.\n• Chroma Ember generation and ignition for high-rarity burst spikes.\n\nThese overlays amplify the same turn planning instead of replacing the base Heat engine.',
      },
      {
        heading: 'Infinite Fire Roles',
        body: '• Ash Kings\' Apocalypse: the catastrophic seeder. It loads Heat and Chroma Embers, then ignites a large burst while preserving some setup for follow-up.\n\n• Pyraxis Colossus: the threshold transmuter. It converts high Heat into Chroma Ember momentum, then spends that burst in a compressed payoff.\n\n• Pyroclasm Engine: the reserve accumulator. It banks Chroma Embers quickly, then trades a small ember slice for side value while keeping momentum online.\n\n• Riftborn Sovereign: the apex finisher. It cashes major Heat, detonates Chroma Ember ignition at capstone thresholds, and tutors the next closer.',
      },
      {
        heading: 'Heat Bands',
        body: 'Heat bands mark your base Pyro windows:\n\n- Heat 1-4: setup\n- Heat 5-9: stable burst\n- Heat 10-14: major burst\n- Heat 15+: capstone window',
      },
      {
        heading: 'Pilot Rule',
        body: 'Base play: build Heat first, then burst it in one clean window. Higher-rarity play: keep the same Heat timing, then layer Inferno and Chroma right before your apex card.',
      },
    ],
  },

  blazingGarden: {
    engineKey: 'blazingGarden',
    title: 'User Guide to: Blazing Garden',
    intro: 'Blazing Garden is a persistence and lineage engine. Cards stay on board through Burn, then char into Ember Grove for Echo recursion. Eternal cards now generate Wild Pollen, and seeded payoff cards spend that bank into amplified Oblivion and score windows.',
    sections: [
      {
        heading: 'Board Persistence and Burn Phase',
        body: 'Unlike most cards, Blazing Garden cards do not leave the board at end turn. They enter Burn and remain active for two more turns before charring out.\n\nBurn-phase density is the engine baseline. Keep multiple Burn units alive so your Grove and seed turns stay online.',
      },
      {
        heading: 'Ember Grove and Echo',
        body: 'When Burning Garden cards char, they move into Ember Grove instead of disappearing. Ember Grove acts as a seed bank you can pull from to revive Echo cards.\n\nEcho turns are your stabilizer: they recover board pressure after char events and keep lineage rhythm alive without needing a full hand rebuild.',
      },
      {
        heading: 'Lineages',
        body: 'Every Blazing Garden card belongs to a lineage (Rose, Sunflower, or Thistle) based on its definition. The engine tracks which distinct lineages you have played across the turn (in a rolling window of 8 plays).\n\nHaving multiple distinct lineages active benefits the engine: all three lineages being present maximises the Final Chord Bloom payoff when Infinite cards fire.',
      },
      {
        heading: 'Eternal Wild Pollen Generation',
        body: 'Wild Pollen generation is centered on Eternal Blazing Garden cards. Sequence these Eternal generators before your seed spenders so payoff cards have real fuel.\n\nInfinite cards can still spend Wild Pollen, but they do not generate it in the current model.',
      },
      {
        heading: 'Seeded Amplification Windows',
        body: 'Seed effects convert Wild Pollen into direct Oblivion and score amplification. Their value spikes when Burn uptime, lineage coverage, and pollen bank are all ready at once.\n\nIn practice: build Burn board first, branch lineages, generate pollen with Eternal cards, then cash one focused seeded burst window.',
      },
    ],
  },
  butterfly: {
    engineKey: 'butterfly',
    title: 'User Guide to: Age of the Butterfly',
    intro: 'Age of the Butterfly runs a Flutter + Formation cycle. Butterfly plays steadily charge Spectrum toward 4/8/12 thresholds, while first-time unit-type plays complete Formation for a cleaner payoff turn before Descent resets the loop.',
    sections: [
      {
        heading: 'Formation Cycle',
        body: 'Each cycle tracks four Butterfly unit types: Seraphim, Cherubim, Ophanim, and Angel. The first time each type is played in the cycle, Formation increases by 1 (max 4). Replaying the same type does not increase Formation again until the next cycle.',
      },
      {
        heading: 'Flutter Thresholds',
        body: `The engine has natural breakpoints as Spectrum grows:

• 4 Spectrum: minor pulse value.
• 8 Spectrum: major pulse value and stronger burst pressure.
• 12 Spectrum: descent-style payoff trigger and reset.

      Because thresholds are shared, setup pieces and payoffs both advance the same meter. Ophanim lines accelerate this climb, and higher-rarity Butterfly cards can convert Wing Resonance into stronger threshold turns.`,
      },
      {
        heading: 'Advanced Overlay (Eternal/Infinite)',
        body: 'Butterfly Eternity and Infinite cards add Wing Resonance. Wing Resonance is a separate higher-rarity bank that scales from the exact base engine state you have already built: current Spectrum, current Formation, or both.\n\nIn practice, this means high-rarity cards do not ask you to learn a second base loop. You still build Flutter and complete Formation first, then spend Resonance to sharpen the payoff turn.',
      },
      {
        heading: 'Descent Reset',
        body: 'At 12 Spectrum, Descent fires and the Butterfly cycle resets: Spectrum returns to 0, Flutter tier resets, and Formation tracking is cleared for the next build. Plan your strongest release and attack windows right before this reset point.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: `The Flutter Spectrum engine is fully functional without Infinite cards. Both Butterfly Eternity and Butterfly Infinite cards now spend Wing Resonance, with Infinite cards converting it at higher rates and heavier riders.

      Even at Infinite rarity, the set still checks whether you have actually built the engine:

• ÁE.23 multiplier (amplified): Spectrum ≥ 8 and Flutter Tier ≥ 2.
• ÁE.46 multiplier (reduced): otherwise.

      This keeps Infinite payoffs tied to real setup quality instead of standalone power.`,
      },
    ],
  },
  eternalSeas: {
    engineKey: 'eternalSeas',
    title: 'User Guide to: Eternal Seas',
    intro: 'Eternal Seas now runs a base Undertow loop with a light Foam support layer. Build Undertow during the turn, release it for burst, and click 5 Foam into 1 draw when you need to keep the engine moving.',
    sections: [
      {
        heading: 'Undertow',
        body: 'Undertow is the base Eternal Seas setup pool. Most base cards add Undertow, and your payoff cards release it for direct Oblivion. It is a same-turn resource: you are rewarded for building and spending it in one flowing line, not for banking it across turns.',
      },
      {
        heading: 'Foam',
        body: 'Foam is the light support layer. Some base cards and most Undertow release cards skim Foam while you play. Once you reach 5 Foam, the HUD lets you spend it manually to draw 1 card. Foam is there to smooth the turn, not to become the main engine.',
      },
      {
        heading: 'Eternal Overlay: Deepwake',
        body: 'Eternal Seas Eternal cards now use one overlay keyword only: Deepwake. Eternal setup cards bank Deepwake, and Eternal surge cards spend it to amplify Undertow release windows and Foam skim. This keeps Eternal play attached to the same Undertow/Foam loop instead of adding a second lane system.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: `Infinite Eternal Seas now stays on Deepwake too, but each Infinite card has a unique job:

      • Water That Was Always There: pure Deepwake reservoir.
      • Veilmargin Cathedral: micro-surge support with high per-Deepwake efficiency.
      • Veleth Itself: pressure hybrid that banks and spends only part of the pool.
      • Aeveleth, Undying Revision: recursive loop spender that re-seeds Deepwake.
      • Seven Crowned Confluence: catastrophic all-in Deepwake finisher.

            This keeps Infinite power tied to one shared mechanic while still giving each card a distinct tactical role.`,
      },
    ],
  },
  abyssalForge: {
    engineKey: 'abyssalForge',
    title: 'User Guide to: Abyssal Forge',
    intro: 'Abyssal Forge runs a two-layer loop. Base cards still build Reforge Charges and recast pressure, while Eternal and Infinite cards now share one streamlined overlay: Imprint.',
    sections: [
      {
        heading: 'Reforge Charges',
        body: 'Reforge Charges are the fuel for recast effects. Build them through normal play, then spend them to make earlier cards trigger again at reduced or full power.',
      },
      {
        heading: 'Eternal and Infinite Overlay: Imprint',
        body: 'Abyssal higher-rarity cards no longer split across multiple side mechanics. They now use one overlay only: Imprint. Imprint is stored on played-card ledger entries, then spent by specific Eternal and Infinite effects for either stronger recasts or direct burst conversion.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'Higher-rarity Abyssal Forge lines still reward prepared turns, but now with cleaner role split: Eternal cards handle precision Imprint spends while Infinite cards specialize into high-volume random storms, deep-history recasts, split spend bridges, and apex all-in conversions.',
      },
    ],
  },
  deathFlamedHell: {
    engineKey: 'deathFlamedHell',
    title: 'User Guide to: Death-flamed Hell',
    intro: 'Death-flamed Hell runs the Funeral Procession Engine. Base cards flip between veiled and revealed faces, and Eternal plus Infinite cards now add one streamlined overlay: Veil Marks that are consumed when a base card is revealed.',
    sections: [
      {
        heading: 'Base Card Flip',
        body: 'The base set is built to be flipped. Play a card, then use the back face to veil the setup or reveal it when you are ready to cash in the line. The back face is a planning state, not a separate card type.',
      },
      {
        heading: 'Veil Rite Overlay',
        body: 'Eternal and Infinite Death-flamed Hell cards all contribute the same overlay resource: Veil Marks. Marks are not manually spent; they are consumed automatically the next time a base Death-flamed Hell card is revealed.',
      },
      {
        heading: 'Pyre Embers',
        body: 'Pyre Embers are the set\'s primary fuel. Every base Death-flamed Hell play adds Ember pressure, and the highest-value turns are the ones where you keep that Ember count climbing while the cards stay veiled.',
      },
      {
        heading: 'Cinder Crowns',
        body: 'Cinder Crowns are still the reveal-side resource. They come from the same sacrificial pressure as before, but now they matter most when you time the flip to line them up with a clean burst window.',
      },
      {
        heading: 'Infinite Card Amplification',
        body: 'Infinite Death-flamed Hell cards still reward a fully stoked pyre and a Crown-loaded treasury. The base flip loop feeds those higher-rarity finishers instead of competing with them.',
      },
    ],
  },
  wishedUponAStar: {
    engineKey: 'wishedUponAStar',
    title: 'User Guide to: Wished Upon a Star',
    intro: 'Wished Upon a Star runs the Stellar Wish Engine. You stockpile Starlight Charges and Dream Lattice over multiple turns, earn Star Crowns from Eternal cards, then cash out through three layered payoffs: Nova Wish Burst, Constellation Lock Release, and Infinite Starbirth.',
    sections: [
      {
        heading: 'Starlight Charges',
        body: 'Starlight Charges are the primary cashout fuel. They accumulate from Ophanim, Cherubim, and Seraphim plays and persist across turns. Two cashouts scale directly with Starlight: Nova Wish Burst (Oblivion = Starlight × Dream multiplier) and Infinite Starbirth (Oblivion = Seraphim on board × Starlight × per-Seraphim value).',
      },
      {
        heading: 'Dream Lattice',
        body: 'Dream Lattice is the secondary amplifier. It deepens Nova Wish Burst and grants bonus draw on Starbirth. By default, Dream Lattice decays at the end of each turn — Solarvex Ward Cherubim prevents this decay, letting it accumulate into a much larger multiplier over many turns.',
      },
      {
        heading: 'Star Crowns and Constellation Lock',
        body: 'Star Crowns are the Eternal-tier stack for this set. They are earned by playing Wishwright Eternal cards and spent by Constellation Lock Release for a burst of Oblivion per Crown consumed. The more Crowns banked before the cashout, the larger the finale.',
      },
    ],
  },
};

export const SET_ENGINE_GUIDES: Record<EngineKey, EngineGuide> = Object.fromEntries(
  Object.entries(RAW_SET_ENGINE_GUIDES).map(([key, guide]) => [
    key,
    {
      ...guide,
      title: sanitizeEngineText(guide.title),
      intro: sanitizeEngineText(guide.intro),
      sections: guide.sections.map(section => ({
        heading: sanitizeEngineText(section.heading),
        body: sanitizeEngineText(section.body),
      })),
    } satisfies EngineGuide,
  ]),
) as Record<EngineKey, EngineGuide>;

// ─── End User Guides ─────────────────────────────────────────────────────────

export function getSetEngineSnapshotForCard(
  def: CardDefinition,
  turn: TurnState,
  board?: BoardState,
): SetEngineSnapshot | null {
  const key = getEngineKeyForCard(def);
  return key ? sanitizeSnapshot(buildEngineSnapshot(key, turn, board)) : null;
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
    .map(key => sanitizeSnapshot(buildEngineSnapshot(key, turn, board)));
}