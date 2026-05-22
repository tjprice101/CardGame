// Inventory E/I cards for the bottom 5 sets (Snowbound, Glass Absolute, Burning Garden, Butterfly, Eternal Seas)
import { eternalCards } from '../src/data/cards/eternalCards.ts';
import { infiniteCards } from '../src/data/cards/infiniteCards.ts';

const setMatchers: Record<string, (c: any) => boolean> = {
  Snowbound:      c => c.element === 'Snowbound Voltage' || /sv-(eternal|infinite)|inf-sv-/.test(c.definitionId),
  GlassAbsolute:  c => c.element === 'Glass Absolute',
  BurningGarden:  c => c.element === 'Burning Garden',
  Butterfly:      c => c.element === 'Age of the Butterfly' || c.element === 'Butterfly',
  EternalSeas:    c => c.element === 'Eternal Seas',
};

const ALL = [...eternalCards, ...infiniteCards] as any[];
for (const [name, m] of Object.entries(setMatchers)) {
  const cards = ALL.filter(c => (c.rarity === 'Eternal' || c.rarity === 'Infinite') && m(c));
  console.log(`\n=== ${name} (${cards.length}) ===`);
  for (const c of cards) console.log(`  ${c.rarity.padEnd(8)} ${c.type.padEnd(8)} ${c.definitionId}  [${c.element}]`);
}
