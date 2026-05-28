import { CardRegistry } from '../src/cards/CardRegistry';
import '../src/cards/RegistryBoot';

const ids = [
  'ser-light-dawn',
  'ser-light-choir',
  'hr-light-mornings-grace',
  'hr-light-celestial-scroll',
  'hr-light-celestial-grace',
  'hr-light-holy-radiance',
  'hr-light-sacred-fury',
];

for (const id of ids) {
  const d = CardRegistry.get(id) as any;
  if (!d) { console.log(id, 'MISSING'); continue; }
  const summary: any = { name: d.name, type: d.type, effects: d.effects, onPlayEffects: d.onPlayEffects };
  if (d.attacks) summary.attacks = Object.entries(d.attacks).map(([k, v]: any) => ({ k, baseOblivion: v.baseOblivion, costs: v.costs, requiresAngelOnBoard: v.requiresAngelOnBoard }));
  console.log(id, JSON.stringify(summary));
}
