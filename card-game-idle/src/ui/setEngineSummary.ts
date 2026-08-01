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

  if (hasSomeEffect(def, ['patience_gain_all', 'patience_double_all', 'neutrality_equilibrium_sigil_gain'])) {
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
