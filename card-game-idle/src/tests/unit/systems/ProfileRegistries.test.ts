import { describe, it, expect } from 'vitest';
import {
  AVATARS,
  AVATAR_BY_ID,
  DEFAULT_AVATAR_ID,
  isAvatarUnlocked,
  resolveAvatar,
} from '@/data/profile/avatars';
import {
  TITLE_BADGES,
  TITLE_BADGE_BY_ID,
  isTitleUnlocked,
  resolveTitleBadge,
  bossClearTitleId,
  infiniteCardTitleId,
  setCompletionTitleId,
} from '@/data/profile/titleBadges';
import {
  UI_THEMES,
  UI_THEME_BY_ID,
  DEFAULT_UI_THEME_ID,
  isThemeUnlocked,
  resolveThemeId,
  applyEffectiveTheme,
} from '@/data/profile/uiThemes';
import { warmTheme, DEFAULT_WARM_PALETTE, resetUiPalette } from '@/ui/theme';
import type { ProgressState } from '@/types/game';

function baseProgress(overrides: Partial<ProgressState> = {}): ProgressState {
  return {
    oblivion: 0,
    aberratedShards: 0,
    totalCardsPlayed: 0,
    collection: {},
    holoCollection: {},
    infiniteCollection: {},
    favoriteCollection: {},
    bossClearCounts: {},
    pityCounters: {},
    savedDecks: [],
    activeDeckId: null,
    profile: { name: 'Wanderer', avatarId: DEFAULT_AVATAR_ID, titleId: null, uiThemeId: DEFAULT_UI_THEME_ID, customUiTheme: null },
    dailyLogin: { lastClaimedDayIndex: -1, streak: 0, totalClaims: 0 },
    ...overrides,
  };
}

describe('avatar registry', () => {
  it('registers each avatar in the id lookup map', () => {
    for (const a of AVATARS) {
      expect(AVATAR_BY_ID[a.id]).toBe(a);
    }
  });

  it('always unlocks the default acolyte avatar', () => {
    expect(isAvatarUnlocked(DEFAULT_AVATAR_ID, baseProgress())).toBe(true);
  });

  it('locks higher-tier avatars on a fresh save', () => {
    const p = baseProgress();
    expect(isAvatarUnlocked('avatar-eternal', p)).toBe(false);
    expect(isAvatarUnlocked('avatar-infinite', p)).toBe(false);
  });

  it('unlocks Eternal at 1,000,000 oblivion', () => {
    const p = baseProgress({ oblivion: 1_000_000 });
    expect(isAvatarUnlocked('avatar-eternal', p)).toBe(true);
    expect(isAvatarUnlocked('avatar-oblivion-touched', p)).toBe(true);
  });

  it('unlocks Boss Slayer once five distinct bosses are cleared', () => {
    const p = baseProgress({
      bossClearCounts: { a: 1, b: 1, c: 1, d: 1, e: 1 },
    });
    expect(isAvatarUnlocked('avatar-boss-slayer', p)).toBe(true);
    expect(isAvatarUnlocked('avatar-eternal-conqueror', p)).toBe(false);
  });

  it('resolveAvatar returns the requested avatar when unlocked', () => {
    const p = baseProgress({ oblivion: 1_000_000 });
    expect(resolveAvatar('avatar-eternal', p).id).toBe('avatar-eternal');
  });

  it('resolveAvatar falls back to default when locked or unknown', () => {
    const p = baseProgress();
    expect(resolveAvatar('avatar-eternal', p).id).toBe(DEFAULT_AVATAR_ID);
    expect(resolveAvatar('avatar-does-not-exist', p).id).toBe(DEFAULT_AVATAR_ID);
  });
});

describe('title badge registry', () => {
  it('registers each title in the id lookup map', () => {
    for (const t of TITLE_BADGES) {
      expect(TITLE_BADGE_BY_ID[t.id]).toBe(t);
    }
  });

  it('grants the newborn title from the start', () => {
    expect(isTitleUnlocked('title-newborn', baseProgress())).toBe(true);
  });

  it('locks higher-tier titles initially', () => {
    expect(isTitleUnlocked('title-of-the-eternal', baseProgress())).toBe(false);
  });

  it('resolveTitleBadge returns null for null/locked/unknown ids', () => {
    const p = baseProgress();
    expect(resolveTitleBadge(null, p)).toBeNull();
    expect(resolveTitleBadge('title-of-the-eternal', p)).toBeNull();
    expect(resolveTitleBadge('title-does-not-exist', p)).toBeNull();
  });

  it('resolveTitleBadge returns the title when unlocked', () => {
    const p = baseProgress();
    const badge = resolveTitleBadge('title-newborn', p);
    expect(badge).not.toBeNull();
    expect(badge!.id).toBe('title-newborn');
  });
});

describe('dynamic title generation', () => {
  it('mints a boss-clear title for the requested boss only when that boss is cleared', () => {
    const bossTitle = TITLE_BADGES.find(t => t.group === 'boss');
    expect(bossTitle).toBeTruthy();
    const rawBossId = bossTitle!.id.replace(/^title-bossclear-/, '');
    expect(isTitleUnlocked(bossTitle!.id, baseProgress())).toBe(false);
    expect(isTitleUnlocked(bossTitle!.id, baseProgress({ bossClearCounts: { [rawBossId]: 1 } }))).toBe(true);
  });

  it('mints an infinite-card title that unlocks when the card lands in the infiniteCollection', () => {
    const infTitle = TITLE_BADGES.find(t => t.group === 'infinite');
    expect(infTitle).toBeTruthy();
    const cardId = infTitle!.id.replace(/^title-infinite-/, '');
    expect(isTitleUnlocked(infTitle!.id, baseProgress())).toBe(false);
    expect(isTitleUnlocked(infTitle!.id, baseProgress({ infiniteCollection: { [cardId]: 1 } }))).toBe(true);
  });

  it('provides id helpers that round-trip', () => {
    expect(bossClearTitleId('boss-eternal')).toBe('title-bossclear-boss-eternal');
    expect(infiniteCardTitleId('inf-card-1')).toBe('title-infinite-inf-card-1');
    expect(setCompletionTitleId('Thornbound Plains')).toBe('title-set-thornbound-plains');
  });

  it('exposes the new four groups exhaustively', () => {
    const groups = new Set(TITLE_BADGES.map(t => t.group));
    expect(groups.has('milestone')).toBe(true);
    expect(groups.has('boss')).toBe(true);
    expect(groups.has('infinite')).toBe(true);
    expect(groups.has('set')).toBe(true);
  });

  it('uses correct title-case grammar for the static milestones', () => {
    expect(TITLE_BADGE_BY_ID['title-newborn']!.text).toBe('The Newborn');
    expect(TITLE_BADGE_BY_ID['title-of-the-eternal']!.text).toBe('Of the Eternal');
  });
});

describe('ui theme registry', () => {
  it('registers each theme in the lookup map', () => {
    for (const t of UI_THEMES) {
      expect(UI_THEME_BY_ID[t.id]).toBe(t);
    }
  });

  it('always unlocks the default theme', () => {
    expect(isThemeUnlocked(DEFAULT_UI_THEME_ID, baseProgress())).toBe(true);
  });

  it('resolveThemeId falls back to default for locked or unknown ids', () => {
    const locked = UI_THEMES.find(t => !t.isUnlocked(baseProgress()));
    expect(resolveThemeId('does-not-exist', baseProgress())).toBe(DEFAULT_UI_THEME_ID);
    if (locked) {
      expect(resolveThemeId(locked.id, baseProgress())).toBe(DEFAULT_UI_THEME_ID);
    }
  });

  it('applyEffectiveTheme overlays customTheme on top of the resolved theme', () => {
    resetUiPalette();
    applyEffectiveTheme(DEFAULT_UI_THEME_ID, { accent: '#abcdef' }, baseProgress());
    expect(warmTheme.accent.toLowerCase()).toBe('#abcdef');
    // Other keys untouched.
    expect(warmTheme.text).toBe(DEFAULT_WARM_PALETTE.text);
    resetUiPalette();
    expect(warmTheme.accent).toBe(DEFAULT_WARM_PALETTE.accent);
  });
});
