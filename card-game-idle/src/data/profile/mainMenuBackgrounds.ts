import { isThemeUnlocked } from '@/data/profile/uiThemes';
import { UI_THEMES } from '@/data/profile/uiThemes';
import type { ProgressState } from '@/types/game';

export interface MainMenuBackgroundEntry {
  id: string;
  name: string;
  imageUrl: string;
  source: 'builtin' | 'workspace';
  description: string;
  unlockThemeId?: string;
  unlockHint?: string;
}

export const DEFAULT_MAIN_MENU_BACKGROUND_ID = 'main-menu-bg-default';

const DEFAULT_ENTRY: MainMenuBackgroundEntry = {
  id: DEFAULT_MAIN_MENU_BACKGROUND_ID,
  name: 'Infinite Cards Sky',
  imageUrl: `${import.meta.env.BASE_URL}assets/InfiniteCardsMenuArt.png`,
  source: 'builtin',
  description: 'Default Pantheon main menu sky-art.',
};

let cachedPromise: Promise<MainMenuBackgroundEntry[]> | null = null;

const REWARD_THEME_FILE_STEMS: Record<string, string> = {
  neutrality: 'neutrality',
  'infinite-cards': 'infinite cards',
};

function getBundledRewardArtUrl(themeId: string): string | null {
  const match = themeId.match(/^theme-reward-(base|infinite|eternal)-(.+)$/);
  if (!match) return null;

  const tier = match[1];
  const slug = match[2];
  const stem = REWARD_THEME_FILE_STEMS[slug];
  if (!stem) return null;

  // Current imported pipeline provides Infinite/Eternal splash sheets.
  if (tier !== 'infinite' && tier !== 'eternal') return null;

  const filename = `${stem} ${tier} card first acquisition splash screen.png`;
  return `${import.meta.env.BASE_URL}assets/menu-backgrounds/${encodeURIComponent(filename)}`;
}

function normalizeWorkspaceName(raw: string): string {
  const noExt = raw.replace(/\.[^.]+$/, '');
  return noExt.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferRewardThemeUnlock(name: string): { themeId?: string; hint?: string } {
  const lower = name.toLowerCase();
  const tier = lower.includes('eternal')
    ? 'eternal'
    : lower.includes('infinite')
      ? 'infinite'
      : lower.includes('completion') || lower.includes('base')
        ? 'base'
        : null;
  if (!tier) return {};

  const setRule = [
    { slug: 'neutrality', label: 'Neutrality', aliases: ['neutrality'] },
    { slug: 'infinite-cards', label: 'Infinite Cards', aliases: ['infinite cards'] },
  ].find((r) => r.aliases.some((alias) => lower.includes(alias)));

  if (!setRule) return {};

  const themeId = `theme-reward-${tier}-${setRule.slug}`;
  const hint = tier === 'eternal'
    ? `Unlock by owning every Eternal ${setRule.label} card.`
    : tier === 'infinite'
      ? `Unlock by owning every Infinite ${setRule.label} card.`
      : `Unlock by completing the ${setRule.label} base set.`;

  return { themeId, hint };
}

function buildRewardBackgroundSlots(): MainMenuBackgroundEntry[] {
  const setRank: Record<string, number> = {
    Neutrality: 0,
  };

  const rewardThemes = UI_THEMES
    .filter((theme) => theme.group === 'reward')
    // Hide base-set placeholders for now; only show Eternal/Infinite rewards.
    .filter((theme) => theme.rewardKind === 'eternal-full' || theme.rewardKind === 'infinite-full')
    .sort((a, b) => {
      const rankA = setRank[a.setId ?? ''] ?? Number.MAX_SAFE_INTEGER;
      const rankB = setRank[b.setId ?? ''] ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;

      const tierRank = (kind: typeof a.rewardKind): number => {
        if (kind === 'eternal-full') return 0;
        if (kind === 'infinite-full') return 1;
        return 2;
      };
      const tierDiff = tierRank(a.rewardKind) - tierRank(b.rewardKind);
      if (tierDiff !== 0) return tierDiff;

      return a.name.localeCompare(b.name);
    });

  return rewardThemes
    .map((theme) => ({
      id: `main-menu-bg-slot-${theme.id}`,
      name: `${theme.name} Splash`,
      imageUrl: getBundledRewardArtUrl(theme.id) ?? DEFAULT_ENTRY.imageUrl,
      source: 'builtin' as const,
      description: 'Reward splash slot. Import matching art to customize this background.',
      unlockThemeId: theme.id,
      unlockHint: theme.unlockHint,
    }));
}

export function getDefaultMainMenuBackground(): MainMenuBackgroundEntry {
  return DEFAULT_ENTRY;
}

export async function loadMainMenuBackgroundEntries(forceRefresh = false): Promise<MainMenuBackgroundEntry[]> {
  if (!forceRefresh && cachedPromise) return cachedPromise;

  cachedPromise = (async () => {
    const rewardSlots = buildRewardBackgroundSlots();
    const entries: MainMenuBackgroundEntry[] = [DEFAULT_ENTRY, ...rewardSlots];

    if (!window.pantheonAssets?.listMainMenuBackgrounds) {
      return entries;
    }

    try {
      const workspaceEntries = await window.pantheonAssets.listMainMenuBackgrounds();
      const normalized = workspaceEntries
        .filter((e) => typeof e?.id === 'string' && typeof e?.url === 'string')
        .map((e) => {
          const name = normalizeWorkspaceName(e.name || e.id);
          const inferred = inferRewardThemeUnlock(name);
          const slotMatch = inferred.themeId
            ? rewardSlots.find((slot) => slot.unlockThemeId === inferred.themeId)
            : null;
          return {
            id: slotMatch?.id ?? e.id,
            name,
            imageUrl: e.url,
            source: 'workspace' as const,
            description: slotMatch
              ? 'Imported reward splash art.'
              : 'Imported splash art.',
            unlockThemeId: inferred.themeId,
            unlockHint: inferred.hint,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      const byId = new Map(entries.map((entry) => [entry.id, entry]));
      for (const imported of normalized) byId.set(imported.id, imported);
      return [...byId.values()];
    } catch {
      return entries;
    }
  })();

  return cachedPromise;
}

export function resolveMainMenuBackground(
  selectedId: string | null | undefined,
  entries: MainMenuBackgroundEntry[],
): MainMenuBackgroundEntry {
  if (!entries.length) return DEFAULT_ENTRY;
  if (!selectedId) return entries.find((e) => e.id === DEFAULT_MAIN_MENU_BACKGROUND_ID) ?? entries[0];
  return entries.find((e) => e.id === selectedId)
    ?? entries.find((e) => e.id === DEFAULT_MAIN_MENU_BACKGROUND_ID)
    ?? entries[0];
}

export function isMainMenuBackgroundUnlocked(entry: MainMenuBackgroundEntry, progress: ProgressState): boolean {
  if (!entry.unlockThemeId) return true;
  return isThemeUnlocked(entry.unlockThemeId, progress);
}
