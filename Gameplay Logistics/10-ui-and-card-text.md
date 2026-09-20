# UI And Card Text

React renders state and dispatches store actions. It should not become a second rules engine.

## Shared Card Faces

Card art across gameplay, pack opening, pending-choice modals, collection, deck builder, boss rewards, Infinitude, profiles, and other card surfaces should use the shared card-face helpers in `src/ui/cardBackgrounds.ts`:

- `getCardFaceBackgroundStyle`
- `getDenseCardFaceBackgroundStyle`
- `getLiveCardFaceBackgroundStyle`
- `getLiveCardShimmerClassName`
- `getCardNameRibbonStyle`
- `getCardRulesPanelStyle`

Default card presentation is art plus top name/type ribbon plus bottom rules/effect panel. Respect `settings.cardArtDisplay` where the surface is a true card face.

Live turn surfaces must use the live helpers so hand, board, Battleground, pile inspectors, and pending choices share one composed artwork and rarity treatment. Standard holo, Eternal, Infinite, Enigmatic, and Transcendent cards use one lightweight transform-only shimmer during play; do not restore per-card filter/background-position animation stacks.

Every menu that browses cards must preserve the complete card aspect ratio, artwork, name ribbon, and rules panel. Shrink cards or split crowded workflows into dedicated submenus before allowing clipping, squashing, or overflow. The surrounding menu adapts to cards; cards do not deform to rescue the menu layout.

Face-down Soph cards render only the canonical card backing plus state badges such as charge. They do not render the front-face name ribbon, effect panel, rarity overlay, or shimmer. Avoid raw `<img>` overlays that create a second artwork layer or sit above foil effects.

## Turn HUD And Main Menu

`HUD.tsx` owns a shared left-side information rail. `AngelStatPanel` and `CardBornStacksPanel` participate in its column layout with a fixed gap; do not give those children independent absolute top positions.

`MainMenuHub.tsx` uses a responsive Command Deck organized into Play, Collection, and Progress. It shows one artwork-backed contextual destination and only the active category's actions. All destinations and lock requirements must remain reachable, and theme colors remain profile-driven.

## Card Text Pipeline

Card rules are formatted through:

- `src/ui/cardStatSummary.ts`
- `getCardSummarySections`
- `getCardPreviewLines`
- `getCardPreviewText`
- `src/ui/components/CardRulesDigest.tsx`

Do not repeat rarity/type labels inside effect descriptions when structured card sections already show them. Preview card faces hide source text; detailed Card Stats can still show source.

## Hover Details

Card hover details belong in the right-rail Card Inspector (`src/ui/hud/CardInspectorPanel.tsx`). Do not add floating hover cards over the board or hand. The inspector is shared by normal turns, boss fights, Null Raids, and battleground overlays because they use the same HUD.

## Pack Opening

Pack opening starts with all cards face-down. The modal must wait for one of these user actions:

- Click an individual card.
- Click Reveal All / Reveal Best.
- Click Instant.

Do not add timed auto-reveal. `PackOpeningModalSource.test.ts` guards this behavior.

## User-Facing Terminology

Use:

- Divine Light, not Oblivion.
- Ain Soph Aur with spaces, not ASA or AinSophAur in display text.
- Light, Dark, Soph, Ain, Limitless Light Stacks.

Do not reintroduce retired Seraphim/Cherubim/Ophanim/Angel terminology for live card types.

## Modals And Selection UI

Selection modals can own temporary selected IDs locally. Submission must go through store actions such as `resolvePending`, `summonAinSophAur`, or `forceRemoveBoardCard`, which revalidate all IDs and counts.
