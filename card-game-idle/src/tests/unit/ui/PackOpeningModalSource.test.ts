import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const modalPath = join(process.cwd(), 'src/ui/store/PackOpeningModal.tsx');

describe('PackOpeningModal reveal controls', () => {
  it('does not auto-trigger reveal all on a timer', () => {
    const source = readFileSync(modalPath, 'utf8');

    expect(source).not.toContain('setTimeout(revealAll');
    expect(source).not.toContain('setInterval(revealAll');
  });

  it('keeps manual reveal controls available', () => {
    const source = readFileSync(modalPath, 'utf8');

    expect(source).toContain('onClick={revealAll}');
    expect(source).toContain('onClick={instantReveal}');
    expect(source).toContain('onClick={() => onClick(idx)}');
  });
});
