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

  if (def.type === 'Light') {
    pushEffectTypes(def.onFlipEffects ?? []);
  }

  if (def.type === 'Dark') {
    pushEffectTypes(def.sophEffects);
  }

  if (def.type === 'AinSophAur') {
    pushEffectTypes(def.onSummonEffects);
    pushEffectTypes(def.onPlayEffects ?? []);
  }

  return types;
}

function hasSomeEffect(def: CardDefinition, candidates: string[]): boolean {
  const types = getEffectTypes(def);
  return candidates.some(candidate => types.includes(candidate));
}

function inferCardRolePattern(def: CardDefinition): CardRolePattern {
  if (def.type === 'AinSophAur') return 'finisher';

  if (def.type === 'Light') return 'payoff';

  if (def.type === 'Dark') {
    if (hasSomeEffect(def, ['draw', 'search_deck_by_type', 'look_top_take', 'look_top_take_drop', 'look_top_take_type', 'salvage_any', 'salvage_by_type', 'shuffle_discard'])) {
      return 'setup';
    }
    return 'support';
  }

  if (hasSomeEffect(def, ['score_flat', 'score_multiplier', 'oblivion_flat'])) {
    return 'payoff';
  }

  return 'setup';
}

function getCardRoleDetail(def: CardDefinition): string {
  if (def.type === 'Dark') {
    return 'It strengthens the board once your setup pieces are already in place.';
  }

  if (def.type === 'Light') {
    return 'Its impact is highest once the engine is already online and ready to convert setup into payoff.';
  }

  if (def.type === 'AinSophAur') {
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
    Light: 0,
    Dark: 1,
    AinSophAur: 2,
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
      const activeLightUnits = frontSlots.filter(u => u !== null);
      const lightStackTotal = turn.limitlessLightStacks ?? 0;
      const activeSupport = activeLightUnits.length > 0 || lightStackTotal > 0;

      return {
        key,
        label: meta.label,
        accent: meta.accent,
        compact: activeSupport
          ? `Light stacks ${lightStackTotal} | ${activeLightUnits.length} active unit${activeLightUnits.length !== 1 ? 's' : ''}`
          : 'Light stacks paused — no active support',
        detail: `Current Light-stack state: ${lightStackTotal} stored, ${activeLightUnits.length} board support`,
        tagline: 'Neutrality is now tracked in the final Light / Dark / Ain-Soph runtime model.',
        summary: 'The runtime uses the active Light-stack state and the board’s Light/Dark/Ain-Soph unit composition; it no longer derives from archived Neutrality equilibrium bookkeeping.',
        metrics: [
          createMetric('Light stacks', lightStackTotal, 'Total stored Light stacks available to the current turn.'),
          createMetric('Board support', activeLightUnits.length, 'Active Light-side or Ain-Soph units contributing to the current board state.'),
          createMetric('Runtime model', 'Light / Dark / Ain-Soph', 'The engine reflects the current taxonomy rather than the removed Neutrality attenuation model.'),
        ],
        nextSteps: [
          createStep('Stabilize the turn state', lightStackTotal >= 0, 'The Light-stack count is the canonical per-turn value; no legacy drift fields remain.'),
          createStep('Maintain board support', activeLightUnits.length > 0, activeLightUnits.length > 0
            ? `${activeLightUnits.length} active unit${activeLightUnits.length !== 1 ? 's' : ''} on board.`
            : 'Add Light-side or Ain-Soph units to keep the board in the current runtime model.'),
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
    title: 'Neutrality: Light / Dark / Ain-Soph Engine',
    intro: 'The runtime uses the current Light-stack state and the board’s Light, Dark, and Ain-Soph unit composition. It no longer depends on archived Neutrality drift bookkeeping.',
    sections: [
      {
        heading: 'Current Runtime Model',
        body: 'The active turn state tracks Light stacks directly. Board support is derived from the current unit composition, with Light and Dark family members plus Ain-Soph units contributing to the active engine state.',
      },
      {
        heading: 'Set-State Logic',
        body: 'Infinite full-fire checks evaluate the live board composition instead of the removed Neutrality equilibrium math. Light-stack totals remain the canonical per-turn resource.',
      },
      {
        heading: 'Ain-Soph and side metadata',
        body: 'Extra-deck units carry the Ain-Soph side metadata and flash charge state needed by the runtime. This is the canonical data model used by summon placement, board effects, and save compatibility.',
      },
      {
        heading: 'No legacy drift fields',
        body: 'Obsolete Debug/attenuation/equilibrium bookkeeping has been removed from the turn object. The engine now persists only the active runtime state that gameplay actually uses.',
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
