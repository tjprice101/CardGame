// Diagnostic: enumerate every effect/condition type used in eternal/infinite cards,
// and check whether cardStatSummary's formatEffect/formatCondition handles it (i.e. doesn't fall through to default).
import { eternalCards } from '../src/data/cards/eternalCards.ts';
import { infiniteCards } from '../src/data/cards/infiniteCards.ts';
import { getCanonicalCardDescription, getCanonicalActivatedAbilityDescription, getCardSummarySections } from '../src/ui/cardStatSummary.ts';

const ALL = [...eternalCards, ...infiniteCards];

function walkEffects(arr: any[], out: { effects: Set<string>; conds: Set<string> }) {
  if (!Array.isArray(arr)) return;
  for (const e of arr) {
    if (!e || typeof e !== 'object') continue;
    if (typeof e.type === 'string') out.effects.add(e.type);
    if (e.condition && typeof e.condition.type === 'string') out.conds.add(e.condition.type);
    if (Array.isArray(e.then)) walkEffects(e.then, out);
    if (Array.isArray(e.else)) walkEffects(e.else, out);
    if (Array.isArray(e.effects)) walkEffects(e.effects, out);
    if (e.effect && typeof e.effect === 'object') walkEffects([e.effect], out);
    if (Array.isArray(e.gates)) for (const g of e.gates) {
      if (g.condition?.type) out.conds.add(g.condition.type);
      if (g.payoff) walkEffects([g.payoff], out);
    }
  }
}

const out = { effects: new Set<string>(), conds: new Set<string>() };
for (const c of ALL as any[]) {
  walkEffects(c.effects, out);
  walkEffects(c.onPlayEffects, out);
  walkEffects(c.onSummonEffects, out);
  if (c.activatedAbility?.effects) walkEffects(c.activatedAbility.effects, out);
}

// Render every card and detect strings that look like raw enum tokens (snake_case with underscores in run-on form)
const enumPattern = /\b([a-z]+_[a-z_]+)\b/g;
const unrendered: { card: string; raw: string; source: string }[] = [];
for (const c of ALL as any[]) {
  const sources: [string, string][] = [];
  try { sources.push(['canonical', getCanonicalCardDescription(c)]); } catch {}
  if (c.type === 'Angel' && c.activatedAbility) try { sources.push(['ability', getCanonicalActivatedAbilityDescription(c)]); } catch {}
  try {
    const sections = getCardSummarySections(c, { abilityTextMode: 'canonical' });
    for (const s of sections) for (const line of s.lines) sources.push([`section:${s.title}`, line]);
  } catch {}
  for (const [src, text] of sources) {
    if (!text) continue;
    const matches = text.match(enumPattern) ?? [];
    for (const m of matches) {
      // ignore common natural underscores that don't appear (we just check known known effect names)
      if (out.effects.has(m) || out.conds.has(m)) unrendered.push({ card: c.definitionId, raw: m, source: src });
    }
  }
}

console.log('--- Unique effect types in E/I cards ---');
console.log([...out.effects].sort().join('\n'));
console.log('\n--- Unique condition types in E/I cards ---');
console.log([...out.conds].sort().join('\n'));
console.log('\n--- Raw enum tokens leaked to UI text ---');
const byType = new Map<string, string[]>();
for (const u of unrendered) {
  if (!byType.has(u.raw)) byType.set(u.raw, []);
  byType.get(u.raw)!.push(`${u.card}@${u.source}`);
}
for (const [raw, cards] of [...byType.entries()].sort()) {
  console.log(`${raw}  (${cards.length} occurrences, e.g. ${cards[0]})`);
}
