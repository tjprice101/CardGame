// One-shot text transform: inject Spark family alongside Stack family.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = [
  resolve('src/data/cards/eternalCards.ts'),
  resolve('src/data/cards/infiniteCards.ts'),
];

// Per-set spark gain & cashout values
const SPARK_GAIN_VALUE = 1;
const SPARK_CASHOUT_MULT_PER_SPARK: Record<string, number> = {
  pyro: 12,
  light: 10,
  thorn: 11,
  glass: 9,
  mech: 12,
  prism: 10,
};

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  let injectedGain = 0;
  let injectedCashout = 0;
  let skippedAlreadyHas = 0;

  // 1) Inject spark_gain after every stack_gain (idempotent — skip if next sibling already spark_gain for same set)
  src = src.replace(
    /\{\s*type:\s*'eternal_stack_gain',\s*stack:\s*'([a-z]+)',\s*value:\s*(\d+)\s*\}(\s*,\s*\{\s*type:\s*'eternal_spark_gain')?/g,
    (match, stack, value, hasSpark) => {
      if (hasSpark) { skippedAlreadyHas++; return match; }
      injectedGain++;
      return `{ type: 'eternal_stack_gain', stack: '${stack}', value: ${value} }, { type: 'eternal_spark_gain', spark: '${stack}', value: ${SPARK_GAIN_VALUE} }`;
    }
  );

  // 2) Inject spark_cashout after every stack_cashout
  src = src.replace(
    /\{\s*type:\s*'eternal_stack_cashout',\s*stack:\s*'([a-z]+)',([^{}]*?)\}(\s*,\s*\{\s*type:\s*'eternal_spark_cashout')?/g,
    (match, stack, rest, hasSpark) => {
      if (hasSpark) { skippedAlreadyHas++; return match; }
      const mult = SPARK_CASHOUT_MULT_PER_SPARK[stack] ?? 10;
      injectedCashout++;
      return `{ type: 'eternal_stack_cashout', stack: '${stack}',${rest}}, { type: 'eternal_spark_cashout', spark: '${stack}', scoreMultiplierPerSpark: ${mult} }`;
    }
  );

  writeFileSync(file, src, 'utf8');
  console.log(`${file}: +${injectedGain} spark_gain, +${injectedCashout} spark_cashout, skipped ${skippedAlreadyHas}`);
}
