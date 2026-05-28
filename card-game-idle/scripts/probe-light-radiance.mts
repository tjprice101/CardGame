import { CardRegistry } from '../src/cards/CardRegistry';
import '../src/cards/RegistryBoot';

const lightIds = [
  'hr-light-divine-smite', 'hr-light-holy-radiance', 'hr-light-sacred-fury',
  'hr-light-luminous-strike', 'hr-light-radiant-surge', 'hr-light-sunforged',
  'hr-light-angelic-wrath', 'hr-light-exalted-mantle', 'hr-light-aureate-blessing',
  'hr-light-gilded-mandate', 'hr-light-celestial-grace', 'hr-light-heavenly-tithe',
  'hr-light-sanctified-offering', 'hr-light-celestial-dividend', 'hr-light-pillar-of-heaven',
  'hr-light-hastened-judgment', 'hr-light-seraphic-bond', 'hr-light-undying-vigil',
  'hr-light-celestial-scroll', 'hr-light-angelic-vision', 'hr-light-holy-insight',
  'hr-light-sacred-memory', 'hr-light-radiant-echo', 'hr-light-luminous-cycle',
  'hr-light-divine-clarity', 'hr-light-mornings-grace', 'hr-light-gleaming-passage',
  'hr-light-aureate-chain', 'hr-light-transcendent-surge', 'hr-light-sacred-covenant',
  'hr-light-grand-illumination',
  'ser-light-dawn', 'ser-light-choir', 'ser-light-herald', 'ser-light-vigil', 'ser-light-throne', 'ser-light-warden',
];

interface Row { id: string; name: string; net: number; details: string; draw: number }
const rows: Row[] = [];
for (const id of lightIds) {
  const d = CardRegistry.get(id) as any;
  if (!d) continue;
  const fx = [...(d.effects ?? []), ...(d.onPlayEffects ?? [])];
  let net = 0, draw = 0;
  const parts: string[] = [];
  for (const e of fx) {
    if (e.type === 'radiance_gain') { net += e.value; parts.push(`+${e.value}R`); }
    else if (e.type === 'radiance_spend') { net -= e.value; parts.push(`-${e.value}R`); }
    else if (e.type === 'draw') { draw += e.value; parts.push(`draw${e.value}`); }
    else if (e.type === 'conditional') {
      const inner = e.then ?? [];
      for (const ie of inner) {
        if (ie.type === 'radiance_gain') parts.push(`if(${e.condition?.type}):+${ie.value}R`);
        if (ie.type === 'radiance_spend') parts.push(`if(${e.condition?.type}):-${ie.value}R`);
      }
    }
  }
  if (net !== 0 || draw > 0 || parts.length > 0) rows.push({ id, name: d.name, net, draw, details: parts.join(' ') });
}
rows.sort((a, b) => b.net - a.net);
for (const r of rows) console.log(`${r.id.padEnd(35)} ${r.name.padEnd(25)} net=${r.net} draw=${r.draw}  [${r.details}]`);
