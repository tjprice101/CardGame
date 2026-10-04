import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultGameState, useStore } from '@/state/store';
import { intensityBaseCards, intensityEternalCards, intensityInfiniteCards, paleventHerald } from '@/data/cards/intensityCards';
import { ABILITY_DEFINITIONS, meetsAbilityOwnershipGate } from '@/data/abilities/abilityDefinitions';
import { AVATARS } from '@/data/profile/avatars';
import { TITLE_BADGE_BY_ID, bossClearTitleId, infiniteCardTitleId } from '@/data/profile/titleBadges';
import { INTENSITY_PROFILE_REWARDS } from '@/data/profile/intensityProfileRewards';
import { CUSTOM_MAIN_MENU_BACKGROUND_REWARDS, isCustomBackgroundRewardUnlocked } from '@/data/profile/customMainMenuBackgrounds';
import { isMainMenuBackgroundAvailable, loadMainMenuBackgroundEntries, resolveMainMenuBackground, DEFAULT_MAIN_MENU_BACKGROUND_ID } from '@/data/profile/mainMenuBackgrounds';
import { captureIntensityProgress, mergeIntensityProgress, INTENSITY_PROGRESS_KEYS } from '@/systems/progression/intensityProgress';
import { listAchievements } from '@/systems/progression/achievements';
import type { GameState } from '@/types/game';

function fresh(): GameState {
  const state = structuredClone(defaultGameState);
  state.turn.phase = 'playing';
  state.turn.spectrumLevel = 5;
  return state;
}

describe('Intensity accomplishments and reward cosmetics', () => {
  beforeEach(() => useStore.setState(fresh()));

  it('requires the exact 19/5/5 rosters and permanently honors previously earned splash rewards', async () => {
    const rewards = CUSTOM_MAIN_MENU_BACKGROUND_REWARDS.filter(reward => reward.artFileStem.startsWith('intensity-'));
    expect(rewards).toHaveLength(3);
    const groups = [intensityBaseCards, intensityEternalCards, intensityInfiniteCards];
    for (let index = 0; index < groups.length; index++) {
      const progress = fresh().progress;
      const collection = index === 2 ? progress.infiniteCollection : progress.collection;
      expect(isCustomBackgroundRewardUnlocked(rewards[index], progress)).toBe(false);
      for (const card of groups[index].slice(1)) collection[card.definitionId] = 50;
      expect(isCustomBackgroundRewardUnlocked(rewards[index], progress)).toBe(false);
      collection[groups[index][0].definitionId] = 0;
      expect(isCustomBackgroundRewardUnlocked(rewards[index], progress)).toBe(false);
      collection[groups[index][0].definitionId] = 1;
      expect(isCustomBackgroundRewardUnlocked(rewards[index], progress)).toBe(true);
      progress.achievementUnlocks = { [rewards[index].achievementId]: true };
      for (const card of groups[index]) delete collection[card.definitionId];
      expect(isCustomBackgroundRewardUnlocked(rewards[index], progress)).toBe(true);
      const achievement = listAchievements(progress).find(entry => entry.id === rewards[index].achievementId)!;
      expect(achievement.shardReward).toBe(0);
      expect(achievement.divineLightReward).toBe(0);
      expect(achievement.backgroundReward?.rarity).toBe(rewards[index].rarity);
    }
    const entries = await loadMainMenuBackgroundEntries(true);
    for (const reward of rewards) {
      const entry = entries.find(candidate => candidate.id === reward.id)!;
      const progress = fresh().progress;
      progress.achievementUnlocks = { [reward.achievementId]: true };
      if (!isMainMenuBackgroundAvailable(entry)) {
        expect(entry.imageUrl).toBe('');
        expect(resolveMainMenuBackground(entry.id, entries, progress).id).toBe(DEFAULT_MAIN_MENU_BACKGROUND_ID);
      }
    }
  });

  it('gates each of five portraits and unique boss titles on its own boss clear only', () => {
    expect(INTENSITY_PROFILE_REWARDS).toHaveLength(5);
    const names = new Set<string>();
    for (const reward of INTENSITY_PROFILE_REWARDS) {
      const avatar = AVATARS.find(entry => entry.id === reward.id)!;
      const achievement = TITLE_BADGE_BY_ID[reward.achievementId];
      const title = TITLE_BADGE_BY_ID[bossClearTitleId(reward.bossId)];
      expect(title.text).not.toMatch(/^Slayer of/);
      names.add(title.text);
      const progress = fresh().progress;
      progress.bossClearCounts['boss-hollow-king'] = 100;
      expect(avatar.isUnlocked(progress)).toBe(false);
      expect(achievement.isUnlocked(progress)).toBe(false);
      progress.bossClearCounts[reward.bossId] = 1;
      expect(avatar.isUnlocked(progress)).toBe(true);
      expect(achievement.isUnlocked(progress)).toBe(true);
      if (!avatar.imageUrl) expect(avatar.description).toContain('artwork pending');
    }
    expect(names.size).toBe(5);
    for (const card of intensityInfiniteCards) expect(TITLE_BADGE_BY_ID[infiniteCardTitleId(card.definitionId)].text).not.toMatch(/^Wielder of/);
  });

  it('provides all eight cosmetic prompts with exact filenames and the approved orange-red ink style', () => {
    const doc = readFileSync(join(process.cwd(), '..', 'Midjourney Art', 'Intensity Set Prompts.md'), 'utf8');
    const newSection = doc.split('## Intensity completion splash rewards')[1];
    const prompts = [...newSection.matchAll(/```text\r?\n([\s\S]*?)\r?\n```/g)].map(match => match[1]);
    expect(prompts).toHaveLength(8);
    expect(prompts.filter(prompt => prompt.includes('--ar 16:9'))).toHaveLength(3);
    expect(prompts.filter(prompt => prompt.includes('--ar 1:1'))).toHaveLength(5);
    for (const prompt of prompts) {
      expect(prompt).toContain('Chinese mythological manuscript art');
      expect(prompt).toContain('heavy black ink splotches');
      expect(prompt).toContain('hot orange and red flames');
      expect(prompt).toContain('white-hot highlights');
      expect(prompt).toContain('--niji 6 --stylize 900');
      expect(prompt).not.toMatch(/\bgold(?:en)?\b/i);
    }
    for (const reward of INTENSITY_PROFILE_REWARDS) expect(doc).toContain(reward.file);
    for (const reward of CUSTOM_MAIN_MENU_BACKGROUND_REWARDS.filter(r => r.rarity !== 'Transcendent')) expect(doc).toContain(`${reward.artFileStem}.png`);
  });

  it('tracks generation and card plays once per action, retains lifetime values at end turn, and ignores dry gains', () => {
    useStore.setState(state => ({ deck: { ...state.deck, hand: [
      { instanceId: 'first', definitionId: paleventHerald.definitionId, finish: 'normal' },
      { instanceId: 'second', definitionId: paleventHerald.definitionId, finish: 'normal' },
    ] } }));
    useStore.getState().playCard('first', 'soph');
    expect(captureIntensityProgress(useStore.getState().progress)).toMatchObject({
      intensityInfernoGenerated: 2, intensityBestTurnInferno: 2, intensityCardsPlayed: 1,
    });
    useStore.getState().playCard('second', 'soph');
    expect(useStore.getState().progress.intensityInfernoGenerated).toBe(2);
    expect(useStore.getState().progress.intensityCardsPlayed).toBe(2);
    useStore.getState().endTurn();
    expect(useStore.getState().turn.intensityInfernoGainedThisTurn).toBe(0);
    expect(useStore.getState().progress.intensityInfernoGenerated).toBe(2);
    expect(useStore.getState().progress.intensityBestTurnInferno).toBe(2);
  });

  it('records successful ability gains and spending, not rejected or cooldown-blocked attempts', () => {
    const state = fresh();
    state.turn.limitlessLightStacks = 10;
    state.progress.collection = Object.fromEntries(intensityBaseCards.map(card => [card.definitionId, 1]));
    state.progress.ownedAbilities = { 'intensity-kindle-the-depths': true, 'intensity-bank-the-flame': true };
    state.progress.savedDecks[0].abilityLoadout = { 1: 'intensity-kindle-the-depths', 2: 'intensity-bank-the-flame' };
    useStore.setState(state);
    useStore.getState().activateAbility(2);
    expect(useStore.getState().progress.intensityAbilityActivations).toBe(0);
    useStore.getState().activateAbility(1);
    expect(useStore.getState().progress.intensityInfernoGenerated).toBe(4);
    expect(useStore.getState().progress.intensityAbilityActivations).toBe(1);
    useStore.getState().activateAbility(1);
    expect(useStore.getState().progress.intensityInfernoGenerated).toBe(4);
    useStore.setState(s => ({ turn: { ...s.turn, limitlessInfernoStacks: 6 } }));
    useStore.getState().activateAbility(2);
    expect(useStore.getState().progress.intensityInfernoSpent).toBe(6);
    expect(useStore.getState().progress.intensityAbilityActivations).toBe(2);
  });

  it('counts a Crater expedition once only when its final encounter is cleared', () => {
    const state = fresh();
    state.gardenDungeon = { ...state.gardenDungeon, phase: 'active', dungeonId: 'crater-of-flames', encounterIndex: 0, encounterHp: 0 };
    useStore.setState(state);
    expect(useStore.getState().resolveGardenEncounter()).toBe(true);
    expect(useStore.getState().progress.intensityCraterClears).toBe(0);
    useStore.setState(s => ({ gardenDungeon: { ...s.gardenDungeon, phase: 'active', encounterIndex: 3, encounterHp: 0 } }));
    expect(useStore.getState().resolveGardenEncounter()).toBe(true);
    expect(useStore.getState().progress.intensityCraterClears).toBe(1);
    expect(useStore.getState().resolveGardenEncounter()).toBe(false);
    expect(useStore.getState().progress.intensityCraterClears).toBe(1);
  });

  it('normalizes absent/malformed lifetime fields, preserves valid records, and merges snapshots without double counting', () => {
    const state = fresh();
    for (const key of INTENSITY_PROGRESS_KEYS) delete state.progress[key];
    state.progress.cardPlayCounts = { [paleventHerald.definitionId]: 12, 'light-neutrality-1': 100 };
    useStore.getState().loadState(state);
    expect(useStore.getState().progress.intensityCardsPlayed).toBe(12);
    expect(useStore.getState().progress.intensityInfernoGenerated).toBe(0);
    const current = fresh().progress;
    current.intensityInfernoGenerated = 100;
    current.intensityInfernoSpent = 40;
    const snapshot = captureIntensityProgress(current);
    const restored = fresh().progress;
    restored.intensityInfernoSpent = 50;
    mergeIntensityProgress(restored, snapshot);
    mergeIntensityProgress(restored, snapshot);
    expect(restored.intensityInfernoGenerated).toBe(100);
    expect(restored.intensityInfernoSpent).toBe(50);
    const malformed = structuredClone(state);
    malformed.progress.intensityInfernoGenerated = Number.NaN;
    malformed.progress.intensityInfernoSpent = -1;
    malformed.progress.intensityBestTurnInferno = 50.9;
    useStore.getState().loadState(malformed);
    expect(useStore.getState().progress.intensityInfernoGenerated).toBe(0);
    expect(useStore.getState().progress.intensityInfernoSpent).toBe(0);
    expect(useStore.getState().progress.intensityBestTurnInferno).toBe(50);
  });

  it('uses the precise threshold for each new gameplay accomplishment', () => {
    const thresholds = [
      ['title-intensity-first-spark', 'intensityCardsPlayed', 1],
      ['title-intensity-ashwalker', 'intensityCardsPlayed', 100],
      ['title-intensity-volcanic-script', 'intensityCardsPlayed', 1_000],
      ['title-intensity-kindler', 'intensityInfernoGenerated', 100],
      ['title-intensity-unquenchable', 'intensityInfernoGenerated', 10_000],
      ['title-intensity-eruption', 'intensityInfernoSpent', 100],
      ['title-intensity-white-fire', 'intensityInfernoSpent', 1_000],
      ['title-intensity-pressure', 'intensityBestTurnInferno', 50],
      ['title-intensity-crater', 'intensityCraterClears', 1],
      ['title-intensity-crater-master', 'intensityCraterClears', 25],
      ['title-intensity-ability-master', 'intensityAbilityActivations', 100],
    ] as const;
    for (const [id, key, threshold] of thresholds) {
      const progress = fresh().progress;
      progress[key] = threshold - 1;
      expect(TITLE_BADGE_BY_ID[id].isUnlocked(progress), id).toBe(false);
      progress[key] = threshold;
      expect(TITLE_BADGE_BY_ID[id].isUnlocked(progress), id).toBe(true);
    }
    const progress = fresh().progress;
    const all = ABILITY_DEFINITIONS.filter(ability => ability.setId === 'Intensity');
    progress.ownedAbilities = Object.fromEntries(all.map(ability => [ability.id, true]));
    expect(TITLE_BADGE_BY_ID['title-intensity-foundation'].isUnlocked(progress)).toBe(true);
    expect(TITLE_BADGE_BY_ID['title-intensity-arsenal'].isUnlocked(progress)).toBe(true);
    delete progress.ownedAbilities['intensity-kindle-the-depths'];
    expect(TITLE_BADGE_BY_ID['title-intensity-foundation'].isUnlocked(progress)).toBe(false);
    expect(TITLE_BADGE_BY_ID['title-intensity-arsenal'].isUnlocked(progress)).toBe(false);
  });

  it('preserves accomplishments through an actual boss snapshot restoration on forfeit', () => {
    const state = fresh();
    const saved = fresh();
    state.progress.intensityInfernoGenerated = 123;
    state.progress.intensityInfernoSpent = 45;
    state.progress.intensityCardsPlayed = 10;
    state.bossFight = { ...state.bossFight, mode: 'active', activeBossId: 'boss-intensity-drowned-cathedral', savedGameState: saved };
    useStore.setState(state);
    useStore.getState().forfeitBossFight();
    expect(useStore.getState().bossFight.mode).toBe('defeat');
    expect(useStore.getState().progress.intensityInfernoGenerated).toBe(123);
    expect(useStore.getState().progress.intensityInfernoSpent).toBe(45);
    expect(useStore.getState().progress.intensityCardsPlayed).toBe(10);
  });

  it('does not let Causality ownership unlock Neutrality premium abilities or its Infinite sigil', () => {
    const infinite = ABILITY_DEFINITIONS.find(a => a.id === 'whiteout-domain')!;
    const eternal = ABILITY_DEFINITIONS.find(a => a.id === 'null-horizon')!;
    expect(meetsAbilityOwnershipGate(infinite, {}, { 'inf-causality-origin-script': 1 })).toBe(false);
    expect(meetsAbilityOwnershipGate(eternal, { 'btei-causality-first-cause': 1 }, {})).toBe(false);
    expect(meetsAbilityOwnershipGate(infinite, {}, { 'inf-null-apex': 1 })).toBe(true);
    expect(meetsAbilityOwnershipGate(eternal, { 'btei-voids-reaping': 1 }, {})).toBe(true);
  });
});
