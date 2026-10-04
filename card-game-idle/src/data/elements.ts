/** Legacy Neutrality defaults retained for older callers. */
export const SET_LABEL = 'Neutrality';

/** Accent color used for all Neutrality set UI elements. */
export const SET_ACCENT = '#9090a8';

/** Legacy-compat: single-entry record so UI components can still use record lookups during migration. */
export const SET_LABELS: Record<string, string> = { Neutrality: 'Neutrality', Causality: 'Causality', Intensity: 'Intensity', };
export const SET_COLORS: Record<string, string> = { Neutrality: '#9090a8', Causality: '#d66a52', Intensity: '#c8a15a' };

export type CardSetId = 'Neutrality' | 'Causality' | 'Intensity';

export const CARD_SET_LABELS: Record<CardSetId, string> = {
	Neutrality: 'Neutrality',
	Causality: 'Causality',
	Intensity: 'Intensity',
};

export const CARD_SET_COLORS: Record<CardSetId, string> = {
	Neutrality: '#9090a8',
	Causality: '#d66a52',
	Intensity: '#c8a15a',
};

export function getCardSetId(
  definitionId: string,
): CardSetId | null {
  if (
    definitionId.startsWith('light-intensity-')
    || definitionId.startsWith('dark-intensity-')
    || definitionId.startsWith('ain-soph-aur-intensity-')
    || definitionId.startsWith('eternal-intensity-')
    || definitionId.startsWith('infinite-intensity-')
  ) {
    return 'Intensity';
  }

  if (definitionId.includes('causality')) {
    return 'Causality';
  }

  if (definitionId.includes('neutral') || definitionId.startsWith('btei-')
    || /^inf-(oblivion-absolute|void-cascade|genesis-throne|null-apex|entropic-crown|annihilation-field|sovereign-void|eternity-rupture)$/.test(definitionId)) {
    return 'Neutrality';
  }

  return null;
}

export function getCardSetLabel(definitionId: string): string {
	const setId = getCardSetId(definitionId);
	return setId ? CARD_SET_LABELS[setId] : 'Unknown Set';
}

export function getCardSetColor(definitionId: string): string {
	const setId = getCardSetId(definitionId);
	return setId ? CARD_SET_COLORS[setId] : SET_ACCENT;
}
