/** Legacy Neutrality defaults retained for older callers. */
export const SET_LABEL = 'Neutrality';

/** Accent color used for all Neutrality set UI elements. */
export const SET_ACCENT = '#9090a8';

/** Legacy-compat: single-entry record so UI components can still use record lookups during migration. */
export const SET_LABELS: Record<string, string> = { Neutrality: 'Neutrality', Causality: 'Causality' };
export const SET_COLORS: Record<string, string> = { Neutrality: '#9090a8', Causality: '#d66a52' };

export type CardSetId = 'Neutrality' | 'Causality';

export const CARD_SET_LABELS: Record<CardSetId, string> = {
	Neutrality: 'Neutrality',
	Causality: 'Causality',
};

export const CARD_SET_COLORS: Record<CardSetId, string> = {
	Neutrality: '#9090a8',
	Causality: '#d66a52',
};

export function getCardSetId(definitionId: string): CardSetId | null {
	if (definitionId.includes('causality')) return 'Causality';
	if (definitionId.includes('neutral')) return 'Neutrality';
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
