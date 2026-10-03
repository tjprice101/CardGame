import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getMonitorUiScale } from '@/ui/preferences';

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
  it('scales the game surface to monitor dimensions without shrinking standard layouts', () => {
    expect(getMonitorUiScale(1366, 768)).toBeCloseTo(1.2387, 3);
    expect(getMonitorUiScale(1024, 600)).toBe(1);
    expect(getMonitorUiScale(3840, 2160)).toBe(1.24);
  });

  it('uses the same composed art and shimmer helpers in hand and on board', () => {
    const handSource = readFileSync(handPath, 'utf8');
    const boardSource = readFileSync(boardPath, 'utf8');
    const animationSource = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');

    expect(handSource).toContain("getLiveCardFaceBackgroundStyle(def, deckCard.finish, 'front')");
    expect(boardSource).toContain('getLiveCardFaceBackgroundStyle(mainDef, mainCard.finish, mainCard.faceState)');
    expect(handSource).toContain("getLiveCardShimmerClassName(def, deckCard.finish, 'front')");
    expect(boardSource).toContain('getLiveCardShimmerClassName(mainDef, mainCard.finish, mainCard.faceState)');
    expect(handSource).not.toContain("getLiveCardFaceBackgroundStyle(def, deckCard.finish, 'front', true)");
    expect(handSource).toContain("'hand-card-hover-glow'");
    expect(handSource).toContain('hand-card-hover-shimmer');
    expect(handSource).toContain('isHovered && !selected && !isDragging');
    expect(handSource).toContain('Mulligan · Hand (${viewCards.length})');
    expect(handSource).not.toContain('MULLIGAN ? Click cards to swap them out');
    expect(handSource).not.toContain("transform: 'translateY(-16px) scale(1.025)'");
    expect(animationSource).toContain('@keyframes handCardHoverGlow');
    expect(animationSource).toContain('html.reduced-motion .hand-card-hover-glow');
    expect(animationSource).toContain('@keyframes handCardHoverShimmer');
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

    expect(collectionSource).toContain("getLiveCardFaceBackgroundStyle(card, finish, 'front')");
    expect(collectionSource).toContain('getLiveCardShimmerClassName');
    expect(collectionSource).not.toContain('holofoil-menu-card');
    expect(collectionSource).not.toContain('const artUrl = owned > 0 ? getCardBackgroundUrl(card)');

    expect(deckBuilderSource).toContain("getLiveCardFaceBackgroundStyle(def.def, def.finish, 'front')");
    expect(deckBuilderSource).toContain("getLiveCardFaceBackgroundStyle(def, entry.finish, 'front')");
    expect(deckBuilderSource).toContain('getLiveCardShimmerClassName');
    expect(deckBuilderSource).not.toContain('holofoil-menu-card');
    expect(deckBuilderSource).not.toContain('DeferredCardArt');
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

  it('surfaces current deck stats in the manuscript header', () => {
    const deckBuilderSource = readFileSync(deckBuilderPath, 'utf8');
    const appSource = readFileSync(join(process.cwd(), 'src/app/App.tsx'), 'utf8');
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
    expect(appSource).toContain('appRoot.style.zoom = String(scale)');
    expect(appSource).toContain('getMonitorUiScale(window.screen.availWidth');
    expect(forgeSource).toContain('Before the First Shuffle · The Lore of the Card-born World');
    expect(forgeSource).toContain('Vol. 1: Before the First Shuffle');
    expect(forgeSource).not.toContain('Beyond All Sets · Vol. 1');
  });

  it('uses hover outlines and brightness instead of upward movement', () => {
    const styleSource = readFileSync(join(process.cwd(), 'src/styles/animations.css'), 'utf8');
    const hoverRules = Array.from(styleSource.matchAll(/[^{}]*:hover[^{}]*\{[^}]*\}/g), match => match[0]);
    expect(hoverRules.filter(rule => /transform:\s*translateY\(\s*-/.test(rule))).toEqual([]);
    expect(styleSource).not.toMatch(/:hover[^{}]*\{[^}]*\bscale\s*:/);
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
    expect(collectionSource).toContain("getLiveCardFaceBackgroundStyle(card, finish, 'front')");
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