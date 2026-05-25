import { describe, it, expect } from 'vitest';
import { highlightRulesText } from '@/ui/text/highlightRulesText';

function nodesToText(nodes: ReturnType<typeof highlightRulesText>): string {
  return nodes
    .map(n => {
      if (typeof n === 'string') return n;
      if (n && typeof n === 'object' && 'props' in n) return (n as any).props.children as string;
      return '';
    })
    .join('');
}

describe('highlightRulesText', () => {
  it('passes through plain text unchanged when disabled', () => {
    const result = highlightRulesText('Burn 3 enemies and draw 2 cards', { disabled: true });
    expect(result).toEqual(['Burn 3 enemies and draw 2 cards']);
  });

  it('preserves the original text content across all tokens', () => {
    const input = 'Burn 3 enemies and draw 2 cards';
    const nodes = highlightRulesText(input);
    expect(nodesToText(nodes)).toBe(input);
  });

  it('matches multi-word trigger before substring "Play"', () => {
    const input = 'On Play: Draw 2 cards';
    const nodes = highlightRulesText(input);
    // The first styled span should wrap "On Play" exactly.
    const firstSpan = nodes.find(n => typeof n === 'object') as any;
    expect(firstSpan.props.children).toBe('On Play');
  });

  it('tokenises numbers like +45% and x1.8', () => {
    const nodes = highlightRulesText('Power amplified by x1.8 and gain +45% Oblivion');
    const text = nodesToText(nodes);
    expect(text).toBe('Power amplified by x1.8 and gain +45% Oblivion');
    const styled = nodes.filter(n => typeof n === 'object') as any[];
    const styledTexts = styled.map(s => s.props.children);
    expect(styledTexts).toContain('x1.8');
    expect(styledTexts).toContain('+45%');
    expect(styledTexts).toContain('Oblivion');
  });

  it('returns single-element array for empty input', () => {
    expect(highlightRulesText('')).toEqual(['']);
  });
});
