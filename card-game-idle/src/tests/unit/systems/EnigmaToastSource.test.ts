import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Enigma acquisition toast text', () => {
  it('uses the registered Enigma title instead of the internal ID', () => {
    const source = readFileSync(join(process.cwd(), 'src/state/store.ts'), 'utf8');
    expect(source).toContain("const title = getEnigmaDefinition(enigmaId)?.title ?? enigmaId;");
    expect(source).toContain('`Enigma Acquired: ${title}`');
    expect(source).not.toContain('`Enigma Acquired: ${enigmaId}`');
  });
});