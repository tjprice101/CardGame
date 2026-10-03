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

Default card presentation is full-bleed art beneath the shared screen-blended splotched-ink frame, with no top name/type ribbon or bottom rules panel. Show names and rules in inspectors, tooltips, or detail views outside the card art. Respect `settings.cardArtDisplay` where the surface is a true card face.

Live turn surfaces must use the live helpers so hand, board, Battleground, pile inspectors, and pending choices share one composed artwork and rarity treatment. Standard holo, Eternal, Infinite, Enigmatic, and Transcendent cards use one lightweight transform-only shimmer during play; do not restore per-card filter/background-position animation stacks.

Every menu that browses cards must preserve the complete card aspect ratio, artwork, and frame. Shrink cards or split crowded workflows into dedicated submenus before allowing clipping, squashing, or overflow. The surrounding menu adapts to cards; cards do not deform to rescue the menu layout.

Face-down Soph cards render only the canonical card backing plus state badges such as charge. They do not render the front-face artwork/frame, rarity overlay, or shimmer. Avoid raw `<img>` overlays that create a second artwork layer or sit above foil effects.

## Turn HUD And Main Menu

`HUD.tsx` owns a shared left-side information rail. `AngelStatPanel` and `CardBornStacksPanel` participate in its column layout with a fixed gap; do not give those children independent absolute top positions.

`MainMenuHub.tsx` shows Progress, Collection, and Play together, keeps Begin Turn as the fixed primary action, uses a timed Forge/Causality event-banner carousel, and preserves the selected background and profile quote. Resource counters route to existing destinations. All actions and lock requirements must remain reachable, and theme colors remain profile-driven.

## Appearance, Profile, And Browsing

Ordinary UI uses **neutral reading surfaces with personal-color ceremonial flair**. `src/ui/theme.ts` is the palette authority: `getUiColorModePalette` enforces black/near-black Dark Mode surfaces and white/near-white Light Mode surfaces, including profile previews. Personal color belongs in accents, borders, selection outlines, glows, and readable heading/button-title gradients, not large tinted backgrounds. The default palette stays monochrome.

`getRotatingUiPalette` rotates the stored palette's four source swatches through decorative roles, with a 60-second hold and a three-second fade. Reduced motion preserves the 63-second swatch cadence but switches without fading. Preserve raw catalog/custom swatches; do not overwrite them with neutral display surfaces. Light Mode retains the chosen hue while adjusting foreground brightness for contrast. Small captions use solid text roles. Accent-filled pills use `--profile-accent-text` or `--profile-accent-soft-text`; arbitrary dark accent colors are not safe badge foregrounds.

`warmTheme` is mutated in place. Inline palette consumers must subscribe through `useThemeVersion()` or rerender through a subscribed parent. Profile draft previews publish their own display-mode CSS roles, including accent-pill foregrounds. Never append hex alpha to a CSS variable value.

This treatment covers the recently updated decks, Collection, Card Store, Achievements, Challenges, Codex, inventory, social/settings surfaces, and profile pickers. Do not neutralize card artwork/foil, main-menu splash art, artwork headers, event/Forge/Wake compositions, or gameplay special effects. Rarity, set, success, danger, and warning colors remain meaningful.

Player Information is the ceremonial identity/workspace screen: persistent portrait, name, title, bio, and stats beside scrolling Profile, Main Menu Background, Social, and Save Data tabs. Narrow screens stack. Name/bio limits are 24/200; bio and theme have explicit save actions. Five signature slots, title/avatar pickers, portable saves, and two-stage wipe confirmation remain intact. Appearance mode uses the same persistent `settings.buttonColorMode` as Settings.

Collection retains artwork, foil, ownership history, favorites, filtering, sorting, and virtualization. Infinite sections use Neutrality/Causality set membership, not Light/Dark/Ain Soph Aur card type. Card details use appearance-aware rules text. Card Store is called **Card Store**, not Celestial Archive; its pack art keeps its own composition while ordinary chrome uses shared roles.

The 12 updated resource, Garden-material, and Forge-item PNGs retain original dimensions and foreground colors but have feathered alpha cutouts. Keep that alpha when replacing icons. Card faces, avatars, and banners are not item cutouts. Main-menu resource names sit above their bars; decorative theme changes must not change layout or hide labels.

## Card Text Pipeline

Card rules are formatted through:

- `src/ui/cardStatSummary.ts`
- `getCardSummarySections`
- `getCardPreviewLines`
- `getCardPreviewText`
- `src/ui/components/CardRulesDigest.tsx`

Do not repeat rarity/type labels inside effect descriptions when structured card sections already show them. Preview card faces hide source text; detailed Card Stats can still show source.

## Hover Details

Card hover details belong in the right-rail Card Inspector (`src/ui/hud/CardInspectorPanel.tsx`). Do not add floating hover cards over the board or hand. The inspector is shared by normal turns, Eternity's Wake fights, Garden encounters, and Battleground overlays because they use the same HUD. Null Raid is legacy-only and is not an active player-facing mode.

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
- Spectrum Level and Light-bound Abyss.

Do not reintroduce retired Seraphim/Cherubim/Ophanim/Angel terminology for live card types.

Transcendent cards have an innate maximum-hand-size passive. Separately, the Forge sells four named materialized abilities for 8,000,000 Divine Light and 30 Shards each. Their activation effects must remain set-independent: they may use shared Limitless Light Stacks, Divine Light, draw, and generic deck/discard zones, but must not use Cosmos or modify another set's mechanics/cooldowns.

## Modals And Selection UI

Selection modals can own temporary selected IDs locally. Submission must go through store actions such as `resolvePending`, `summonAinSophAur`, or `forceRemoveBoardCard`, which revalidate all IDs and counts.
