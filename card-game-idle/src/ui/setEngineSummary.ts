import { SET_ACCENT } from '@/data/elements';
import type { CardDefinition } from '@/types/cards';
import type { BoardState, TurnState } from '@/types/game';

export type EngineKey =
  | 'neutrality';

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
];
const ENGINE_META: Record<EngineKey, { label: string; accent: string }> = {
  neutrality: { label: 'Neutrality', accent: SET_ACCENT },
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
};

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
    if (def.baseStats.bonusType === 'resource_generation') return 'resource';
    if (hasTextSnippet(def, ['sequence'])) return 'setup';
    if (def.baseStats.bonusType === 'power_amplifier' || def.baseStats.bonusType === 'score_per_second') return 'amplifier';
    return 'payoff';
  }

  if (def.type === 'Cherubim') {
    if (hasSomeEffect(def, ['cherubim_resource_per_card', 'cherubim_draw_per_card'])) return 'resource';
    if (hasSomeEffect(def, ['cherubim_adjacent_seraphim_bonus', 'cherubim_seraphim_amp', 'cherubim_attack_buff'])) return 'amplifier';
    if (hasSomeEffect(def, ['draw', 'search_deck_by_type', 'look_top_take', 'look_top_take_drop', 'salvage_any', 'salvage_by_type'])) return 'setup';
    return 'support';
  }

  if (hasSomeEffect(def, ['draw', 'search_deck_by_type', 'look_top_take', 'look_top_take_drop', 'look_top_take_type', 'salvage_any', 'salvage_by_type', 'shuffle_discard', 'copy_last_hr'])) {
    return 'setup';
  }

  if (hasSomeEffect(def, ['patience_gain_all', 'patience_double_all'])) {
    return 'resource';
  }

  if (hasSomeEffect(def, ['score_flat', 'score_multiplier', 'oblivion_flat', 'butterfly_release', 'seas_undertow_release'])) {
    return 'payoff';
  }

  return 'setup';
}

function getCardRoleDetail(def: CardDefinition): string {
  if (hasSomeEffect(def, ['radiance_gain', 'pyro_heat_gain', 'trail_gain', 'strain_gain', 'prismatic_light_gain', 'resonance_charge_gain', 'resonance_charge_spend', 'monochromatic_shards_gain', 'arctic_charge_gain', 'bloom_gain', 'butterfly_spectrum_gain', 'seas_undertow_gain', 'seas_foam_gain', 'radiance_double'])) {
    return 'It stocks the resources this engine spends to stay online.';
  }

  if (def.type === 'Cherubim' || hasSomeEffect(def, ['cherubim_adjacent_seraphim_bonus', 'cherubim_seraphim_amp', 'cherubim_attack_buff'])) {
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

export function getEngineKeyForCard(_def: CardDefinition): EngineKey | null {
  return 'neutrality';
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
    default:
      return { key, label: meta.label, accent: meta.accent, compact: '', detail: '', tagline: '', summary: '', metrics: [], nextSteps: [] };
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
    title: 'Neutrality: Patience Engine',
    intro: 'Every card you play adds +1 Patience to each waiting Neutrality Seraphim. When it attacks, it consumes all of its Patience and gains +15 Oblivion per stack. Patience then resets to 0.',
    sections: [
      {
        heading: 'How Patience Builds',
        body: 'Any card play adds +1 Patience to every Neutrality Seraphim on the board. Each Seraphim stores its own stacks. A unit that has waited for 8 card plays has 8 Patience; a unit that just attacked starts again at 0.\n\nPatience caps at 150 per Seraphim by default. Only Seraphim with a Patience threshold use this system.',
      },
      {
        heading: 'Seraphim Attack Payoff',
        body: 'On attack, a Seraphim consumes all of its Patience:\n\n• +15 Oblivion per stack.\n• 5 Patience gives +75 Oblivion; 10 gives +150.\n• Patience resets to 0 after the attack.\n\nNeutrality Seraphim cooldowns range from 5 to 6 cards, depending on the card.',
      },
      {
        heading: 'Patience Thresholds (Bonus Draw)',
        body: 'Attacking at or above a Seraphim\'s Patience threshold also draws cards:\n\n• Common Null and Void: threshold 3, draw 1.\n• Rare Balance: threshold 4, draw 1.\n• Rare Equilibrium: threshold 4, draw 2.\n• Epic Still: threshold 5, draw 2.\n\nAttacking below the threshold still pays +15 Oblivion per stack.',
      },
      {
        heading: 'Cherubim: Patience Amplifiers',
        body: 'A Cherubim boosts the Seraphim directly in front of it on every card play:\n\n• Common: +1 extra Patience per card, for +2 total.\n• Rare: +2 extra, for +3 total.\n• Epic: +3 extra, for +4 total.\n\nAn Epic Cherubim beside a Seraphim gives that Seraphim 24 Patience over 6 card plays, worth +360 Oblivion before multipliers.',
      },
      {
        heading: 'Ophanim: Draw and Recycle',
        body: 'Ophanim draw cards, recycle the discard pile, and search for Seraphim or Cherubim. Playing an Ophanim also counts as a card play for Patience.',
      },
      {
        heading: 'Angels: Patience Bursts',
        body: 'Neutrality Angels add Patience directly:\n\n• On summon, they give Patience to every Seraphim on the board.\n• Their activated abilities can double the Patience of every Seraphim at once.\n\nAngel attacks use Patience differently: each stack adds +2% of the attack\'s base Oblivion instead of +15 flat Oblivion.',
      },
      {
        heading: 'Patient Light',
        body: 'Patient Light increases the Patience gained from each card play. Each stack adds +1 to that gain. Patient Light is capped at 15 stacks by default.',
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
