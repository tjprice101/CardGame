import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { infiniteCards } from '@/data/cards/infiniteCards';

const handPath = join(process.cwd(), 'src/ui/hud/HandDisplay.tsx');
const boardPath = join(process.cwd(), 'src/ui/hud/BoardDisplay.tsx');
const collectionPath = join(process.cwd(), 'src/ui/store/CollectionViewer.tsx');
const deckBuilderPath = join(process.cwd(), 'src/ui/deck/DeckBuilder.tsx');
const previewPaths = [
  'src/ui/store/CollectionCardDetail.tsx',
  'src/ui/store/PackOpeningModal.tsx',
  'src/ui/store/CardPackStore.tsx',
  'src/ui/infinitude/Infinitude.tsx',
  'src/ui/eternitysWake/EternitysWake.tsx',
  'src/ui/eternitysWake/BossResultModal.tsx',
  'src/ui/menus/FractureModal.tsx',
  'src/ui/profile/SignatureCardPickerModal.tsx',
  'src/ui/player/PlayerInformationPage.tsx',
  'src/ui/social/FriendProfileModal.tsx',
];

describe('live card face rendering', () => {
  it('uses the same composed art and shimmer helpers in hand and on board', () => {
    const handSource = readFileSync(handPath, 'utf8');
    const boardSource = readFileSync(boardPath, 'utf8');
    const animationSource = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');

    expect(handSource).toContain("getLiveCardFaceBackgroundStyle(def, deckCard.finish, 'front')");
    expect(boardSource).toContain('getLiveCardFaceBackgroundStyle(mainDef, mainCard.finish, mainCard.faceState)');
    expect(handSource).toContain("getLiveCardShimmerClassName(def, deckCard.finish, 'front')");
    expect(boardSource).toContain('getLiveCardShimmerClassName(mainDef, mainCard.finish, mainCard.faceState)');
    expect(handSource).not.toContain("getLiveCardFaceBackgroundStyle(def, deckCard.finish, 'front', true)");
    expect(handSource).toContain("'hand-card-hover-edge'");
    expect(handSource).not.toContain('hand-card-hover-shimmer');
    expect(handSource).toContain('isHovered && !selected && !isDragging');
    expect(handSource).toContain('Mulligan · Hand (${viewCards.length})');
    expect(handSource).not.toContain('MULLIGAN ? Click cards to swap them out');
    expect(handSource).not.toContain("transform: 'translateY(-16px) scale(1.025)'");
    expect(animationSource).toContain('@keyframes handCardHoverEdgePulse');
    expect(animationSource).toContain('.hand-card-hover-edge::before');
    expect(animationSource).toContain('html.reduced-motion .hand-card-hover-edge');
    expect(animationSource).not.toContain('@keyframes handCardHoverShimmer');
  });

  it('routes board name and rules markup through the shared hidden-band helpers', () => {
    const boardSource = readFileSync(boardPath, 'utf8');

    expect(boardSource).toContain('{isAin && (');
    expect(boardSource).toContain("getCardNameRibbonStyle('boardMini')");
    expect(boardSource).toContain("getCardRulesPanelStyle('boardMini')");
  });

  it('keeps Collection and Deck Builder on the complete shared composition', () => {
    const collectionSource = readFileSync(collectionPath, 'utf8');
    const deckBuilderSource = readFileSync(deckBuilderPath, 'utf8');

    expect(collectionSource).toContain("getLiveCardFaceBackgroundStyle(displayCard, finish, 'front')");
    expect(collectionSource).toContain('getLiveCardShimmerClassName');
    expect(collectionSource).not.toContain('holofoil-menu-card');
    expect(collectionSource).not.toContain('const artUrl = owned > 0 ? getCardBackgroundUrl(card)');

    expect(deckBuilderSource).toContain("getLiveCardFaceBackgroundStyle(def.def, def.finish, 'front')");
    expect(deckBuilderSource).toContain("getLiveCardFaceBackgroundStyle(def, entry.finish, 'front')");
    expect(deckBuilderSource).toContain('getLiveCardShimmerClassName');
    expect(deckBuilderSource).not.toContain('holofoil-menu-card');
    expect(deckBuilderSource).not.toContain('DeferredCardArt');
  });

  it('shows legacy craftable Infinite cards in Collection without registering them as playable', () => {
    const collectionSource = readFileSync(collectionPath, 'utf8');
    const legacyInfinite = infiniteCards.filter(card => !CardRegistry.has(card.definitionId));

    expect(legacyInfinite).toHaveLength(8);
    expect(legacyInfinite.every(card => !CardRegistry.get(card.definitionId))).toBe(true);
    expect(collectionSource).toContain('legacyInfiniteCards');
    expect(collectionSource).toContain('legacyInfinite: true');
    expect(collectionSource).toContain("label: 'Neutrality'");
    expect(collectionSource).toContain('legacyInfiniteEntries.length > 0');
    expect(collectionSource).toContain('Archived Infinite');
  });

  it('keeps every preview surface on the same canonical foil path', () => {
    for (const relativePath of previewPaths) {
      const source = readFileSync(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).toContain('getLiveCardFaceBackgroundStyle');
      expect(source, relativePath).toContain('getLiveCardShimmerClassName');
      expect(source, relativePath).not.toContain('holofoil-menu-card');
      expect(source, relativePath).not.toContain('holofoil-live-card');
    }
  });

  it('keeps the turn screen in a header, playfield, hand, and rail grid', () => {
    const hudSource = readFileSync(join(process.cwd(), 'src/ui/hud/HUD.tsx'), 'utf8');
    const handSource = readFileSync(join(process.cwd(), 'src/ui/hud/HandDisplay.tsx'), 'utf8');
    const styleSource = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    const appSource = readFileSync(join(process.cwd(), 'src/app/App.tsx'), 'utf8');
    const bossSource = readFileSync(join(process.cwd(), 'src/ui/eternitysWake/BossFightArena.tsx'), 'utf8');
    const gardenSource = readFileSync(join(process.cwd(), 'src/ui/garden/GardenDungeonHUD.tsx'), 'utf8');
    const battlegroundSource = readFileSync(join(process.cwd(), 'src/ui/battleground/BattlegroundMatch.tsx'), 'utf8');

    expect(hudSource).toContain('className="turn-screen-layout"');
    expect(hudSource).toContain('className={`turn-screen-playfield');
    expect(hudSource).toContain('className="turn-screen-hand"');
    expect(handSource).toContain("gridTemplateRows: 'auto minmax(0, 1fr)'");
    expect(handSource).toContain("idleShowcaseWrapper: {");
    expect(handSource).toContain("position: 'absolute'");
    expect(handSource).toContain("height: 'min(186px, 100%)'");
    expect(handSource).toContain("aspectRatio: '148 / 204'");
    expect(hudSource).toContain('<div className="turn-screen-rail-scroll">');
    expect(hudSource).toContain('placement="rail"');
    expect(styleSource).toContain("'header header'");
    expect(styleSource).toContain("'playfield rail'");
    expect(styleSource).toContain("'hand rail'");
    expect(appSource).toContain('className="game-scene-root"');
    expect(appSource).not.toContain('RadioNowPlaying nowPlaying={turnNowPlayingEvent}');
    expect(bossSource).toContain("right: 'var(--turn-side-rail-width, 278px)'");
    expect(gardenSource).toContain("right: 'var(--turn-side-rail-width, 278px)'");
    expect(battlegroundSource).toContain("right: 'var(--turn-side-rail-width, 278px)'");
  });

  it('keeps Main Menu Radio audible while the login calendar is open', () => {
    const appSource = readFileSync(join(process.cwd(), 'src/app/App.tsx'), 'utf8');
    const musicSuppression = appSource.match(/const musicSuppressed =([\s\S]*?);/)?.[1] ?? '';

    expect(appSource).toContain("track = 'menu-main'");
    expect(musicSuppression).not.toContain('showDailyReward');
    expect(appSource).toContain("showDailyReward && scene === 'menu' && e.code === 'KeyR'");
    expect(appSource).toContain('setRadioUiAutoHidden(false);');
  });

  it('surfaces current deck stats in the manuscript header', () => {
    const deckBuilderSource = readFileSync(deckBuilderPath, 'utf8');
    const forgeSource = readFileSync(join(process.cwd(), 'src/ui/forge/ForgeOfTranscendence.tsx'), 'utf8');

    expect(deckBuilderSource).toContain('The Deck Manuscript · {deckSetName} deck');
    expect(deckBuilderSource).toContain('Est. 3-Min Damage');
    expect(deckBuilderSource).toContain('label="Main"');
    expect(deckBuilderSource).toContain('label="Extra"');
    expect(deckBuilderSource).toContain('className="deck-builder-left-rail"');
    expect(deckBuilderSource).toContain('className="deck-builder-inspector"');
    expect(deckBuilderSource).toContain('setHoveredCardPreview({ card: def.def, finish: def.finish })');
    expect(deckBuilderSource).toContain('onContextMenu={event => pinCardPreview(event, def.def, def.finish)}');
    expect(deckBuilderSource).toContain('Right-click a card to pin its stats here');
    expect(deckBuilderSource).toContain('Pinned!');
    expect(deckBuilderSource).toContain('{totalForDefinition}/4');
    expect(deckBuilderSource).not.toContain('renderLockControl');
    expect(deckBuilderSource).toContain('deckStats.lightLevelCounts[level]');
    expect(deckBuilderSource).toContain('deckStats.darkLevelCounts[level]');
    expect(deckBuilderSource).toContain('deckStats.levelCounts.map');
    expect(deckBuilderSource).toContain("return 'Neutrality'");
    expect(deckBuilderSource).not.toContain('Card hover tooltip');
    expect(forgeSource).toContain('Before the First Shuffle · The Lore of the Card-born World');
    expect(forgeSource).toContain('every current Causality event boss is defeated');
    expect(forgeSource).toContain('Vol. 1: Before the First Shuffle');
    expect(forgeSource).not.toContain('Beyond All Sets · Vol. 1');
    expect(forgeSource).not.toContain('answers to no set and no master');
    const tutorialSource = readFileSync(join(process.cwd(), 'src/ui/menus/TutorialModal.tsx'), 'utf8');
    const tutorialContentSource = readFileSync(join(process.cwd(), 'src/data/tutorialContent.ts'), 'utf8');
    expect(tutorialSource).toContain('Vol. 1: Before the First Shuffle contains');
    expect(tutorialSource).not.toContain('Vol. 1 subset');
    expect(tutorialContentSource).toContain('The endgame gallery for Transcendent cards.');
    expect(tutorialContentSource).not.toContain('gallery beyond every set');
  });

  it('keeps all main-menu sections visible with fixed Begin Turn and live claim badges', () => {
    const menuSource = readFileSync(join(process.cwd(), 'src/ui/menu/MainMenuHub.tsx'), 'utf8');
    const emblemSource = readFileSync(join(process.cwd(), 'src/ui/components/GameEmblem.tsx'), 'utf8');
    const animationSource = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    const controlsSource = readFileSync(join(process.cwd(), 'src/ui/settings/ControlsSection.tsx'), 'utf8');

    expect(menuSource).toContain('main-menu-progress-grid');
    expect(menuSource).toContain('main-menu-collection-grid');
    expect(menuSource).toContain('main-menu-play-grid');
    expect(menuSource).toContain('main-menu-begin-turn');
    expect(menuSource).toContain('main-menu-reference-hub');
    expect(menuSource).toContain('main-menu-center-stage');
    expect(menuSource).toContain('main-menu-daily-highlights');
    expect(menuSource).toContain('main-menu-resource-zone');
    expect(menuSource).toContain('main-menu-daily-heading');
    expect(menuSource).toContain('main-menu-section-heading">Identity</h2>');
    expect(menuSource).toContain("showCaption={action.id === 'eternitys-wake' && action.disabled}");
    expect(menuSource).toContain('Requires 3 Enigmatic cards');
    expect(menuSource).not.toContain('main-menu-stage-figure');
    expect(menuSource).not.toContain('rgba(75,48,137,0.58)');
    expect(menuSource).toContain('label="Shards" value={shards.toLocaleString()} tone="crimson" theme={uiTheme} onClick={props.onCardStore} showPlus={false}');
    expect(menuSource).not.toContain('has-button-frame');
    expect(menuSource).not.toContain('deckBuilderFrame');
    expect(menuSource).toContain('BEYOND ALL SETS');
    expect(menuSource).toContain('A light with no allegiance.');
    expect(menuSource).not.toContain('beyond every set');
    expect(menuSource).toContain('refreshQuestRotation({');
    expect(menuSource).toContain('claimableQuestCount');
    expect(menuSource).toContain('.filter(quest => !quest.claimed && isQuestComplete(quest)).length');
    expect(menuSource).toContain('badgeFor(claimableQuestCount)');
    expect(menuSource).toContain('claimableAchievementCount');
    expect(menuSource).toContain('claimableEnigmaCount');
    expect(menuSource).toContain('onClick={props.onCardStore}');
    expect(menuSource).toContain('setShowDivineLightReference(true)');
    expect(menuSource).toContain('<GameEmblem id={action.id} size={28} />');
    expect(menuSource).toContain("const playActions = ['garden', 'eternitys-wake']");
    expect(menuSource).toContain('Previous event banner');
    expect(menuSource).toContain('Next event banner');
    expect(menuSource).toContain("['mainMenuCardStore', props.onCardStore]");
    expect(menuSource).toContain("['mainMenuDeckBuilder', props.onDeckBuilder]");
    expect(menuSource).toContain("['mainMenuDailyCalendar', props.onDailyCalendar]");
    expect(menuSource).toContain("['mainMenuChallenges', props.onQuests]");
    expect(menuSource).toContain("['mainMenuBeginTurn', props.onBeginTurn]");
    expect(menuSource).toContain('controls[id] === e.code');
    expect(menuSource).toContain("formatMenuShortcut(controls.mainMenuCardStore)");
    expect(controlsSource).toContain("id: 'mainMenuCardStore'");
    expect(controlsSource).toContain("id: 'mainMenuDeckBuilder'");
    expect(controlsSource).toContain("id: 'mainMenuDailyCalendar'");
    expect(controlsSource).toContain("id: 'mainMenuChallenges'");
    expect(controlsSource).toContain("id: 'mainMenuBeginTurn'");
    expect(menuSource).toContain("window.addEventListener('keydown', onMenuShortcut, true)");
    expect(menuSource).toContain('e.stopImmediatePropagation()');
    expect(menuSource).toContain('EVENT_BANNER_DURATION_MS = 7_500');
    expect(menuSource).toContain('main-menu-event-timer');
    expect(menuSource).toContain('main-menu-event-slide-picks');
    expect(menuSource.match(/className="main-menu-event-timer"/g)?.length ?? 0).toBe(1);
    expect(animationSource).toContain('.main-menu-event-timer { width: 100%; height: 3px; margin-top: 10px; background: var(--menu-surface-muted); }');
    expect(menuSource).toContain('remainingMs + 50');
    expect(menuSource).toContain('setEventSlideStartedAtMs(Date.now())');
    expect(menuSource).toContain('key={eventSlideStartedAtMs}');
    expect(menuSource).toContain('main-menu-quote');
    expect(emblemSource).toContain("case 'daily-calendar':");
    expect(emblemSource).toContain("case 'achievements':");
    expect(menuSource).not.toContain('role="tablist" aria-label="Main menu sections"');
  });

  it('keeps Card Store history tied to live pity and pack-open records', () => {
    const storeSource = readFileSync(join(process.cwd(), 'src/ui/store/CardPackStore.tsx'), 'utf8');

    expect(storeSource).toContain('className="pack-history-view"');
    expect(storeSource).toContain('className="pack-history-summary-grid"');
    expect(storeSource).toContain('const PACK_EPIC_PITY_THRESHOLD = 10;');
    expect(storeSource).toContain('const BOX_LEGENDARY_PITY_MISS_THRESHOLD = 4;');
    expect(storeSource).toContain('After 4 consecutive Boxes without a Legendary, the next Box guarantees one.');
    expect(storeSource).toContain('history.map((entry, idx)');
    expect(storeSource).toContain('entry.rarityCounts[rarity]');
    expect(storeSource).toContain('<time dateTime={new Date(entry.ts).toISOString()}>');
    expect(storeSource).not.toContain('Math.max(0, 3 - n)');
  });

  it('uses the active profile palette for Main Menu and Login Calendar chrome', () => {
    const menuSource = readFileSync(join(process.cwd(), 'src/ui/menu/MainMenuHub.tsx'), 'utf8');
    const calendarSource = readFileSync(join(process.cwd(), 'src/ui/profile/DailyRewardModal.tsx'), 'utf8');
    const animationSource = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');

    expect(menuSource).toContain("['--menu-accent' as any]: uiTheme.accent");
    expect(menuSource).toContain("['--menu-surface' as any]: uiTheme.surface");
    expect(animationSource).toContain('scrollbar-color: var(--menu-border-strong) var(--menu-surface-muted)');
    expect(calendarSource).toContain('useThemeVersion();');
    expect(calendarSource).toContain("['--calendar-accent' as string]: warmTheme.accent");
    expect(calendarSource).toContain("['--calendar-surface' as string]: warmTheme.surface");
    expect(animationSource).toContain('.login-calendar-screen {');
    expect(animationSource).toContain('color: var(--calendar-text);');
    expect(animationSource).toContain('.login-calendar-day.is-today { border-color: var(--calendar-accent);');
    expect(calendarSource).toContain('stroke="var(--calendar-border-strong)"');
  });

  it('keeps full Forge wheel prize names out of narrow slices and in a keyed legend', () => {
    const calendarSource = readFileSync(join(process.cwd(), 'src/ui/profile/DailyRewardModal.tsx'), 'utf8');

    expect(calendarSource).not.toContain('className="login-calendar-legend"');
    expect(calendarSource).toContain('{segment.index}');
    expect(calendarSource).toContain('login-calendar-next login-wheel-prize-row');
    expect(calendarSource).toContain('<strong>{prize.label}</strong>');
    expect(calendarSource).toContain('assets/resource-icons/divine-light.png');
    expect(calendarSource).toContain('assets/resource-icons/aberrated-shards.png');
    expect(calendarSource).toContain('assets/forge/shards-of-transcendence.png');
    expect(calendarSource).not.toContain('wheelLabel(segment.prize)');
  });

  it('keeps Settings previews and board hints aligned with live card systems', () => {
    const settingsSource = readFileSync(join(process.cwd(), 'src/ui/settings/SettingsPanel.tsx'), 'utf8');
    const boardSource = readFileSync(boardPath, 'utf8');

    expect(settingsSource).toContain("CardRegistry.getAll().find(card => card.type === 'Light')");
    expect(settingsSource).not.toContain('OPHANIM');
    expect(settingsSource).not.toContain('Divine Light Shard');
    expect(settingsSource).not.toContain('Draw 2 cards. +800 Divine Light.');
    expect(boardSource).toContain('renderSophChargeBadge');
    expect(boardSource).toContain('Soph Charge ${stacks}');
    expect(boardSource).not.toContain('renderPatienceBadge');
    expect(boardSource).not.toContain('Drop Seraphim');
    expect(boardSource).not.toContain('Drop Cherubim');
  });

  it('uses hover outlines and brightness instead of upward movement', () => {
    const styleSource = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    const menuSource = readFileSync(join(process.cwd(), 'src/ui/menu/MainMenuHub.tsx'), 'utf8');
    const hoverRules = Array.from(styleSource.matchAll(/[^{}]*:hover[^{}]*\{[^}]*\}/g), match => match[0]);
    expect(hoverRules.filter(rule => /transform:\s*translateY\(\s*-/.test(rule))).toEqual([]);
    expect(styleSource).not.toMatch(/:hover[^{}]*\{[^}]*\bscale\s*:/);
    expect(styleSource).toContain('.main-menu-reference-hub .menu-tactile-btn:not(:disabled):hover');
    expect(styleSource).toContain('filter: brightness(1.26) saturate(1.18)');
    expect(menuSource).toContain("btn.style.filter = 'brightness(1.3) saturate(1.24)'");
    for (const relativePath of [
      'src/ui/menu/MainMenuHub.tsx',
      'src/ui/eternitysWake/BossResultModal.tsx',
      'src/ui/profile/SignatureCardPickerModal.tsx',
      'src/ui/store/CollectionViewer.tsx',
    ]) {
      const source = readFileSync(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain("style.transform = 'translateY(-");
    }
  });

  it('keeps the Collection virtual list inside a bounded wheelable flex viewport', () => {
    const collectionSource = readFileSync(collectionPath, 'utf8');
    expect(collectionSource).toContain("flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden'");
    expect(collectionSource).toContain("style={{ height: '100%', minHeight: 0, overscrollBehavior: 'contain', touchAction: 'pan-y' }}");
  });

  it('uses unobstructed shared framed art for compact Collection cards', () => {
    const collectionSource = readFileSync(collectionPath, 'utf8');
    expect(collectionSource).toContain("getLiveCardFaceBackgroundStyle(displayCard, finish, 'front')");
    expect(collectionSource).not.toContain('getCardArtTopBottomBorderOverlayStyleForCard');
    expect(collectionSource).not.toContain('getCardNameRibbonStyle');
    expect(collectionSource).not.toContain('getCardRulesPanelStyle');
  });

  it('uses one shared frame layer and removes separate art-edge overlays', () => {
    const backgroundSource = readFileSync(join(process.cwd(), 'src/ui/cardBackgrounds.ts'), 'utf8');
    expect(backgroundSource).toContain('card-front-frame-splotched-ink.png');
    expect(backgroundSource).toContain("...frontFrameLayers.map(() => 'screen')");
    expect(backgroundSource).toContain("return { display: 'none' };");
    expect(backgroundSource).not.toContain('getCardArtTopBottomBorderOverlayStyleForCard');
  });

  it('resolves title-screen showcase art through the card registry and shared frame', () => {
    const titleSource = readFileSync(join(process.cwd(), 'src/ui/boot/TitleScreen.tsx'), 'utf8');
    for (const definitionId of [
      'light-neutrality-1',
      'enig-neutral-lumen-genesis',
      'ain-soph-aur-neutrality-1',
      'tx-neutral-null-catalyst',
      'tx-neutral-starbound-glimmer',
      'tx-angel-starbound-null-archangel',
    ]) {
      expect(titleSource).toContain(`card('${definitionId}')`);
    }
    expect(titleSource).toContain('getCardBackgroundUrl(definition)');
    expect(titleSource).toContain("backgroundBlendMode: 'screen, normal'");
  });

  it("keeps Eternity's Wake foil animation on the reward card only", () => {
    const source = readFileSync(join(process.cwd(), 'src/ui/eternitysWake/EternitysWake.tsx'), 'utf8');
    expect(source).toContain("className={getLiveCardShimmerClassName(rewardDef, 'normal', 'front')}");
    expect(source).toContain('backgroundImage: `linear-gradient(180deg, rgba(10,4,16,0.08)');
    expect(source).not.toContain("<div className={rewardDef ? getLiveCardShimmerClassName(rewardDef, 'normal', 'front') : undefined} style={{");
  });
});