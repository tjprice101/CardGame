// Vocabulary registry for the rules-text highlighter. Each term maps to a
// color/style category. Terms are matched case-insensitively as whole words
// (with multi-word terms anchored as phrases). Multi-word terms are matched
// before single-word terms because the combined regex sorts longest-first.
//
// This file is the single source of truth — adding a new keyword here is
// enough to make it highlight everywhere CardRulesDigest is rendered.

import { SET_ACCENT } from '@/data/elements';

export type HighlightCategory =
  | 'mechanic'
  | 'status'
  | 'resource'
  | 'cardtype'
  | 'element'
  | 'trigger'
  | 'number';

export interface HighlightStyle {
  color: string;
  fontWeight?: 600 | 700;
  fontStyle?: 'italic';
}

export const HIGHLIGHT_STYLES: Record<HighlightCategory, HighlightStyle> = {
  mechanic: { color: '#f0bd78', fontWeight: 700 },
  status: { color: '#ff9b6b', fontWeight: 700 },
  resource: { color: '#ffd86b', fontWeight: 700 },
  cardtype: { color: '#c8b890', fontWeight: 700 },
  element: { color: '#9bc7ff', fontWeight: 700 },
  trigger: { color: '#b8a07f', fontStyle: 'italic', fontWeight: 600 },
  number: { color: '#80e860', fontWeight: 700 },
};

// Dark-shade variants for use on light parchment card face panels.
// These preserve hue intent but are readable against cream/tan backgrounds.
export const LIGHT_BG_HIGHLIGHT_STYLES: Record<HighlightCategory, HighlightStyle> = {
  mechanic: { color: '#7a4e0e', fontWeight: 700 },
  status:   { color: '#882a0e', fontWeight: 700 },
  resource: { color: '#6b4a00', fontWeight: 700 },
  cardtype: { color: '#5a3c14', fontWeight: 700 },
  element:  { color: '#1a3f6b', fontWeight: 700 },
  trigger:  { color: '#5a3818', fontStyle: 'italic', fontWeight: 600 },
  number:   { color: '#1a5a10', fontWeight: 700 },
};

// Single-word and multi-word phrases keyed by category. Order within a
// category does not matter — the builder sorts all entries longest-first.
const VOCAB: Record<Exclude<HighlightCategory, 'element' | 'number'>, string[]> = {
  trigger: [
    'On Play',
    'On Summon',
    'On Board',
    'While on board',
    'After',
    'When',
    'Whenever',
    'Play',
    'Passive',
    'Hooks',
    'Awaken',
    'Materials',
  ],
  mechanic: [
    'Cooldown',
    'Synergy',
    'Patience',
    'Holofoil',
    'Holo',
    'Eternal',
    'Infinite',
    'Refraction Depth',
    'Draw',
    'Discard',
    'Reshuffle',
    'Summon',
    'Sacrifice',
    'Exalted',
    'Primary',
    'Unsynergized',
    'Synergized',
    'Auto-discard',
    'Durability',
    'Tick speed',
    'Resource generation',
    'Power amplifier',
    'Power',
    'amplified',
    'Materials',
    'Reforge Charge',
    'Reforge Charges',
    'Recast',
    'Nacre-Recast',
    'Anvil-Seal',
    'Nacre-Coat',
    'Imprint',
    'Imprint stacks',
    'Forge Crown',
    'Forge Crowns',
    'Pearl',
    'Pearls',
    'Ignite the Unrecorded Hue',
  ],
  status: [
    'Burn',
    'Freeze',
    'Stun',
    'Silence',
    'Haste',
    'Stagger',
    'Wither',
    'Spark',
    'Bloom',
    'Frostbite',
    'Scorched',
    'Bramble',
  ],
  resource: [
    'Oblivion',
    'Aberrated Shards',
    'Aberrated Shard',
    'Monochromatic Shards',
    'Radiance',
    'Heat',
    'Trail',
    'Strain',
    'Resonance Charge',
    'Prism Charge',
    'Prism Charges',
    'Node Charges',
    'Memory Shards',
    'Arctic Charge',
    'Polar Capacitor',
    'Polar Capacitors',
    'Proof',
  ],
  cardtype: [
    'Seraphim',
    'Cherubim',
    'Ophanim',
    'Angel',
  ],
};

export interface VocabEntry {
  /** The phrase to match (case-insensitive). */
  phrase: string;
  category: HighlightCategory;
  /** Optional per-entry color override (used for element entries). */
  color?: string;
}

let cachedEntries: VocabEntry[] | null = null;

/**
 * Returns every vocabulary entry sorted by phrase length descending so the
 * combined regex picks up multi-word phrases before single-word substrings
 * (e.g. "On Play" before "Play").
 */
export function getVocabularyEntries(): VocabEntry[] {
  if (cachedEntries) return cachedEntries;

  const entries: VocabEntry[] = [];
  for (const [category, phrases] of Object.entries(VOCAB) as [HighlightCategory, string[]][]) {
    for (const phrase of phrases) {
      entries.push({ phrase, category });
    }
  }

  // Set names — add Neutrality as a highlighted vocab term
  entries.push({ phrase: 'Neutrality', category: 'element', color: SET_ACCENT });

  // Deduplicate by lowercased phrase, preferring the first occurrence so the
  // explicit VOCAB takes precedence over element name collisions.
  const seen = new Set<string>();
  const deduped: VocabEntry[] = [];
  for (const entry of entries) {
    const key = entry.phrase.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);
  }

  deduped.sort((a, b) => b.phrase.length - a.phrase.length);
  cachedEntries = deduped;
  return deduped;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let cachedRegex: RegExp | null = null;

/**
 * Builds (and caches) the combined matcher regex. Numbers are matched as a
 * single token covering signed integers, decimals, x-multipliers, and percent
 * suffixes — e.g. `+45%`, `x1.8`, `-3`.
 */
export function getHighlightRegex(): RegExp {
  if (cachedRegex) return cachedRegex;

  const phrases = getVocabularyEntries().map(entry => escapeRegex(entry.phrase));
  // Number pattern: optional sign or 'x', digits, optional decimal, optional %.
  const numberPattern = '[+\\-x×]?\\d+(?:\\.\\d+)?%?';
  // Combine: numbers first as a named alternative so we can categorise the
  // hit by inspecting the matched text in the tokenizer.
  const pattern = `(${numberPattern})|\\b(${phrases.join('|')})\\b`;
  cachedRegex = new RegExp(pattern, 'gi');
  return cachedRegex;
}

/**
 * Looks up the category for a matched phrase (case-insensitive). Returns
 * `null` when the phrase isn't a tracked vocabulary entry.
 */
export function getEntryForPhrase(phrase: string): VocabEntry | null {
  const lower = phrase.toLowerCase();
  for (const entry of getVocabularyEntries()) {
    if (entry.phrase.toLowerCase() === lower) return entry;
  }
  return null;
}
