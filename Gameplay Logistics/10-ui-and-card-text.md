# UI And Card Text

React renders state and dispatches store actions. It should not become a second rules engine.

## Shared Card Faces

Card art across gameplay, pack opening, pending-choice modals, collection, deck builder, boss rewards, Infinitude, profiles, and other card surfaces should use the shared card-face helpers in `src/ui/cardBackgrounds.ts`:

- `getCardFaceBackgroundStyle`
- `getDenseCardFaceBackgroundStyle`
- `getCardNameRibbonStyle`
- `getCardRulesPanelStyle`

Default card presentation is art plus top name/type ribbon plus bottom rules/effect panel. Respect `settings.cardArtDisplay` where the surface is a true card face.

Avoid raw `<img>` overlays that cover holofoil, rarity, ribbon, or rules layers unless the image is explicitly kept behind a positioned content wrapper.

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
