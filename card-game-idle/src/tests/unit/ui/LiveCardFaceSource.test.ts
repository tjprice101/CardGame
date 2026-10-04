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
    expect(collectionSource).toContain('getCardSet(entry.card.definitionId) === setLabel');
    expect(collectionSource).toContain('infiniteSections.length > 0');
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
    expect(menuSource).toContain('captionColor: theme.accentDeep');
    expect(animationSource).toContain('.main-menu-reference-hub .main-menu-begin-turn > span { color: var(--menu-button-text);');
    expect(animationSource).toContain('.main-menu-reference-hub .main-menu-begin-turn > strong { color: var(--menu-button-text);');
    expect(animationSource).toContain('.main-menu-reference-hub .main-menu-begin-turn > small { color: var(--menu-button-text);');
    expect(animationSource).not.toMatch(/(?:^|[;{\s])color: transparent !important;/);
    expect(menuSource).not.toContain("textShadow: '0 2px 12px rgba(0,0,0,0.6)'");
    expect(menuSource).toContain('main-menu-reference-hub');
    expect(menuSource).not.toContain('main-menu-center-stage');
    expect(menuSource).toContain('main-menu-daily-highlights');
    expect(menuSource).toContain('main-menu-resource-zone');
    expect(menuSource).toContain('main-menu-daily-heading');
    expect(menuSource).toContain('main-menu-section-heading">Identity</h2>');
    expect(menuSource).toContain("showCaption={action.id === 'eternitys-wake' && action.disabled}");
    expect(menuSource).toContain('Requires 3 Enigmatic cards');
    expect(menuSource).not.toContain('main-menu-stage-figure');
    expect(menuSource).not.toContain('main-menu-stage-orbit');
    expect(menuSource).not.toContain('main-menu-stage-sigil');
    expect(menuSource).not.toContain('main-menu-stage-card');
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

  it('darkens disabled actions and shows monochrome locks with requirements for gated menu features', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    const source = readFileSync(join(process.cwd(), 'src/ui/menu/MainMenuHub.tsx'), 'utf8');
    const effect = css.match(/button:disabled::after \{([^}]+)\}/)?.[1];
    expect(effect).toBeDefined();
    expect(effect).toContain('background: rgba(0,0,0,0.18);');
    expect(effect).toContain('pointer-events: none;');
    expect(effect).not.toContain('blur');
    expect(effect).not.toContain('animation');
    expect(source).toContain('function LockedFeatureOverlay');
    expect(source).toContain('className="main-menu-lock-condition">{condition}');
    expect(source.match(/<LockedFeatureOverlay/g)).toHaveLength(5);
    expect(css).toContain('button:disabled:has(> .main-menu-lock-overlay) { opacity: 0.78; }');
    expect(css).toContain('.main-menu-lock-heading > strong');
    expect(css).toContain('background: linear-gradient(135deg, var(--profile-surface-strong, #1a1a1a), var(--profile-surface-muted, #070707));');
  });

  it('extends synchronized gradients to bold button labels across the themed screens', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    expect(css).toContain('button:not(:disabled) .ui-button-title.ui-button-title-on-light');
    expect(css).toContain('background-image: var(--profile-button-title-gradient);');
    for (const file of [
      'src/ui/menu/MainMenuHub.tsx',
      'src/ui/deck/DeckBuilder.tsx',
      'src/ui/store/CardPackStore.tsx',
      'src/ui/menus/TutorialModal.tsx',
      'src/ui/menus/EnigmaModal.tsx',
      'src/ui/menus/QuestsModal.tsx',
      'src/ui/menus/AchievementsModal.tsx',
    ]) {
      expect(readFileSync(join(process.cwd(), file), 'utf8')).toContain('ui-button-title');
    }
  });

  it('limits legibility shadows to text over artwork, not ordinary text or gradient controls', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    expect(css).toContain('--ui-text-legibility-shadow: -0.6px 0 #000');
    expect(css).toContain('text-shadow: var(--ui-text-legibility-shadow);');
    expect(css).not.toMatch(/#root\s*\{[^}]*text-shadow/);
    expect(css).not.toContain('text-shadow: inherit;');
    const lightButtonRule = css.match(/html\[data-profile-title-gradient\] button:not\(:disabled\) \.ui-button-title\.ui-button-title-on-light:not\([^{}]+\) \{([^}]+)\}/)?.[1];
    expect(lightButtonRule).toContain('background-image: var(--profile-button-title-gradient);');
    expect(lightButtonRule).toContain('text-shadow: none !important;');
    expect(lightButtonRule).toContain('filter: none;');
    const gradientRules = [...css.matchAll(/([^{}]+)\{([^{}]*-webkit-text-fill-color: transparent;[^{}]*)\}/g)]
      .filter(match => match[1].includes('html[data-profile-title-gradient]'));
    expect(gradientRules).toHaveLength(4);
    for (const rule of gradientRules) {
      expect(rule[2]).toContain('text-shadow: none !important;');
      expect(rule[2]).not.toContain('drop-shadow');
    }
    const authSource = readFileSync(join(process.cwd(), 'src/ui/social/AuthPanel.tsx'), 'utf8');
    expect(authSource).toContain('buttonText: `var(--profile-button-text, ${warmTheme.accentDeep})`');
  });

  it('wires saved light/dark button modes independently of the profile rotation', () => {
    const settings = readFileSync(join(process.cwd(), 'src/ui/settings/SettingsPanel.tsx'), 'utf8');
    const app = readFileSync(join(process.cwd(), 'src/app/App.tsx'), 'utf8');
    const css = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    expect(settings).toContain('label="Light Mode or Dark Mode"');
    expect(settings).toContain('Save Settings to apply.');
    expect(app).toContain("dataset.buttonColorMode = settings.buttonColorMode === 'light' ? 'light' : 'dark'");
    expect(css).toContain('--button-mode-title-gradient: var(--profile-title-gradient);');
    expect(css).toContain('--button-mode-title-gradient: var(--profile-button-title-gradient);');
    expect(css).toContain('html[data-button-color-mode][data-profile-button-gradient]');
    expect(css).toContain('--button-mode-gradient: var(--profile-button-surface-gradient);');
    expect(css).toContain('[style*="url("],');
    expect(css).toContain('--button-mode-title-gradient: linear-gradient(110deg, #ffffff 0%, #dddddd 54%, #ffffff 100%);');
    expect(css).toContain('html[data-button-color-mode] button:not(:disabled) :is(');
    expect(css).toContain(':not(button, button *, [data-ui-special-text], [data-ui-special-text] *)');
    for (const file of ['EternitysWake.tsx', 'BossCodex.tsx']) {
      expect(readFileSync(join(process.cwd(), 'src/ui/eternitysWake', file), 'utf8')).toContain('data-ui-special-text');
    }
  });

  it('preserves transparent controls and artwork contrast instead of painting rectangular button blocks', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    const modeSurfaceRules = [...css.matchAll(/html\[data-button-color-mode\] button:where\(([^{}]+)\):not\(:where\(([^{}]+)\)\) \{([^{}]+)\}/g)]
      .filter(rule => rule[3].includes('background-image: var(--button-mode-gradient)'));
    expect(modeSurfaceRules).toHaveLength(1);
    for (const rule of modeSurfaceRules) {
      expect(rule[1]).toContain('[style*="gradient("]');
      expect(rule[2]).toContain('[style*="background: transparent"]');
      expect(rule[2]).toContain('[style*="background: none"]');
      expect(rule[2]).toContain('.main-menu-progress-tile');
      expect(rule[2]).toContain('.main-menu-event-card');
      expect(rule[2]).toContain('.attack-sequence-star');
      expect(rule[3]).not.toContain('border-color:');
    }
    expect(css).toMatch(/\.main-menu-progress-tile \{\s*background: transparent !important;/);
    expect(css).toMatch(/\.main-menu-progress-label \{\s*color: #ffffff !important;/);
    expect(css).toContain('background-image: var(--profile-artwork-title-gradient) !important;');
    expect(css).toContain('.main-menu-status-zone small,');
  });

  it('keeps artwork headings light and achievement text undimmed in light mode', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    expect(css).toContain('.ui-artwork-header [data-ui-artwork-copy]');
    expect(css).toContain('background-image: var(--profile-artwork-title-gradient) !important;');
    for (const file of [
      'src/ui/menus/AchievementsModal.tsx', 'src/ui/menus/QuestsModal.tsx',
      'src/ui/deck/DeckViewer.tsx', 'src/ui/store/CollectionViewer.tsx',
      'src/ui/store/CardPackStore.tsx', 'src/ui/menus/FractureModal.tsx',
    ]) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      expect(source).toContain('ui-artwork-header');
      expect(source).toContain('data-ui-artwork-copy');
    }
    const achievements = readFileSync(join(process.cwd(), 'src/ui/menus/AchievementsModal.tsx'), 'utf8');
    expect(achievements).not.toContain('opacity: !a.unlocked');
    expect(achievements).toContain("position: 'relative', display: 'flex', flexDirection: 'column', flex: 1");
    expect(achievements).toContain('useThemeVersion();');
  });

  it('separates filled-pill text from surface captions and keeps semantic labels live', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    expect(css).toMatch(/\.login-calendar-tabs button\.is-active \{[^}]*color: var\(--profile-accent-text\)/);
    expect(css).toMatch(/\.celestial-store-screen \.celestial-store-tag \{[^}]*color: var\(--profile-accent-text\)/);
    expect(css).toMatch(/\.celestial-store-screen \.celestial-store-tag\.is-event \{[^}]*color: var\(--profile-accent-soft-text\)/);
    const mastery = readFileSync(join(process.cwd(), 'src/ui/menus/CardMasteryModal.tsx'), 'utf8');
    expect(mastery).toContain('useThemeVersion();');
    expect(mastery).toContain('getReadableUiColor(tierColor(tier), warmTheme.surfaceStrong)');
    expect(mastery).not.toContain('color: P.accentDeep, fontFamily');
    expect(mastery).not.toContain('opacity: claimed ?');
    const abilities = readFileSync(join(process.cwd(), 'src/ui/store/AbilityMaterialization.tsx'), 'utf8');
    expect(abilities).toContain('useThemeVersion();');
    expect(abilities).toContain('getReadableUiColor(tierColor, warmTheme.surfaceStrong)');
    for (const file of ['ChatWindow.tsx', 'SendDeckPicker.tsx', 'SendGiftModal.tsx']) {
      const source = readFileSync(join(process.cwd(), 'src/ui/social', file), 'utf8');
      expect(source).toContain("background: 'var(--profile-surface-strong)'");
      expect(source).toContain("color: 'var(--profile-text-muted)'");
    }
  });

  it('anchors the Resources heading to the resource group while preserving the mobile row', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    expect(css).toMatch(/\.main-menu-resource-zone \{[^}]*width: max-content;[^}]*max-width: 100%;[^}]*justify-self: end;/);
    expect(css).toContain('.main-menu-resource-zone { width: 100%; justify-self: stretch; }');
    expect(css).toContain('.main-menu-resource-zone > .main-menu-section-heading { width: 100%;');
  });

  it('keeps pack artwork visible and its copy light in both appearance modes', () => {
    const store = readFileSync(join(process.cwd(), 'src/ui/store/CardPackStore.tsx'), 'utf8');
    const css = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    expect(store).toContain('className="celestial-store-pack-banner ui-artwork-header"');
    expect(store).toContain('rgba(8,7,14,0.38), rgba(12,10,20,0.12) 68%, rgba(12,10,20,0.04)');
    expect(store).toContain('<p data-ui-artwork-copy>{pack.description}</p>');
    expect(css).toMatch(/\.celestial-store-pack-banner::after \{[^}]*rgba\(8,7,12,\.28\)/);
    expect(store).not.toContain('THE CELESTIAL ARCHIVE');
    expect(store).toContain('ui-artwork-header card-store-header');
    expect(store).toContain("background: active ? 'var(--profile-surface-strong)' : 'var(--profile-surface-muted)'");
  });

  it('keeps profile, inventory, deck captions, and pack headings on matching surface roles', () => {
    const profile = readFileSync(join(process.cwd(), 'src/ui/player/PlayerInformationPage.tsx'), 'utf8');
    expect(profile).toContain("background: active ? 'var(--profile-surface-strong)' : 'var(--profile-surface)'");
    expect(profile).not.toContain('opacity: unlocked ? 1 : 0.52');
    expect(profile).not.toContain('opacity: unlocked ? 1 : 0.62');
    const legacyProfile = readFileSync(join(process.cwd(), 'src/ui/profile/ProfilePage.tsx'), 'utf8');
    expect(legacyProfile).toContain('background: active ? warmTheme.surfaceStrong : warmTheme.surface');
    expect(legacyProfile).not.toContain('opacity: unlocked ? 1 : 0.42');
    expect(profile).not.toContain('color: active ? G.goldSoft : \'rgba(240,223,192');
    const inventory = readFileSync(join(process.cwd(), 'src/ui/menus/InventoryModal.tsx'), 'utf8');
    expect(inventory).toContain('background: warmTheme.appBackground');
    expect(inventory).toContain('useThemeVersion();');
    const titles = readFileSync(join(process.cwd(), 'src/ui/profile/TitlesModal.tsx'), 'utf8');
    expect(titles).not.toContain('opacity(0.52)');
    expect(titles).toContain('getReadableUiColor(GC[group].text, surfaceColor)');
    expect(profile).toContain('palette={displayPalette}');
    const pack = readFileSync(join(process.cwd(), 'src/ui/store/PackOpeningModal.tsx'), 'utf8');
    expect(pack).toMatch(/title: \{[^}]*color: 'var\(--profile-text\)'/);
    const viewer = readFileSync(join(process.cwd(), 'src/ui/deck/DeckViewer.tsx'), 'utf8');
    expect(viewer).toContain("color: P.textMuted, minWidth: 28");
    const analyze = readFileSync(join(process.cwd(), 'src/ui/deck/tabs/DeckBuilderAnalyzeTab.tsx'), 'utf8');
    expect(analyze).toContain("getReadableUiColor(accent, warmTheme.surfaceStrong)");
    expect(analyze).not.toContain('rgba(190,215,245,0.40)');
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

  it('themes the shop ability archive and history without recoloring rarity indicators', () => {
    const ability = readFileSync(join(process.cwd(), 'src/ui/store/AbilityMaterialization.tsx'), 'utf8');
    const css = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    expect(ability).toContain('className="ability-materialization-screen"');
    expect(ability).toContain('className="ui-gradient-text">{ability.name}');
    expect(ability).toContain('var(--profile-button-text)');
    expect(ability).not.toContain('rgba(110,185,240');
    expect(ability).not.toContain('rgba(200,223,242');
    expect(ability).toContain("tier === 'transcendent'");
    expect(css).toContain('background:var(--profile-app-background); color:var(--profile-text);');
    expect(css).toContain('.pack-history-rarities span { color:var(--history-rarity');
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
    expect(calendarSource).toContain("originalItemIconUrl('resource-icons/divine-light.png')");
    expect(calendarSource).toContain("originalItemIconUrl('resource-icons/aberrated-shards.png')");
    expect(calendarSource).toContain("originalItemIconUrl('forge/shards-of-transcendence.png')");
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
    expect(menuSource).toContain("btn.style.filter = 'brightness(1.08)'");
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