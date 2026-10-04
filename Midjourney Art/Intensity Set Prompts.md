# Intensity Set - Splotched Ink Artwork Prompts

## Scope and prompt derivation

The implemented, registered Intensity roster contains **19 leveled cards, 5 Eternal cards, and 5 Infinite cards (29 total)**. Level 3 has three cards. The asset audit verifies a one-to-one match between all 29 gameplay identities and installed faces. This replaces the previous Seraphim/Chaos/Seeker/Angel art roster; those legacy classes are no longer this set's organizing identity.

All **31 supplied PNGs are installed**: the 29 card faces, the pack banner, and the shared card back. Card output filenames below are canonical runtime assets under `card-game-idle/public/assets/card-backgrounds/intensity/`; the banner is under `card-game-idle/public/assets/pack-art/`. The standalone `src/data/cards/intensityArt.ts` maps persistent gameplay IDs to these filenames, so changing a display name does not change its art. All Intensity cards use the supplied shared back, including Eternal and Infinite rarities. SHA-256 integrity tests preserve the original supplied bytes; the Herald's accidental doubled `.png.png` extension was corrected during installation.

The world-art section records 17 additional installed assets, four optional scene targets, and eight new cosmetic prompts. Prompt text alone does not generate or install an image.

The prompt structure derives from [Splotched Ink Replacement Prompts](./Splotched%20Ink%20Replacement%20Prompts.md), [Splotched Art Updated Prompts](./Splotched%20Art%20Updated%20Prompts.md), and the graphic subject treatment in [Forge of Transcendence Prompts](./Forge%20of%20Transcendence%20Prompts.md). Use their physical-subject-first format, explicit paper/ink treatment, readable composition, controlled accent palette, and consistent closing restrictions. Do not borrow their characters, pink-scarlet palette, or repeat the same aperture around every card.

## The Last Seam: story of Intensity

Before the first dawn, the world was a white mountain suspended over a black sea without a floor. Each eruption created land; each tide erased it. Neither force could leave a lasting history.

When the mountain split, molten magma entered the fracture. It hardened into **the Last Seam**, a living bond that remembers everything the fire destroys and the abyss conceals. The seam did not end the conflict: it gave the world enough continuity for its inhabitants to choose what deserved to survive.

The white mountain's heralds want to reveal every buried memory, even if revelation burns the continent apart. The black sea's choir wants to shelter those memories, even if nothing ever reaches daylight again. The divided crown commands both. Between them, beings of opposing white and black discover that preservation requires neither endless exposure nor endless burial.

The leveled cards follow the awakening of the seam, the struggle for its memories, and the threatened meeting of the world's two ends. The five Eternal figures govern the conflict. The five Infinity forms show what happens when their decisions become laws that repeat beyond time.

## Intensity style lock

**Direction:** Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, and rough brushwork on white parchment. Flaming infernos and volcanic molten obsidian bring each subject to life. White and black dominate; hot orange and deep red flames are the color accents, with white-hot cores and tips; avoid yellow or golden fire.

**Prompt template:** simple subject + one action or setting + shared ink-manuscript tags + aspect ratio and Midjourney parameters. Keep lore and game terms outside the prompt. Let Midjourney interpret the brushwork instead of specifying every stroke, surface, and camera detail.

**Composition:** one readable focal subject. Banners retain useful quiet space; icons keep empty margins; the card back stays balanced upside down. The notes below are context, not extra text to append to prompts.

**Parameters:** cards/back `--ar 2:3`, banners/scenes `--ar 16:9`, icons `--ar 1:1`; retain `--niji 6 --stylize 900`. Use `--no text logo watermark border yellow` for exclusions.

## Set presentation artwork

These two installed supporting assets are separate from the 29-card roster. They share the Last Seam mythology and the white/black/orange-red style lock, but use compositions tailored to a landscape store banner and a face-down card back. `pack-intensity` uses the supplied banner; every Intensity identity uses the supplied card back before generic rarity routing.

### Intensity Set Banner - Where the Mountain Meets the Deep

**Concept:** A white volcano creates a continent above the black sea; a single orange-red magma fracture binds the eruption to the abyss. The landscape introduces the whole set rather than enlarging one card character.
**Output:** `intensity-set-banner.png`
**Composition:** Wide landscape. Concentrate the volcanic silhouette and eruption in the right two-thirds, with a quieter parchment-white ash field on the left for separately rendered pack text. Keep the mountain, orange-red seam, and opposing black tide readable within the central horizontal band so banner cropping does not remove the identity.

```text
wide cinematic illustration, a white volcano erupting above a black ocean, molten obsidian waves, orange-red lava, quiet space on the left, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Intensity Card Back - Seal of the Last Seam

**Concept:** A magma-bound volcanic seal holds orange-red fire with white-hot accents and black depth together. This is a shared set emblem, not a portrait of Palevent Herald or an illustration that reveals a card's identity.
**Output:** `intensity-card-back.png`
**Composition:** Vertical 2:3. A centered, two-ended obsidian seal has matching volcanic peaks above and below, mirrored orange-red flame fans with white-hot cores, and a continuous orange-red fracture. Keep the structural silhouette balanced under a 180-degree turn while allowing irregular splotches and distressed texture. Leave a quiet outer paper margin; no rarity badge, card name, or generated border.

```text
vertical full-art illustration, symmetrical obsidian volcanic seal, mirrored orange-red infernos with white-hot cores above and below, orange-red lava cracks, balanced upside down, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

## Roster

| Tier | Count | Story movement |
| --- | ---: | --- |
| Level 0 | 4 | The seam awakens |
| Level 1 | 4 | Mountain and sea answer |
| Level 2 | 3 | The struggle for memory |
| Level 3 | 3 | A choice between opposing truths |
| Level 4 | 2 | The world approaches rupture |
| Level 5 | 3 | Both ends of the world meet |
| Eternal | 5 | The five powers governing the seam |
| Infinity | 5 | Their decisions become endless laws |
| **Total** | **29** | |

---

## Level 0 - The Seam Awakens

### Palevent Herald | Level 0 | Light

**Lore:** The mountain's first messenger carries a single drop of living magma in its hollow chest.
**Output:** `intensity-l0-palevent-herald.png`

```text
vertical full-art illustration, white masked herald with six ash wings emerging from a volcanic vent, a orange-red ember in its chest, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Nacreless Choir | Level 0 | Dark

**Lore:** An eyeless singer rises from the sea to warn that the magma remembers voices the tide had hidden.
**Output:** `intensity-l0-nacreless-choir.png`

```text
vertical full-art illustration, black serpent with four flowing fins rising from a volcanic trench, orange-red flames with white-hot tips in its throat, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Handful of Daybreak | Level 0 | Light

**Lore:** A pilgrim catches the first eruption's fragments before they can sink into the sea.
**Output:** `intensity-l0-handful-of-daybreak.png`

```text
vertical full-art illustration, two pale hands holding three burning volcanic stones, orange-red fire joining the stones, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Relics Beneath the Burn | Level 0 | Dark

**Lore:** The choir discovers that two buried relics have survived the mountain's attempts to erase them.
**Output:** `intensity-l0-relics-beneath-the-burn.png`

```text
vertical full-art illustration, obsidian relic tablets rising from an abyss toward a pale hand, orange-red inferno with white-hot highlights overhead, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

## Level 1 - Mountain and Sea Answer

### Caldera's First Breath | Level 1 | Light

**Lore:** A stone ram awakens the mountain's lungs, turning the newborn seam into a river.
**Output:** `intensity-l1-calderas-first-breath.png`

```text
vertical full-art illustration, white stone ram emerging from an erupting caldera, ash wings, molten obsidian armor, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Maw Beneath Morning | Level 1 | Dark

**Lore:** The sea sends a soot hound to keep the rising dawn from reaching its sheltered memories.
**Output:** `intensity-l1-maw-beneath-morning.png`

```text
vertical full-art illustration, black volcanic hound with six smoke wings, orange-red furnace jaws with white-hot edges and orange-red teeth, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### The Unburning Boundary | Level 1 | Light

**Lore:** The pilgrim lays the first magma-bound stones between the exposed land and the consuming tide.
**Output:** `intensity-l1-the-unburning-boundary.png`

```text
vertical full-art illustration, white volcanic-glass shield holding back a black inferno, orange-red lava between its plates, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Vestment of the Buried Sun | Level 1 | Dark

**Lore:** Empty armor returns from the trench, carrying the impression of a ruler who has not yet appeared.
**Output:** `intensity-l1-vestment-of-the-buried-sun.png`

```text
vertical full-art illustration, empty obsidian armor above a volcanic throne, a buried orange-red flame with a white-hot core burning in its chest, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

## Level 2 - The Struggle for Memory

### Throat of the Deep | Level 2 | Dark

**Lore:** The choir amplifies its warning through a monolith until the entire continent hears the sea.
**Output:** `intensity-l2-throat-of-the-deep.png`

```text
vertical full-art illustration, black volcanic monolith breathing a towering inferno, orange-red lava spiraling through its cracks, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### A Horizon Set Alight | Level 2 | Light

**Lore:** The mountain tries to reveal every hidden memory by carrying dawn across the continent.
**Output:** `intensity-l2-a-horizon-set-alight.png`

```text
vertical full-art illustration, white volcanoes erupting across an obsidian continent, one orange-red lava river joining them, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### What the Depths Remember | Level 2 | Dark

**Lore:** Beneath the burning horizon, the choir offers the pilgrim one memory neither side can bear to lose.
**Output:** `intensity-l2-what-the-depths-remember.png`

```text
vertical full-art illustration, an enormous obsidian arm lifting a white relic from a volcanic abyss, flames rising around it, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

## Level 3 - Opposing Truths

### The Chosen Remnant | Level 3 | Light

**Lore:** The pilgrim chooses one fragment to carry forward instead of exposing the whole archive at once.
**Output:** `intensity-l3-the-chosen-remnant.png`

```text
vertical full-art illustration, white-robed pilgrim lifting a burning relic among black stone tablets, orange-red fire in one hand, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### The Earth Refuses Silence | Level 3 | Dark

**Lore:** The deep rejects permanent burial; a black eruption breaks the seals its own rulers imposed.
**Output:** `intensity-l3-the-earth-refuses-silence.png`

```text
vertical full-art illustration, black inferno bursting through white volcanic slabs, flying obsidian and orange-red lava, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### The Unsevered Contradiction | Level 3 | ASA

**Lore:** The pilgrim and choir become one witness, joined by a seam that neither radiance nor depth can sever.
**Output:** `intensity-l3-the-unsevered-contradiction.png`

```text
vertical full-art illustration, faceless eight-winged guardian between a white volcano and a black ocean, holding a broken obsidian crown, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

## Level 4 - The Approaching Rupture

### Fifth Pulse, Open Heaven | Level 4 | ASA

**Lore:** Five pulses pass through the seam; the last opens a path from the sea floor to the sky.
**Output:** `intensity-l4-fifth-pulse-open-heaven.png`

```text
vertical full-art illustration, five cracked obsidian hearts rising from a volcanic abyss, the highest bursting into orange-red inferno with white-hot highlights, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Night That Burns Forever | Level 4 | Dark

**Lore:** The sea arrests dawn inside an inferno that consumes time instead of fuel.
**Output:** `intensity-l4-night-that-burns-forever.png`

```text
vertical full-art illustration, broken obsidian hourglass inside a black volcanic firestorm, white ash flowing upward, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

## Level 5 - Both Ends Meet

### The Weight of All Horizons | Level 5 | ASA

**Lore:** The joined witness bears every exposed and buried memory without allowing either to vanish.
**Output:** `intensity-l5-the-weight-of-all-horizons.png`

```text
vertical full-art illustration, colossal winged obsidian heart holding a white volcanic star, orange-red lava binding floating mountain ranges, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### When Both Ends Meet | Level 5 | ASA

**Lore:** The first mountain and the last tide finally collide; the seam holds long enough for a choice.
**Output:** `intensity-l5-when-both-ends-meet.png`

```text
vertical full-art illustration, white volcanic continent colliding with a black ocean, orange-red inferno blazing along their meeting point, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Center of the Unmaking | Level 5 | ASA

**Lore:** The witness releases the memories it cannot preserve, turning destruction into the next world's foundation.
**Output:** `intensity-l5-center-of-the-unmaking.png`

```text
vertical full-art illustration, white mountains and black abyss folding around a orange-red flame, obsidian fragments spiraling inward, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

## Eternal - The Five Powers

### Cathedral Below All Seas | Eternal | Dark

**Lore:** The living sanctuary of the choir guards the oldest memories inside its submerged ribs.
**Output:** `intensity-eternal-cathedral-below-all-seas.png`

```text
vertical full-art illustration, colossal obsidian serpent forming a submerged cathedral, orange-red inferno with white-hot highlights burning between its ribs, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### The Crown Divided Against Itself | Eternal | ASA

**Lore:** Two monarchs share one crown: one demands revelation, the other concealment, and both fear the witness.
**Output:** `intensity-eternal-the-crown-divided-against-itself.png`

```text
vertical full-art illustration, two volcanic monarchs grasping one broken crown, orange-red fire with white-hot accents against black smoke, orange-red lava joining the crown, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Sovereign of Unbearable Noon | Eternal | Light

**Lore:** The mountain's ruler would reveal every memory, even those whose owners begged for darkness.
**Output:** `intensity-eternal-sovereign-of-unbearable-noon.png`

```text
vertical full-art illustration, obsidian monarch before an enormous white volcanic sun, orange-red flame crown, shattered throne, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### The Bell That Buries Distance | Eternal | Dark

**Lore:** The sea's bell folds exposed land into the trench, placing unwanted truths beyond reach.
**Output:** `intensity-eternal-the-bell-that-buries-distance.png`

```text
vertical full-art illustration, cracked obsidian bell swallowing a city into a volcanic abyss, orange-red fire with white-hot accents and orange-red lava pouring from its mouth, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Verdict After the Last Dawn | Eternal | ASA

**Lore:** The final judge decides which memories become foundations and which may finally rest.
**Output:** `intensity-eternal-verdict-after-the-last-dawn.png`

```text
vertical full-art illustration, white phoenix rising from black volcanic ash, obsidian armor, one talon holding a burning mountain seed, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

## Infinity - Decisions Without End

Infinity is the artwork label used in these output filenames; the gameplay rarity is Infinite. These five installed faces use `infinite-intensity-` persistent IDs.

### The Unfathomed Return | Infinity | Dark

**Eternal source:** Cathedral Below All Seas.
**Lore:** The sanctuary becomes a downward procession of itself, returning every sheltered memory without ever emptying.
**Output:** `intensity-infinity-the-unfathomed-return.png`

```text
vertical full-art illustration, endless obsidian serpent cathedrals nested beneath a black sea, orange-red infernos with white-hot cores and one continuous orange-red lava vein, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Crown With No Final King | Infinity | ASA

**Eternal source:** The Crown Divided Against Itself.
**Lore:** The crown outlasts every ruler; its two halves pass between endless white and black successors.
**Output:** `intensity-infinity-crown-with-no-final-king.png`

```text
vertical full-art illustration, broken obsidian crown above empty white and black thrones, smaller burning crowns receding into the abyss, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Daybreak Without End | Infinity | Light

**Eternal source:** Sovereign of Unbearable Noon.
**Lore:** Dawn no longer advances through time; every volcanic horizon rises inside the previous one.
**Output:** `intensity-infinity-daybreak-without-end.png`

```text
vertical full-art illustration, white volcanic sun containing endless erupting black mountains, a lone monarch beneath orange-red flames, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### A Furnace Outside Time | Infinity | ASA

**Eternal source:** The Bell That Buries Distance.
**Lore:** The bell's final toll never ends; distance returns as quickly as it is buried.
**Output:** `intensity-infinity-a-furnace-outside-time.png`

```text
vertical full-art illustration, obsidian bell with a orange-red furnace inside, a burning city folding through its mouth again and again, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### The Seam That Holds Eternity | Infinity | ASA

**Eternal source:** Verdict After the Last Dawn.
**Lore:** The judge becomes the bond itself, allowing each world's ending to carry the next world's beginning.
**Output:** `intensity-infinity-the-seam-that-holds-eternity.png`

```text
vertical full-art illustration, white phoenix bridging a black ocean and newborn volcanoes, orange-red fire running through its wings, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 2:3 --niji 6 --stylize 900 --no text logo watermark border yellow
```

## Expansion world artwork

These filenames are relative to `card-game-idle/public/assets/`:

| Artwork | Install folder | Runtime status |
| --- | --- | --- |
| Five boss banners | `card-backgrounds/intensity/` | Exact human-readable boss filenames below are loaded by the Wake |
| Crater of Flames banner | `dungeons/` | `crater-of-flames.png` is wired |
| Four encounter scenes | `dungeons/` | `crater-of-flames-1.png` through `-4.png` are reserved outputs, not yet loaded as scene art |
| Four material icons | `dungeons/items/` | Exact lowercase filenames below are wired |
| Seven ability icons | `ability-icons/` | Exact ability-ID filenames below are wired |

Of these 21 world targets, 17 are installed: all five bosses, the dungeon cover, all four materials, and all seven abilities. The four encounter scenes remain optional reserved outputs, not runtime requirements.

The supplied `The Ignited Cathedral.png` is installed as `The Drowned Cathedral Boss Art.png` without renaming the gameplay boss. Emberglass, Abyssal Cinder, and Heart of the Inferno received border-connected parchment alpha cleanup with protected centers and inward edge feathering. Solar Slag retains its integral fiery backdrop; removing it would risk cutting away the subject. Unmodified material originals are retained in the session artifacts.

Use the same short Chinese mythological ink-manuscript template for every pending image. Keep the subject distinct, the inferno unmistakable, and the white/black/orange-red palette consistent.

### Boss banner - The Drowned Cathedral

**Installed output:** `The Drowned Cathedral Boss Art.png`
**Composition:** Underwater side elevation of a moving basalt sanctuary; a tiny suspended bell establishes impossible scale.

```text
wide cinematic illustration, colossal obsidian serpent carrying a drowned cathedral, underwater volcanic infernos, white steam and orange-red lava, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Boss banner - The Divided Crown

**Installed output:** `The Divided Crown Boss Art.png`
**Composition:** Two opposed sovereigns brace the same broken crown across a collapsed throne hall.

```text
wide cinematic illustration, two volcanic sovereigns holding a broken crown across ruined obsidian thrones, white and black infernos, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Boss banner - The Sovereign of Unbearable Noon

**Installed output:** `The Sovereign of Unbearable Noon Boss Art.png`
**Composition:** A monarch advances across a nearly white ash plain; compressed volcanic ridges form a distant orange-red-edged horizon.

```text
wide cinematic illustration, pale crowned monarch crossing a volcanic ash plain, molten obsidian mountains and towering orange-red flames with white-hot tips, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Boss banner - The Bell That Buries Distance

**Installed output:** `The Bell That Buries Distance Boss Art.png`
**Composition:** A tilted monumental bell drags mountains and roads through its opening rather than emitting ordinary sound rings.

```text
wide cinematic illustration, colossal obsidian bell swallowing mountains above a flaming caldera, orange-red inferno with white-hot highlights in its mouth, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Boss banner - The Arbiter After the Last Dawn

**Installed output:** `The Arbiter After the Last Dawn Boss Art.png`
**Composition:** A twin-aspected arbiter holds opposing remnants apart above a sloping continent of ash.

```text
wide cinematic illustration, white-winged judge in black volcanic armor, holding a first flame and a last ember above a burning continent, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Dungeon banner - Crater of Flames

**Installed output:** `crater-of-flames.png`
**Composition:** A cutaway descent through four distinct strata; the expedition's route is a descending orange-red seam.

```text
wide cinematic illustration, vast volcanic crater descending into a orange-red inferno with white-hot highlights, molten obsidian terraces and orange-red lava rivers, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Encounter scene - The Emberglass Rim

**Pending output:** `crater-of-flames-1.png`
**Composition:** Ground-level traverse across translucent volcanic blades, before the descent begins.

```text
wide cinematic illustration, jagged volcanic-glass cliffs around an erupting crater, orange-red flames with white-hot tips and orange-red lava beneath the path, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Encounter scene - The Cinder Descent

**Pending output:** `crater-of-flames-2.png`
**Composition:** A steep zigzag stair passes under suspended cinder shelves and pressure-black water.

```text
wide cinematic illustration, steep obsidian stairs descending through volcanic smoke, orange-red infernos with white-hot cores and orange-red magma below, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Encounter scene - The White Furnace

**Pending output:** `crater-of-flames-3.png`
**Composition:** Horizontal stone baffles force sculptural orange-red fire with white-hot accents through a chamber of cooled pale metal.

```text
wide cinematic illustration, underground obsidian furnace, orange-red fire with white-hot accents blasting between stone slabs, molten metal flowing in orange-red streams, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Encounter scene - The Heart Beneath the Crater

**Pending output:** `crater-of-flames-4.png`
**Composition:** An elongated white-hot geological heart hangs inside an opened, ribbed dark shell.

```text
wide cinematic illustration, orange-red volcanic heart with a white-hot core suspended inside a split obsidian shell, a cavern filled with inferno, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clear focal silhouette --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Material icon - Emberglass

**Installed output:** `emberglass.png`
**Composition:** A single folded volcanic-glass flake holds the first eruption pulse as an internal scar.

```text
centered material icon, single jagged volcanic-glass shard holding a orange-red flame, molten obsidian edges, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clean silhouette, empty margins --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Material icon - Abyssal Cinder

**Installed output:** `abyssal-cinder.png`
**Composition:** A hooked porous ember with a white pressure-cut interior, not an ordinary coal ball.

```text
centered material icon, hooked black volcanic cinder with a orange-red inferno with white-hot highlights inside, orange-red lava glowing through its pores, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clean silhouette, empty margins --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Material icon - Solar Slag

**Installed output:** `solar-slag.png`
**Composition:** A cooled folded metal pour retains one sharp red-hot edge.

```text
centered material icon, folded pale-metal slag with a molten obsidian underside, orange-red flame with a white-hot core and red-hot edges, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clean silhouette, empty margins --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Material icon - Heart of the Inferno

**Installed output:** `heart-of-the-inferno.png`
**Composition:** A split, angular obsidian shell suspends a white-hot core on narrow orange-red ligaments, shown as a tangible mineral rather than a glowing orb.

```text
centered material icon, split obsidian shell holding an angular orange-red inferno with white-hot highlights heart, orange-red lava joining the broken halves, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clean silhouette, empty margins --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Ability icon - Kindle the Depths

**Installed output:** `intensity-kindle-the-depths.png`
**Composition:** An orange-red flame hook with a white-hot core pierces a black submerged stone shelf from below.

```text
centered ability icon, orange-red flame with a white-hot core erupting through a molten obsidian shelf, volcanic fragments flying upward, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clean silhouette, empty margins --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Ability icon - Bank the Flame

**Installed output:** `intensity-bank-the-flame.png`
**Composition:** Two overlapping obsidian shutters shelter a narrow surviving orange-red flame with a white-hot core.

```text
centered ability icon, two obsidian shutters enclosing a fierce orange-red inferno with white-hot highlights, orange-red lava along their hinges, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clean silhouette, empty margins --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Ability icon - Temper the Hand

**Installed output:** `intensity-temper-the-hand.png`
**Composition:** A white gauntlet presses two blank basalt plates into one magma-bound fan.

```text
centered ability icon, white armored hand forging two obsidian plates in volcanic fire, orange-red molten seams, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clean silhouette, empty margins --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Ability icon - Cinder Recall

**Installed output:** `intensity-cinder-recall.png`
**Composition:** Two recognizable burned fragments lift out of ash on separate orange-red flame with a white-hot core strands.

```text
centered ability icon, two burned obsidian fragments rising from ash on orange-red flames with white-hot tips, orange-red fire repairing their cracks, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clean silhouette, empty margins --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Ability icon - White-hot Reprieve

**Installed output:** `intensity-white-hot-reprieve.png`
**Composition:** A white thermal blade severs the jammed links of a black mechanism.

```text
centered ability icon, orange-red flame with a white-hot core blade cutting a jammed obsidian mechanism, volcanic sparks and molten magma, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clean silhouette, empty margins --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Ability icon - Unquenched Reserve

**Installed output:** `intensity-unquenched-reserve.png`
**Composition:** A tall ribbed black reservoir contains folded orange-red flame with a white-hot core sheets beneath a broken lid.

```text
centered ability icon, black volcanic reservoir holding twin orange-red infernos with white-hot cores, orange-red lava cracks beneath its lid, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clean silhouette, empty margins --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Ability icon - Crucible Without End

**Installed output:** `intensity-crucible-without-end.png`
**Composition:** A tilted open crucible pours a magma-bound strip back through its own fractured underside.

```text
centered ability icon, broken obsidian crucible pouring an endless loop of orange-red fire with white-hot accents and orange-red lava back into itself, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, white and black dominant, hot orange and red flames, white-hot highlights, clean silhouette, empty margins --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

## Intensity completion splash rewards

Install these PNGs in `card-game-idle/src/assets/main-menu-backgrounds/`. These three backgrounds already have cosmetic-only achievement gates, each using lifetime ownership of the corresponding roster: 19 base, five Eternal, or five Infinite cards. A missing image is explicitly unavailable, not replaced with unrelated art. Keep the dramatic subject away from the left menu area.

### The First Unbroken Eruption - every base card

**Pending output:** `intensity-base-completion-splash.png`

```text
wide volcanic landscape, enormous white mountain erupting above a black obsidian sea, orange-red infernos spilling down its slopes, scattered ink islands, quiet empty space on the left, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, hot orange and red flames, white-hot highlights --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### The Five Who Command the Flame - every Eternal card

**Pending output:** `intensity-eternal-completion-splash.png`

```text
five volcanic sovereign silhouettes surrounding a cracked obsidian crown, drowned temple, split crown, white sun, hanging bell, dawn judge, orange-red infernos linking their thrones, empty space on the left, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, hot orange and red flames, white-hot highlights --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### The Inferno Without a Last Dawn - every Infinite card

**Pending output:** `intensity-infinite-completion-splash.png`

```text
enormous white phoenix carrying five erupting volcanic worlds across a black abyss, endless orange-red inferno flowing between obsidian islands, wings breaking into ink, quiet empty space on the left, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, hot orange and red flames, white-hot highlights --ar 16:9 --niji 6 --stylize 900 --no text logo watermark border yellow
```

## Intensity boss trophy profile portraits

One portrait per boss, unlocked on its first clear. Install these PNGs in `card-game-idle/src/assets/profile-pictures/intensity/`. Each is also represented by a named achievement. Until the artwork is supplied, the earned portrait uses an explicitly labeled sigil, never a broken image or another set's portrait.

Like the existing Wake trophies, keep the silhouette inside the central 75%; use the outer 25% as a crop-safe ink corona. No important details in the corners.

### The Cathedral in Flame - The Drowned Cathedral

**Pending output:** `wake-profile-intensity-cathedral.png`

```text
centered boss trophy portrait, white drowned temple rising from molten black obsidian, orange-red fire pouring through its broken arches, crown of volcanic smoke, silhouette inside central 75 percent, outer ink corona, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, hot orange and red flames, white-hot highlights --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Bearer of the Burning Crown - The Divided Crown

**Pending output:** `wake-profile-intensity-divided-crown.png`

```text
centered boss trophy portrait, divided obsidian crown floating above twin volcanic faces, orange-red inferno filling the split, white-hot crown tips, silhouette inside central 75 percent, outer ink corona, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, hot orange and red flames, white-hot highlights --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### The Noon That Burns - The Sovereign of Unbearable Noon

**Pending output:** `wake-profile-intensity-unbearable-noon.png`

```text
centered boss trophy portrait, white volcanic sun deity wearing an obsidian mask, orange-red inferno halo, molten cracks across its black shoulders, silhouette inside central 75 percent, outer ink corona, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, hot orange and red flames, white-hot highlights --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### Voice of the Volcanic Bell - The Bell That Buries Distance

**Pending output:** `wake-profile-intensity-distance-bell.png`

```text
centered boss trophy portrait, ancient obsidian bell hanging in volcanic smoke, orange-red inferno spilling from its mouth, white shockwave curling around the bell, silhouette inside central 75 percent, outer ink corona, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, hot orange and red flames, white-hot highlights --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

### The Last Dawn Ascendant - The Arbiter After the Last Dawn

**Pending output:** `wake-profile-intensity-last-dawn.png`

```text
centered boss trophy portrait, white dawn judge with cracked obsidian antlers, orange-red inferno rising behind its faceless mask, molten volcanic mantle, silhouette inside central 75 percent, outer ink corona, Chinese mythological manuscript art, expressive ink-wash painting, heavy black ink splotches, rough brushwork on white parchment, flaming infernos and volcanic molten obsidian, hot orange and red flames, white-hot highlights --ar 1:1 --niji 6 --stylize 900 --no text logo watermark border yellow
```

## Intensity artstyle tuner - Flaming Leviathan

Art test only. Do not implement this card or add it to the game roster.

```text
colossal black leviathan rising from a black ink sea, vibrant red and hot orange flames curling around its body with white-hot accents, black and white molten paint, white parchment sky and black volcanic scenery, heavy ink splotches and sweeping paint strokes, Chinese mythological manuscript art, cinematic anime ink illustration, Intensity Splotched Ink style lock, white and black dominant, only red and orange flame accents --ar 3:4 --niji 6 --stylize 900 --no text logo watermark border yellow
```
