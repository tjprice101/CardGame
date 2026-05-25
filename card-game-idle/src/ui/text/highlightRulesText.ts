// Tokenises a card-rules string into a mixed array of plain text and
// styled spans. Designed to be called from the render path of
// `CardRulesDigest` and other card-text consumers.

import React from 'react';
import {
  getHighlightRegex,
  getEntryForPhrase,
  HIGHLIGHT_STYLES,
  type HighlightCategory,
} from './rulesVocabulary';

export interface HighlightOptions {
  /** When true, suppress highlighting and return plain text. */
  disabled?: boolean;
  /** When true, scale down font emphasis for tight preview panels. */
  compact?: boolean;
}

function categoriseNumberMatch(_text: string): HighlightCategory {
  return 'number';
}

/**
 * Returns a flat array of React nodes representing the input string with
 * recognised tokens replaced by styled `<span>`s. Returns a single-element
 * array containing the raw string when no matches are found or when
 * highlighting is disabled.
 */
export function highlightRulesText(text: string, options?: HighlightOptions): React.ReactNode[] {
  if (!text) return [''];
  if (options?.disabled) return [text];

  const regex = getHighlightRegex();
  regex.lastIndex = 0;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;

    if (matchStart > lastIndex) {
      nodes.push(text.slice(lastIndex, matchStart));
    }

    const numberHit = match[1];
    const phraseHit = match[2];
    let category: HighlightCategory | null = null;
    let colorOverride: string | undefined;

    if (numberHit) {
      category = categoriseNumberMatch(numberHit);
    } else if (phraseHit) {
      const entry = getEntryForPhrase(phraseHit);
      if (entry) {
        category = entry.category;
        colorOverride = entry.color;
      }
    }

    if (category) {
      const baseStyle = HIGHLIGHT_STYLES[category];
      const style: React.CSSProperties = {
        color: colorOverride ?? baseStyle.color,
        fontWeight: baseStyle.fontWeight,
        fontStyle: baseStyle.fontStyle,
      };
      nodes.push(
        React.createElement('span', { key: `h${key++}`, style }, match[0]),
      );
    } else {
      nodes.push(match[0]);
    }

    lastIndex = matchEnd;

    // Defensive: zero-length matches would loop forever.
    if (matchEnd === matchStart) {
      regex.lastIndex = matchEnd + 1;
    }
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}
