import { useSyncExternalStore } from 'react';
import { getThemeVersion, subscribeThemeVersion } from '@/ui/theme';

/**
 * Subscribe to live UI theme changes. Components that read `warmTheme.*`
 * inline (rather than deriving via `getEffectiveThemePalette` in a useMemo)
 * should call this hook so they re-render when the player switches themes.
 *
 * Returns the current theme version counter (bumped on every `applyUiPalette`
 * / `resetUiPalette` call).
 */
export function useThemeVersion(): number {
  return useSyncExternalStore(subscribeThemeVersion, getThemeVersion, getThemeVersion);
}
