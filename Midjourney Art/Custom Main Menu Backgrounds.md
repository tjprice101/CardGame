# Custom Main Menu Backgrounds

## Scope

Seven Transcendent-rarity main-menu background rewards tied to the Forge of Transcendence. These are permanent cosmetic achievements, not card effects or extra currency sources. Requirements, names, and output filenames match the existing reward registry.

This document contains production prompts. All seven supplied PNGs are installed in `../card-game-idle/src/assets/main-menu-backgrounds/` under the mapped output filenames and are bundled automatically. Their achievement gates still apply. If an image is removed or unavailable, the profile picker displays **Artwork pending** and prevents equipping an empty slot.

## Prompt derivation and shared style

Use the actual construction of [Splotched Ink Replacement Prompts](./Splotched%20Ink%20Replacement%20Prompts.md) and [Splotched Art Updated Prompts](./Splotched%20Art%20Updated%20Prompts.md): a clear physical subject, a specific composition, high-contrast black-and-white paper and ink, a controlled accent, tactile brush treatment, and concise exclusions.

These rewards inherit their subject rendering and palette from [Forge of Transcendence Prompts](./Forge%20of%20Transcendence%20Prompts.md): grand high-contrast anime ink illustration on distressed parchment-white ground, dense black splotched dry-brush marks, expressive ink fragments, brilliant white surfaces with stark black fractures, and flowing pink-to-scarlet flame like elegant angelic wings. Each prompt states this treatment explicitly rather than relying on a style name alone.

**Palette:** white and black dominate; pale rose, hot pink, fuchsia, crimson, and scarlet fire form the only accent family. This is the Forge identity, separate from Intensity's white/black/gold volcanic mythology. No gold, orange-fire landscape, rainbow nebula, or unrelated set palette.

**Individuality:** the seven rewards have different dominant forms: a broken threshold, a cradled ember, a four-relic assembly, a ruptured sun, a traveling needle, an opened reliquary, and a four-winged guardian. Do not turn them into seven variations of the same portal or add tiny scenery everywhere. Express chaos through directional brushwork, ink collisions, and flame movement while preserving the primary shape.

**Real menu composition:** 16:9 full-bleed landscape. Place the focal subject right-of-center and keep the left quarter and upper-left broadly quiet for identity/navigation overlays. Preserve a low-detail lower-center interval for the Begin Turn control. Quiet space can be pale paper or a simple ink wash; it must not be full of tiny shards or bright flame tips. No painted interface or baked-in text.

**Vocabulary:** physical descriptions only inside prompts. Translate Light into radiant ivory energy, Dark into black void ink, and angelic card imagery into a four-winged celestial guardian. Achievement and ability names belong in the briefs, not the rendered image.

**Parameters:** `--ar 16:9 --niji 6 --stylize 900`

The previous generalized apocalypse language and universal high-chaos parameter are replaced by concrete subject/composition instructions and the established prompt template.

## Achievement and Asset Map

| Achievement / background | Requirement | Output filename |
| --- | --- | --- |
| The Unsealed Impossible | Unlock the Forge of Transcendence | `forge-unsealed-impossible.png` |
| A Star Without a Sky | Own at least one distinct Volume I Transcendent card | `forge-star-without-sky.png` |
| The Fourfold Absolute | Own all four distinct Volume I Transcendent cards | `forge-fourfold-absolute.png` |
| The Dawn That Devours Night | Acquire First Dawn Accord | `forge-devouring-dawn.png` |
| The Velocity of Silence | Acquire Axiom of Acceleration | `forge-velocity-of-silence.png` |
| Cathedral of Unwritten Tomorrows | Acquire Vault of Unwritten Futures | `forge-unwritten-tomorrows.png` |
| Where Every Origin Breaks | Acquire Confluence of All Origins | `forge-origins-break.png` |

Duplicate copies of one Volume I card do not satisfy the all-four requirement. Ability rewards require acquisition, not equipping or activation. Do not change these gates to match a generated composition.

## 1. The Unsealed Impossible

**Milestone:** Unlock the Forge of Transcendence.
**Visual brief:** A threshold forced open by an ancient key. Keep one bold doorway silhouette; the impossible architecture appears through its interior rather than filling the entire landscape.
**Output:** `forge-unsealed-impossible.png`

```text
wide cinematic main-menu background, a monumental broken white threshold suspended right-of-center within a loose black ink aperture, one white celestial key turning inside the opening, a short impossible stairway visible through the deep black interior, grand high-contrast anime ink illustration on distressed parchment-white ground, dense black splotched dry-brush marks and expressive ink fragments around the threshold, flowing vivid pink-to-scarlet flame gradients hooking around its fractured sides like elegant flaming angelic wings, brilliant white stone with stark black cracks, asymmetrical outward ink collision and one clean imposing doorway silhouette, broad quiet paper and low-detail black wash in the upper-left and left quarter, quiet lower-center interval, no readable text, no logo, no watermark, no interface, no decorative frame, Forge Splotched Ink style lock, white and black dominant, only bright pink through scarlet red flame accents --ar 16:9 --niji 6 --stylize 900
```

## 2. A Star Without a Sky

**Milestone:** Own at least one distinct Volume I Transcendent card.
**Visual brief:** The first-light motif from Volume I becomes a widescreen scene. Its identity is intimacy against impossible scale: immense hands and one small ember, not a crowded space explosion.
**Output:** `forge-star-without-sky.png`

```text
wide cinematic main-menu background, one radiant white ember cradled in enormous black hands right-of-center, a broken crescent of ink behind the hands with no conventional sky or galaxy, grand high-contrast anime ink illustration on distressed parchment-white ground, dense black splotched dry-brush marks and expressive ink fragments around the fingers, flowing vivid pink-to-scarlet flame gradients rising from the ember in one sweeping wing-shaped ribbon, the ember is the single sharpest white focal point, broad tactile ink smears and imperfect engraved hand contours, immense scale contrast with a calm readable silhouette, broad quiet pale paper across the left quarter and upper-left, low-detail lower-center interval, no readable text, no logo, no watermark, no interface, no decorative frame, Forge Splotched Ink style lock, white and black dominant, only bright pink through scarlet red flame accents --ar 16:9 --niji 6 --stylize 900
```

## 3. The Fourfold Absolute

**Milestone:** Own all four distinct Volume I Transcendent cards.
**Visual brief:** The four Volume I identities assemble into one ceremonial shape: first light, catalyst, reliquary, and bridge guardian. Each must remain visible without becoming a four-panel collage.
**Output:** `forge-fourfold-absolute.png`

```text
wide cinematic main-menu background, four distinct monumental relics assembled in a broken off-center arc on the right, a white ember above, a black catalytic spindle at the outer right, an open white reliquary below, and a four-winged ivory celestial guardian at the inner left, grand high-contrast anime ink illustration on distressed parchment-white ground, dense black splotched dry-brush marks and expressive ink fragments beneath the assembly, one flowing vivid pink-to-scarlet flame ribbon joining the four relics like an elegant angelic wing, brilliant white surfaces with stark black fractures, clear separated silhouettes inside one ceremonial composition, no card rectangles or divided panels, broad quiet paper in the left quarter and upper-left, low-detail lower-center interval, no readable text, no logo, no watermark, no interface, no decorative frame, Forge Splotched Ink style lock, white and black dominant, only bright pink through scarlet red flame accents --ar 16:9 --niji 6 --stylize 900
```

## 4. The Dawn That Devours Night

**Milestone:** Acquire First Dawn Accord.
**Ability motif:** Three subsequent empowered card plays become three clear dawn blades. Keep the count in the physical subject, not in numerals.
**Output:** `forge-devouring-dawn.png`

```text
wide cinematic main-menu background, one colossal rough black sun right-of-center splitting from within into three broad ivory dawn blades, the blades spreading at unequal angles like torn celestial wings, grand high-contrast anime ink illustration on distressed parchment-white ground, dense black splotched dry-brush marks and expressive ink fragments falling from the sun, flowing vivid pink-to-scarlet flame gradients tracing the three blade edges, white paper revealed through heavy black pigment instead of a conventional orange sunrise, tactile scraped ink and imperfect engraved fractures, one unmistakable sun silhouette with three distinct luminous cuts, broad quiet black wash and pale paper in the left quarter and upper-left, low-detail lower-center interval, no readable text, no logo, no watermark, no interface, no decorative frame, Forge Splotched Ink style lock, white and black dominant, only bright pink through scarlet red flame accents --ar 16:9 --niji 6 --stylize 900
```

## 5. The Velocity of Silence

**Milestone:** Acquire Axiom of Acceleration.
**Ability motif:** Additional charge passing through sealed ritual tiles, rendered as a directional sequence. It should read as force accumulating, not a racing scene or a clock.
**Output:** `forge-velocity-of-silence.png`

```text
wide cinematic main-menu background, a long white ceremonial needle crossing three separate sealed black ritual tiles along an ascending diagonal in the right half, each tile split by a small accumulating ivory charge, broken black arcs stretching behind the needle, grand high-contrast anime ink illustration on distressed parchment-white ground, dense black splotched dry-brush marks pulled into long directional strokes, flowing vivid pink-to-scarlet flame gradients drawn into one narrow accelerating ribbon, scratched white edges and tactile hand-printed pigment impacts, clear needle silhouette with three distinct tile stations, no vehicles or clock faces, broad quiet paper in the upper-left and left quarter, low-detail lower-center interval, no readable text, no logo, no watermark, no interface, no decorative frame, Forge Splotched Ink style lock, white and black dominant, only bright pink through scarlet red flame accents --ar 16:9 --niji 6 --stylize 900
```

## 6. Cathedral of Unwritten Tomorrows

**Milestone:** Acquire Vault of Unwritten Futures.
**Ability motif:** Two recovered fragments open a space of possibilities. The reliquary remains the main subject; a few great page arches supply the cathedral identity without becoming a busy library.
**Output:** `forge-unwritten-tomorrows.png`

```text
wide cinematic main-menu background, one monumental open white reliquary in the lower-right releasing two ivory fragments from its black interior, three enormous blank parchment folds rising behind it as impossible cathedral arches, grand high-contrast anime ink illustration on distressed parchment-white ground, dense black splotched dry-brush marks and expressive ink fragments between the folds, flowing vivid pink-to-scarlet flame gradients threading through the hinges and page edges like elegant flaming angelic wings, brilliant white planes with stark black fractures, deep receding perspective and one clear chest silhouette, no shelves or written pages, broad quiet pale paper in the left quarter and upper-left, low-detail lower-center interval, no readable text, no logo, no watermark, no interface, no decorative frame, Forge Splotched Ink style lock, white and black dominant, only bright pink through scarlet red flame accents --ar 16:9 --niji 6 --stylize 900
```

## 7. Where Every Origin Breaks

**Milestone:** Acquire Confluence of All Origins.
**Ability motif:** Radiant, shadow, and guardian attack identities become three converging forces. One four-winged figure anchors the scene; its pose and stretched wings carry the collision.
**Output:** `forge-origins-break.png`

```text
wide cinematic main-menu background, one monumental four-winged ivory celestial guardian right-of-center leaning across a diagonal collision, radiant white energy descending into its upper wings, black void ink rising into its lower wings, and a vivid pink-to-scarlet flame ribbon passing through the chest, grand high-contrast anime ink illustration on distressed parchment-white ground, dense black splotched dry-brush marks and expressive ink fragments flung toward the far-right edge, brilliant white wing planes with stark black fractures, asymmetric stretched-wing silhouette and tactile scraped pigment, three distinct currents kept legible around one figure, broad quiet ink wash and pale paper in the left quarter and upper-left, low-detail lower-center interval, no readable text, no logo, no watermark, no interface, no decorative frame, Forge Splotched Ink style lock, white and black dominant, only bright pink through scarlet red flame accents --ar 16:9 --niji 6 --stylize 900
```

## Render selection checklist

- First inspect each image at thumbnail size: identify its primary shape without reading its name.
- Verify the seven silhouettes differ; reject repeated portal compositions and indiscriminate splatter noise.
- Check white/black dominance, visible paper, splotched dry-brush construction, and the single pink-scarlet accent family. Reject smooth fantasy paintings with an ink texture overlaid.
- Check the concrete motifs: four relics, three dawn blades, three tile stations, two recovered fragments, and four guardian wings where specified.
- Preview with real main-menu overlays at 16:9 and a narrower crop. Keep bright fractures, flame tips, and tiny debris away from the upper-left navigation and lower-center primary control.
- Do not bake lettering, menu controls, achievement badges, decorative borders, or readable glyphs into the artwork.
- Export under the exact mapped filename. Do not change registry IDs, unlock gates, or achievement names to accommodate a render.
