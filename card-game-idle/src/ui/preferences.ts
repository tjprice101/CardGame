import type { CardDefinition } from '@/types/cards';
import type { CardArtDisplay, CardThemePackId, FontSizePreset, UiLanguage } from '@/types/game';

export interface UiPreferences {
  language: UiLanguage;
  fontSizePreset: FontSizePreset;
  cardArtDisplay: CardArtDisplay;
  cardThemePacks: Record<string, CardThemePackId>;
}

export const LANGUAGE_OPTIONS: Array<{ value: UiLanguage; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espanol' },
  { value: 'fr', label: 'Francais' },
];

export const FONT_SIZE_OPTIONS: Array<{ value: FontSizePreset; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'standard', label: 'Standard' },
  { value: 'large', label: 'Large' },
];

export const CARD_THEME_PACK_OPTIONS: Array<{ value: CardThemePackId; label: string }> = [
  { value: 'classic', label: 'Classic' },
  { value: 'luminous', label: 'Luminous' },
  { value: 'nocturne', label: 'Nocturne' },
];

export const DEFAULT_CARD_THEME_PACKS: Record<string, CardThemePackId> = {
  Eternal: 'luminous',
  Neutrality: 'classic',
  Light: 'luminous',
  Dark: 'luminous',
  Thornbound: 'nocturne',
  Mechanical: 'classic',
  Prismatic: 'luminous',
  Fire: 'luminous',
  Water: 'classic',
  Earth: 'classic',
  Wind: 'luminous',
};

const CARD_THEME_PACK_STYLES: Record<CardThemePackId, {
  text: string;
  textSoft: string;
  textMuted: string;
  ribbon: string;
  panel: string;
  border: string;
  shadow: string;
  baseGradient: string;
  highlight: string;
}> = {
  classic: {
    text: '#0f0906',
    textSoft: 'rgba(15, 9, 6, 0.96)',
    textMuted: 'rgba(15, 9, 6, 0.84)',
    ribbon: 'rgba(242, 231, 216, 0.97)',
    panel: 'rgba(236, 222, 203, 0.96)',
    border: 'rgba(52, 35, 21, 0.24)',
    shadow: '0 10px 24px rgba(68, 49, 32, 0.12)',
    baseGradient: 'linear-gradient(180deg, rgba(255, 247, 236, 0.98) 0%, rgba(243, 228, 207, 0.98) 100%)',
    highlight: 'rgba(255, 255, 255, 0.18)',
  },
  luminous: {
    text: '#180f09',
    textSoft: 'rgba(24, 15, 9, 0.95)',
    textMuted: 'rgba(24, 15, 9, 0.8)',
    ribbon: 'rgba(250, 241, 223, 0.98)',
    panel: 'rgba(244, 229, 203, 0.96)',
    border: 'rgba(150, 102, 45, 0.28)',
    shadow: '0 12px 26px rgba(132, 93, 40, 0.14)',
    baseGradient: 'linear-gradient(180deg, rgba(255, 250, 238, 0.99) 0%, rgba(246, 229, 196, 0.98) 100%)',
    highlight: 'rgba(255, 237, 170, 0.22)',
  },
  nocturne: {
    text: '#f2ece4',
    textSoft: 'rgba(242, 236, 228, 0.96)',
    textMuted: 'rgba(242, 236, 228, 0.8)',
    ribbon: 'rgba(231, 224, 214, 0.97)',
    panel: 'rgba(210, 199, 185, 0.93)',
    border: 'rgba(124, 108, 88, 0.36)',
    shadow: '0 12px 28px rgba(28, 22, 16, 0.32)',
    baseGradient: 'linear-gradient(180deg, rgba(22, 20, 18, 0.98) 0%, rgba(40, 35, 30, 0.98) 100%)',
    highlight: 'rgba(206, 178, 145, 0.2)',
  },
};

const ELEMENT_TINTS: Record<string, string> = {
  Eternal: '#ff8a8a',
  Neutrality: '#b69c72',
  Light: '#f2d46b',
  Dark: '#6a4a3f',
  Thornbound: '#c26b63',
  Mechanical: '#93a6d2',
  Prismatic: '#c59df1',
  Fire: '#ef8a4f',
  Water: '#68b8e8',
  Earth: '#c39b53',
  Wind: '#65d39c',
};

let currentPreferences: UiPreferences = {
  language: 'en',
  fontSizePreset: 'standard',
  cardArtDisplay: 'both',
  cardThemePacks: { ...DEFAULT_CARD_THEME_PACKS },
};

export function setUiPreferences(patch: Partial<UiPreferences>): void {
  currentPreferences = {
    ...currentPreferences,
    ...patch,
    cardThemePacks: patch.cardThemePacks
      ? { ...currentPreferences.cardThemePacks, ...patch.cardThemePacks }
      : currentPreferences.cardThemePacks,
  };
}

export function getUiPreferences(): UiPreferences {
  return currentPreferences;
}

export function getFontScale(preset: FontSizePreset = currentPreferences.fontSizePreset): number {
  switch (preset) {
    case 'compact': return 0.82;
    case 'large': return 1.18;
    default: return 1;
  }
}

export function getCardArtDisplay(): CardArtDisplay {
  return currentPreferences.cardArtDisplay;
}

export function getCardThemePackForElement(element: string): CardThemePackId {
  const configured = currentPreferences.cardThemePacks[element] ?? 'classic';
  // Backward-compat override: old saves may force a blue-leaning pack on these sets.
  if ((element === 'Dark' || element === 'Prismatic') && configured === 'nocturne') {
    return 'luminous';
  }
  return configured;
}

export function getCardThemePackStyle(card: Pick<CardDefinition, 'element'> | null | undefined): (typeof CARD_THEME_PACK_STYLES)[CardThemePackId] {
  const element = card?.element ?? 'Neutrality';
  const packId = getCardThemePackForElement(element);
  const base = CARD_THEME_PACK_STYLES[packId];
  const tint = ELEMENT_TINTS[element] ?? ELEMENT_TINTS.Neutrality;
  return {
    ...base,
    baseGradient: packId === 'nocturne'
      ? 'linear-gradient(180deg, rgba(24, 28, 40, 0.98) 0%, rgba(44, 54, 74, 0.98) 100%)'
      : base.baseGradient,
    highlight: `rgba(${hexToRgb(tint)}, ${packId === 'nocturne' ? 0.16 : 0.2})`,
  };
}

const TRANSLATIONS = {
  en: {
    settingsTitle: 'Settings',
    gameplaySettings: 'Gameplay Settings',
    saveData: 'Save Data',
    musicVolume: 'Music Volume',
    sfxVolume: 'SFX Volume',
    musicEnabled: 'Music Enabled',
    particlesEnabled: 'Particles Enabled',
    reducedMotion: 'Reduced Motion',
    fontSizePreset: 'Font Size Preset',
    language: 'Language',
    cardThemePacks: 'Card Theme Packs',
    saveNow: 'Save Now',
    deleteSaveData: 'Delete Save Data',
    close: 'Close',
    cardStore: 'Card Store',
    eternityWake: 'Eternity\'s Wake',
    infinitude: 'Infinitude',
    deckBuilder: 'Deck Builder',
    deckViewer: 'Deck Viewer',
    tutorial: 'Tutorial',
    myDecks: 'My Decks',
    savedDecks: 'Saved Decks',
    activeDeck: 'Active',
    seraphim: 'Seraphim',
    hrCards: 'HR Cards',
    applyImmediately: 'Changes apply immediately and persist when saved.',
  },
  es: {
    settingsTitle: 'Ajustes',
    gameplaySettings: 'Ajustes de Juego',
    saveData: 'Datos Guardados',
    musicVolume: 'Volumen de Musica',
    sfxVolume: 'Volumen de SFX',
    musicEnabled: 'Musica Activada',
    particlesEnabled: 'Particulas Activadas',
    reducedMotion: 'Movimiento Reducido',
    fontSizePreset: 'Tamano de Fuente',
    language: 'Idioma',
    cardThemePacks: 'Temas de Cartas',
    saveNow: 'Guardar Ahora',
    deleteSaveData: 'Borrar Guardado',
    close: 'Cerrar',
    cardStore: 'Tienda de Cartas',
    eternityWake: 'Despertar de la Eternidad',
    infinitude: 'Infinitud',
    deckBuilder: 'Constructor de Mazos',
    deckViewer: 'Vista de Mazos',
    tutorial: 'Tutorial',
    myDecks: 'Mis Mazos',
    savedDecks: 'Mazos Guardados',
    activeDeck: 'Activo',
    seraphim: 'Serafines',
    hrCards: 'Cartas HR',
    applyImmediately: 'Los cambios se aplican al instante y se guardan al confirmar.',
  },
  fr: {
    settingsTitle: 'Parametres',
    gameplaySettings: 'Parametres de jeu',
    saveData: 'Sauvegarde',
    musicVolume: 'Volume de musique',
    sfxVolume: 'Volume des effets',
    musicEnabled: 'Musique activee',
    particlesEnabled: 'Particules activees',
    reducedMotion: 'Mouvement reduit',
    fontSizePreset: 'Taille de police',
    language: 'Langue',
    cardThemePacks: 'Themes des cartes',
    saveNow: 'Enregistrer',
    deleteSaveData: 'Supprimer la sauvegarde',
    close: 'Fermer',
    cardStore: 'Boutique de cartes',
    eternityWake: 'Eveil de l�fEternite',
    infinitude: 'Infinitude',
    deckBuilder: 'Constructeur de deck',
    deckViewer: 'Voir les decks',
    tutorial: 'Tutoriel',
    myDecks: 'Mes decks',
    savedDecks: 'Decks sauvegardes',
    activeDeck: 'Actif',
    seraphim: 'Seraphins',
    hrCards: 'Cartes HR',
    applyImmediately: 'Les changements sont immediats et persistants une fois enregistres.',
  },
} as const;

type TranslationKey = keyof typeof TRANSLATIONS.en;

function sanitizeDisplayText(value: string): string {
  return value
    .replace(/\uFEFF/g, '')
    // Multiplication artifacts (e.g., "AE5.0", "ÁE.4", "�~1.8", "2ÁECinder")
    .replace(/([0-9])(?:AE|ÁE|�~|�E)(?=[0-9.])/g, '$1x')
    .replace(/(?:AE|ÁE|�~|�E)(?=[0-9.])/g, 'x')
    .replace(/([0-9])(?:AE|ÁE|�E)(?=[A-Za-z])/g, '$1x ')
    .replace(/(?:AE|ÁE|�E)(?=\{)/g, 'x')
    // Separator artifacts introduced by encoding issues.
    .replace(/(?: E|ↁE|�fE|�E)/g, ' - ')
    // Generic cleanup of lingering replacement chars around punctuation.
    .replace(/\s*�\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  const language = currentPreferences.language;
  const template = String(TRANSLATIONS[language]?.[key] ?? TRANSLATIONS.en[key] ?? key);
  if (!vars) return sanitizeDisplayText(template);
  const formatted = (Object.entries(vars) as Array<[string, string | number]>).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    template,
  );
  return sanitizeDisplayText(formatted);
}

export function getDisplayCardTypeLabel(type: string): string {
  if (type === 'Ophanim') return 'Ophanim';
  if (type === 'Cherubim') return 'Cherubim';
  if (type === 'Ophanim') return 'Ophanim';
  if (type === 'Cherubim') return 'Cherubim';
  return type;
}

export function isDisplayOphanimType(type: string): boolean {
  return type === 'Ophanim' || type === 'Ophanim';
}

export function isDisplayCherubimType(type: string): boolean {
  return type === 'Cherubim' || type === 'Cherubim';
}

export function formatDisplayCardText(text: string): string {
  return sanitizeDisplayText(text)
    .replace(/\bOphanim\b/g, 'Ophanim')
    .replace(/\bophanim\b/g, 'ophanim')
    .replace(/\bCherubim\b/g, 'Cherubim')
    .replace(/\bcherubim\b/g, 'cherubim');
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const value = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}