import { CardRegistry } from '@/cards/CardRegistry';
import { getTrialDeckDefinition } from '@/data/trialDecks';
import {
  SET_ENGINE_GUIDES,
  getEngineKeyForCard,
  type EngineKey,
  type GuideSection,
} from '@/ui/setEngineSummary';

export interface CoreMechanicPlaystyle {
  name: string;
  pattern: string;
  pilotTips: string;
  winCondition: string;
}

export interface CoreMechanicAdvancedLine {
  name: string;
  sequence: string;
  whyItWorks: string;
}

export interface CoreMechanicMistake {
  mistake: string;
  consequence: string;
  correction: string;
}

export interface CoreMechanicEffectExample {
  cardName: string;
  effectSummary: string;
}

export interface CoreMechanicContent {
  engineKey: EngineKey;
  title: string;
  intro: string;
  sections: GuideSection[];
  exampleCardIds: string[];
  playstyles: CoreMechanicPlaystyle[];
  advancedLines: CoreMechanicAdvancedLine[];
  commonMistakes: CoreMechanicMistake[];
  exampleEffects: CoreMechanicEffectExample[];
}

const PLAYSTYLE_MAP: Record<EngineKey, CoreMechanicPlaystyle[]> = {
  neutrality: [
    {
      name: 'Patience Ramp',
      pattern: 'Open with Seraphim + draw Ophanim loops, then delay attacks until 4-8 stacks are banked.',
      pilotTips: 'Do not fire early unless lethal or hand-starved. Every extra card played is hidden damage.',
      winCondition: 'One or two high-stack Seraphim attacks with threshold draws to bridge into the next burst.',
    },
    {
      name: 'Angel Doubled Patience',
      pattern: 'Build medium stacks first, then summon Angel and double to force a compressed finisher turn.',
      pilotTips: 'Hold doubling effects for the turn where attacks are ready or nearly ready.',
      winCondition: 'Explosive double-stack conversion plus bonus draw refill for follow-up pressure.',
    },
  ],
  light: [
    {
      name: 'Radiance Build',
      pattern: 'Stack Radiance from Light plays before spending on Halo cashouts.',
      pilotTips: 'Keep tempo Light plays going so Radiance climbs steadily; do not spend early on weak lines.',
      winCondition: 'A high-Radiance base state that powers your Seraphim payoff turns.',
    },
    {
      name: 'Radiance and Halo Cashout',
      pattern: 'Spend Radiance and Halo only when Radiance and Halo are already stocked.',
      pilotTips: 'If Radiance or Halo is weak, keep building instead of firing your threshold cards early.',
      winCondition: 'One prepared burst turn where Radiance and Halo convert together.',
    },
  ],
  thornbound: [
    {
      name: 'Trail Into Scar',
      pattern: 'Build Trail with early Thornbound cards, then convert Trail into Scar one point at a time.',
      pilotTips: 'Do not rush conversion; keep enough Trail to continue playing before clicking into Scar.',
      winCondition: 'Stable turn where Scar reaches threshold 2 or 4 without stalling card flow.',
    },
    {
      name: 'Spiral Staging',
      pattern: 'Use Eternal Thornbound generators and converters to stage Briar Spiral before your payoff turn.',
      pilotTips: 'Do not bloom too early; wait until Trail and Scar are already in a good breakpoint state.',
      winCondition: 'A bloom turn that amplifies a prepared Trail/Scar line instead of trying to rescue a weak setup.',
    },
    {
      name: 'Threshold Climb',
      pattern: 'Treat Scar thresholds as checkpoints: 2 first, then 4, then 6 when available.',
      pilotTips: 'Play threshold-sensitive cards after the breakpoint is online, not before.',
      winCondition: 'Multiple cards gaining bonus effects from the same Scar threshold.',
    },
  ],
  mechanical: [
    {
      name: 'Tick Discipline',
      pattern: 'Advance ticks with low-risk cards, then line up your strongest cards right before Chime.',
      pilotTips: 'Think in 3-tick cycles: plan now for what happens when the next Chime lands.',
      winCondition: 'Repeated Chime cycles where each burst arrives on a favorable board state.',
    },
    {
      name: 'Prime Conversion',
      pattern: 'Let Chime trigger on any play, then spend the stored prime on your next Mechanical attack.',
      pilotTips: 'Do not panic-cash a prime on a weak attack unless you must stabilize immediately.',
      winCondition: 'Every stored prime converts into a high-value attack window.',
    },
    {
      name: 'Strain Rhythm',
      pattern: 'Build Strain before Chime, spend during Chime, then rebuild before the next interval.',
      pilotTips: 'If Strain is low at Chime timing, delay payoff and rebuild first.',
      winCondition: 'Consistent build -> chime -> spend cadence without dead turns.',
    },
  ],
  prismatic: [
    {
      name: 'Channel Carousel',
      pattern: 'Rotate channels aggressively to build distinct coverage and refraction depth.',
      pilotTips: 'Repeated channel spam lowers payoff ceiling even if it feels tempo-positive.',
      winCondition: 'Depth + Prism Charge setup converts into a clean fixed-spend burst turn.',
    },
    {
      name: 'Prism Charge Banking',
      pattern: 'Switch channels early to bank Prism Charge before spending cards come online.',
      pilotTips: 'Do not spend at 1 if a 2-charge window is one switch away and still safe.',
      winCondition: 'Fixed charge spends land at 2 with strong refraction backing.',
    },
    {
      name: 'Depth-Focused Payoff',
      pattern: 'Delay your largest payout until refraction depth is established and charge is banked.',
      pilotTips: 'If depth is low, keep switching first and convert second.',
      winCondition: 'One readable payoff turn where depth and fixed spend align.',
    },
  ],
  blackGlass: [
    {
      name: 'Twin Flame Balance',
      pattern: 'Grow White and Black Flame in tandem, then route into Fracture-positive lines.',
      pilotTips: 'Big imbalance creates recovery turns that slow your kill clock.',
      winCondition: 'Balanced burst turn where flame gap stays low and Fracture is already online.',
    },
    {
      name: 'Eclipse Staging',
      pattern: 'Use Eternal/Infinite builders to bank Eclipse before committing burst cards.',
      pilotTips: 'Do not detonate Eclipse early on weak Fracture or bad flame gap.',
      winCondition: 'One prepared spend window where Eclipse and board state peak together.',
    },
    {
      name: 'Detonation Endgame',
      pattern: 'Checkpoint spends into a final all-Eclipse detonation finisher.',
      pilotTips: 'Sequence smaller spends before the apex burst so no Eclipse value is stranded.',
      winCondition: 'High-value finisher turn where Infinity cards convert the remaining Eclipse bank.',
    },
  ],
  snowbound: [
    {
      name: 'Frost Stockpile',
      pattern: 'Use Frost cards to bank Arctic Charge before you even think about spending.',
      pilotTips: 'A real Voltage turn starts with a patient Frost turn.',
      winCondition: 'A stocked battery that makes the first Voltage spender matter.',
    },
    {
      name: 'Voltage Release',
      pattern: 'Move into Voltage only when there is enough Arctic Charge banked to justify the cashout.',
      pilotTips: 'Voltage with an empty battery is just a weak card.',
      winCondition: 'Burst turns where stored charge gets converted immediately.',
    },
    {
      name: 'Phase Discipline',
      pattern: 'Treat Frost as setup and Voltage as payoff; do not ask one side to do both jobs.',
      pilotTips: 'Snowbound gets simpler when each phase has a clear role.',
      winCondition: 'Clean turns where setup and payoff are separated on purpose.',
    },
    {
      name: 'Capacitor Timing',
      pattern: 'In Eternity and Infinity lines, bank Polar Capacitors first, then release them in the phase that matches your plan.',
      pilotTips: 'Release in Voltage for damage, or release in Frost when you need one more battery setup cycle.',
      winCondition: 'Polar Capacitor spends amplify your chosen phase instead of being dumped at random.',
    },
  ],
  glassAbsolute: [
    {
      name: 'Fragment Flood',
      pattern: 'Prioritize rapid Glass board presence to reach 3, 5, and 7 fragment tiers early.',
      pilotTips: 'Base Glass is cleaner when you value fragment count over fancy sequencing.',
      winCondition: 'Tiered formation bonuses online before your main attack window.',
    },
    {
      name: 'Formation Discipline',
      pattern: 'Treat early turns as setup only, then spend payoff cards after hitting 5+ fragments.',
      pilotTips: 'Do not fire finishers while still below Tier 2 formation.',
      winCondition: 'Consistent mid-turn cashouts once dense formation is established.',
    },
    {
      name: 'Overlay Optionality',
      pattern: 'Once base formation tiers are online, build and spend Refraction Charge with Eternal and Infinite cards for amplified cashouts.',
      pilotTips: 'Treat Refraction Charge as one shared higher-rarity resource, not as multiple side systems.',
      winCondition: 'Base fragments provide the window; Refraction Charge multiplies that same window.',
    },
  ],
  pyro: [
    {
      name: 'Heat Climb',
      pattern: 'Open with pure Heat gain lines and keep Heat rising every step of the turn.',
      pilotTips: 'Treat every non-Heat action as a cost before your burst window, because it weakens both attack scaling and burst value.',
      winCondition: 'Major Heat band online, then attacks and burst cards both cash higher.',
    },
    {
      name: 'Overlay Ember Window',
      pattern: 'With Eternal or Infinite Fire cards active, keep Heat online first, then build Chroma before your higher-rarity attack window.',
      pilotTips: 'Chroma Embers are consumed by higher-rarity Fire attacks, so sequence burst and attack timing on purpose.',
      winCondition: 'Heat-scaled attack plus Chroma bonus on a single focused higher-rarity strike.',
    },
    {
      name: 'Band Timing',
      pattern: 'Delay burst until crossing Heat breakpoints at 5, 10, and 15.',
      pilotTips: 'Band jumps are the biggest payoff spikes; do not spend one step early.',
      winCondition: 'Burst after entering a hotter Heat band instead of settling for low-band payouts.',
    },
    {
      name: 'Streak Detonation',
      pattern: 'String together uninterrupted Heat gains, then convert the streak into burst damage.',
      pilotTips: 'A long streak often beats one extra card of flat value.',
      winCondition: 'High-streak burst that converts both Heat growth and consistency multiplier.',
    },
    {
      name: 'Infinite Fire Roles',
      pattern: 'Use the Fire Infinite cards as single-purpose anchors: Chroma seeder, threshold transmuter, reserve accumulator, or apex finisher.',
      pilotTips: 'Do not try to make every Infinite card do everything. Pick the one that matches the turn state you already have.',
      winCondition: 'Each Infinite card has one obvious job and the guide text matches the job it actually performs.',
    },
  ],
  blazingGarden: [
    {
      name: 'Burn Uptime',
      pattern: 'Get multiple Blazing Garden units into Burn and keep them alive through the turn cycle.',
      pilotTips: 'Your payoff turns are weaker if you let Burn density drop to one unit.',
      winCondition: 'Two or more Burn units stay active while your lineages continue branching.',
    },
    {
      name: 'Three-Lineage Bloom',
      pattern: 'Establish rose, sunflower, and thistle before major bloom payoffs.',
      pilotTips: 'Two-lineage turns are setup, not finishers.',
      winCondition: 'Final chord bloom that resolves all lineages in one sequence.',
    },
    {
      name: 'Grove Echo Loop',
      pattern: 'Play Eternal generators first, then spend banked Wild Pollen through seeded payoffs while Echo pulls rebuild pressure.',
      pilotTips: 'Do not seed early on a low bank; wait until your Eternal pollen line is online and Burn uptime is stable.',
      winCondition: 'A single turn that links Eternal pollen generation into one or more high-value seed conversions.',
    },
  ],
  butterfly: [
    {
      name: 'Formation Cycle',
      pattern: 'Play distinct Butterfly unit types early so Formation reaches 4 before your main conversion turn.',
      pilotTips: 'Duplicate unit types are fine for value, but they do not advance Formation in the same cycle.',
      winCondition: 'All four types logged with a stocked Spectrum bar entering payoff.',
    },
    {
      name: 'Threshold Ladder',
      pattern: 'Climb Spectrum through 4 and 8 before committing your strongest release sequence.',
      pilotTips: 'Early release lines reduce pressure and can miss upgraded threshold windows.',
      winCondition: 'Major-tier release backed by a complete Formation cycle.',
    },
    {
      name: 'Descent Turn',
      pattern: 'Route one decisive 12-Spectrum Descent turn rather than many medium releases.',
      pilotTips: 'Descent resets Spectrum and Formation, so cash your best attacks/releases first.',
      winCondition: 'A reset turn that converts full setup into immediate board pressure.',
    },
    {
      name: 'Wing Resonance Overlay',
      pattern: 'On Eternity/Infinite turns, bank Wing Resonance first, then spend it after Spectrum and Formation are already prepared.',
      pilotTips: 'Treat Resonance as an amplifier of your base loop, not a replacement for Formation sequencing.',
      winCondition: 'A single higher-rarity conversion line where Resonance, Spectrum, and Formation all peak together.',
    },
  ],
  eternalSeas: [
    {
      name: 'Dual Flow Setup',
      pattern: 'Activate both white and black flows early to unlock margin growth.',
      pilotTips: 'Single-flow turns are safe but cap your upside.',
      winCondition: 'Margin-backed release with both flows active.',
    },
    {
      name: 'Current Banking',
      pattern: 'Stock current until release cards can convert at high efficiency.',
      pilotTips: 'Do not spend current when margin is still low.',
      winCondition: 'One or two large current conversions instead of repeated drips.',
    },
    {
      name: 'Veilmargin Convergence',
      pattern: 'Time peak releases around margin spikes from balanced flow states.',
      pilotTips: 'Your strongest turn is where both flow counters remain live after release.',
      winCondition: 'Convergence burst that preserves enough tempo for a second wave.',
    },
  ],
  abyssalForge: [
    {
      name: 'Charge Then Recast',
      pattern: 'Accumulate Reforge Charges before triggering recast sequences.',
      pilotTips: 'Recasting on a low charge total wastes your best forge cards.',
      winCondition: 'Dense recast turn with stacked replay value.',
    },
    {
      name: 'Imprint Overlay Economy',
      pattern: 'Use Eternal and Infinite cards to build Imprint on played-card ledger entries, then spend it in prepared windows.',
      pilotTips: 'Treat Imprint as a committed spend resource; do not cash it before your recast targets are ready.',
      winCondition: 'A spend window where Imprint conversion lands on your highest-value replay line.',
    },
    {
      name: 'Imprint Finish Window',
      pattern: 'Sequence base recast pressure first, then convert Imprint into targeted recasts or direct burst to close the turn.',
      pilotTips: 'Imprint finishers are strongest after setup, not as recovery tools from an unstable board.',
      winCondition: 'Closing sequence where base forge setup and Imprint spend effects peak together.',
    },
  ],
  deathFlamedHell: [
    {
      name: 'Veil Setup',
      pattern: 'Play base cards, then flip them to hide or reveal the line depending on how safe the turn is.',
      pilotTips: 'If the board is not ready, keep the card veiled and bank Ember instead of forcing a reveal.',
      winCondition: 'A clean reveal turn where the back-face setup turns into a burst sequence.',
    },
    {
      name: 'Veil Rite Overlay',
      pattern: 'Use Eternal and Infinite cards to stock Veil Marks, then reveal a base card to consume marks in one conversion.',
      pilotTips: 'Do not spend the reveal on a low-pressure board; Veil Marks are best when paired with your prepared base burst.',
      winCondition: 'A reveal window where Eternal marks and base setup cash out together.',
    },
    {
      name: 'Reveal Finish',
      pattern: 'Use Crown pressure and the flipped face together for the final burst.',
      pilotTips: 'Do not reveal too early unless the burst actually closes the turn.',
      winCondition: 'A reveal turn that spends the loaded Crown side without wasting setup.',
    },
  ],
  wishedUponAStar: [
    {
      name: 'Starlight Ramp',
      pattern: 'Build starlight aggressively while preserving dream lattice growth lines.',
      pilotTips: 'Starlight without dream scaling underperforms your best payoffs.',
      winCondition: 'Wish burst line with both pools elevated.',
    },
    {
      name: 'Lattice Amplifier',
      pattern: 'Use support turns to deepen dream lattice before major cashouts.',
      pilotTips: 'Think of lattice as multiplier, not filler resource.',
      winCondition: 'Amplified starbirth turn with strong conversion coefficients.',
    },
    {
      name: 'Constellation Lock',
      pattern: 'Bank star crowns and trigger lock release only at premium density.',
      pilotTips: 'Do not release crowns just because they are available.',
      winCondition: 'Three-layer finish: burst, lock release, then starbirth cleanup.',
    },
  ],
};

const ADVANCED_LINES_MAP: Record<EngineKey, CoreMechanicAdvancedLine[]> = {
  neutrality: [
    {
      name: 'Double-Threshold Window',
      sequence: 'Set two Seraphim just below threshold, then fire one draw-heavy Ophanim sequence to cross both before attacks.',
      whyItWorks: 'You convert one setup burst into two threshold draw payouts and keep hand velocity high.',
    },
  ],
  light: [
    {
      name: 'Anchor-Protected Repeat',
      sequence: 'Spend an anchor on a deliberate repeated note during your highest payoff turn.',
      whyItWorks: 'You preserve Radiance while still taking the strongest immediate line.',
    },
    {
      name: 'Halo Threshold Snap',
      sequence: 'Bank Halo through setup, then cross a spend threshold immediately before your highest-value Light payoff.',
      whyItWorks: 'Late Halo conversion compresses more Oblivion into a single protected burst window.',
    },
  ],
  thornbound: [
    {
      name: 'Pre-Threshold Queue',
      sequence: 'Stack Trail in hand and board first, then convert into Scar until the next breakpoint is reached before playing payoffs.',
      whyItWorks: 'You guarantee threshold checks are live before consuming your best cards.',
    },
    {
      name: 'Infinity Spiral Ladder',
      sequence: 'Open with Gravebloom Singularity to forge Spirals, refine with Last Procession, spike with Thorn Widow, then close with Elegy Titan.',
      whyItWorks: 'Each Infinity card performs a distinct amplifier job, so sequencing all four roles creates a larger final bloom window than repeating one role.',
    },
  ],
  mechanical: [
    {
      name: 'Two-to-Chime Setup',
      sequence: 'When the clock is two ticks from Chime, play setup now so your best card lands on or right after Chime.',
      whyItWorks: 'You convert predictable timing into better burst alignment without extra complexity.',
    },
    {
      name: 'Stored Prime Transfer',
      sequence: 'Allow Chime to trigger on a non-attack play, then transfer that prime into your next Mechanical attack.',
      whyItWorks: 'You never lose Chime value to sequencing order, and you keep attacks for peak timing.',
    },
  ],
  prismatic: [
    {
      name: 'Four-Channel Ramp',
      sequence: 'Touch four unique channels before committing your highest fixed Prism Charge spends.',
      whyItWorks: 'Distinct channels and depth both rise naturally while charge is being banked.',
    },
    {
      name: 'Switch-Then-Spend',
      sequence: 'Use one final channel switch before payoff to secure both depth gain and +1 Prism Charge.',
      whyItWorks: 'The last setup card does two jobs at once and makes the payoff line cleaner.',
    },
  ],
  blackGlass: [
    {
      name: 'Balance-First Burst',
      sequence: 'Stabilize white/black gap, then spend 4-6 Eclipse on your first converter.',
      whyItWorks: 'Early checkpoint spends gain stronger scaling when flame parity is already established.',
    },
    {
      name: 'Two-Stage Infinity Detonation',
      sequence: 'Use a checkpoint Eclipse spend first, then close the turn with a full-bank Infinity burst.',
      whyItWorks: 'Staging avoids overcap waste and lets the finisher consume only premium remaining Eclipse.',
    },
  ],
  snowbound: [
    {
      name: 'Frost-Then-Voltage Pair',
      sequence: 'Use one or two Frost cards to bank Arctic Charge, then pivot directly into a Voltage spender.',
      whyItWorks: 'The payoff turn is stronger when the battery is already stocked.',
    },
    {
      name: 'Double-Frost Setup',
      sequence: 'Stay on Frost long enough to build a serious charge pool before the first Voltage release.',
      whyItWorks: 'Snowbound is cleaner when setup turns are allowed to be real setup turns.',
    },
    {
      name: 'Capacitor Phase Pivot',
      sequence: 'Bank Polar Capacitors on setup turns, then release them after you intentionally lock to Frost or Voltage.',
      whyItWorks: 'The same capacitor bank becomes either bonus Oblivion or bonus Arctic Charge based on current phase.',
    },
  ],
  glassAbsolute: [
    {
      name: 'Tier-First Curve',
      sequence: 'Play Glass setup pieces until 3+ fragments, then delay major spenders until 5+ fragments.',
      whyItWorks: 'Most base Glass value now comes from formation tiers, not side resources.',
    },
    {
      name: 'Refraction Spend Window',
      sequence: 'Use Eternal cards to bank Refraction Charge, then spend that charge during your 5+ fragment formation turn.',
      whyItWorks: 'One shared Eternal resource keeps the overlay simple while directly amplifying the base loop.',
    },
    {
      name: 'Infinite Charge Conversion',
      sequence: 'Enter Infinite lines with 8+ Refraction Charge and 5+ fragments, then cash queue or ledger riders in the same window.',
      whyItWorks: 'Infinite Glass now uses the same charge track at stronger thresholds instead of a separate subsystem.',
    },
  ],
  pyro: [
    {
      name: 'Heat Build Line',
      sequence: 'Play Stoke cards first to raise Heat, then use Heat-scaled cards before ending on a burst spender.',
      whyItWorks: 'Heat boosts both Fire attacks and base burst payouts, so sequencing builders before spenders compounds value.',
    },
    {
      name: 'Threshold Burst Timing',
      sequence: 'Delay burst cards until Heat reaches the major band, then spend once in a single payoff window.',
      whyItWorks: 'Pyro cards are strongest when you avoid early low-value spends and convert one stacked Heat bank.',
    },
    {
      name: 'Overlay Finish Window',
      sequence: 'On Eternal/Infinite/Transcendent turns, keep base Heat online first, then add Inferno + Chroma before your final finisher.',
      whyItWorks: 'Higher-tier Fire cards scale best when overlays are layered onto a prepared Heat core rather than replacing it.',
    },
  ],
  blazingGarden: [
    {
      name: 'Eternal Bank Into Seed Burst',
      sequence: 'Open with one or two Eternal Wild Pollen generators, then route into your strongest seed card after lineages and Burn are established.',
      whyItWorks: 'You convert stable board state plus a real pollen bank into a much larger single-window payoff.',
    },
    {
      name: 'Echo Stock Timing',
      sequence: 'Delay high-value echo re-entry until three-lineage state is active.',
      whyItWorks: 'Echo cards gain much larger value when all lineage modifiers are online.',
    },
  ],
  butterfly: [
    {
      name: 'Four-Type Ladder',
      sequence: 'Sequence Seraphim, Cherubim, Ophanim, and Angel before your first heavy release card.',
      whyItWorks: 'Completing Formation early gives cleaner payoff windows and stronger cycle planning.',
    },
    {
      name: 'Major-Then-Descent Sequence',
      sequence: 'Push to 8 first, spend a major-tier release, then close the same line at 12 for Descent reset.',
      whyItWorks: 'This compresses both breakpoint rewards into one high-density conversion window.',
    },
    {
      name: 'Resonance Compression Line',
      sequence: 'Use Eternity/Infinite cards to bank Wing Resonance before your apex card, then cash it after Formation is complete and Spectrum is already high.',
      whyItWorks: 'Resonance coefficients scale harder when they convert live Spectrum and Formation in the same turn.',
    },
  ],
  eternalSeas: [
    {
      name: 'Undertow Burst Turn',
      sequence: 'Stack Undertow with your setup cards first, then fire one or two release cards in the same turn before the pool goes idle.',
      whyItWorks: 'Base Eternal Seas rewards compact same-turn sequencing, and higher-rarity cards keep that same line by amplifying it through Deepwake.',
    },
    {
      name: 'Foam Skim Refresh',
      sequence: 'Use release cards to skim Foam, then click Spend 5 Foam -> Draw 1 only when you need the extra extender.',
      whyItWorks: 'Foam is strongest as a light refill tool that keeps your release turn moving without bloating the mechanic count.',
    },
  ],
  abyssalForge: [
    {
      name: 'Charge-Backed Recast',
      sequence: 'Bank Charges first, then fire recast sequences while Crown stock is still growing.',
      whyItWorks: 'Recast density increases without sacrificing your final Crown payout.',
    },
    {
      name: 'Ledger Compression',
      sequence: 'Load high-impact plays into the ledger before triggering your strongest recast tools.',
      whyItWorks: 'A stronger ledger baseline means each replayed effect is worth more.',
    },
  ],
  deathFlamedHell: [
    {
      name: 'Veil Timing',
      sequence: 'Flip a base card only after the Ember side is already lined up.',
      whyItWorks: 'You avoid wasting reveal value by keeping the line veiled until the board is ready.',
    },
    {
      name: 'Eternal Marked Reveal',
      sequence: 'Play an Eternal or Infinite card to bank Veil Marks, then reveal a prepared base card in the same pressure window.',
      whyItWorks: 'This converts one shared Eternal/Infinite mechanic directly into your base reveal line instead of creating a detached side engine.',
    },
  ],
  wishedUponAStar: [
    {
      name: 'Lattice-Buffered Burst',
      sequence: 'Deepen dream lattice before firing starlight cashouts.',
      whyItWorks: 'Dream scaling multiplies each starlight conversion more than flat starlight alone.',
    },
    {
      name: 'Crown Lock Finale',
      sequence: 'Bank star crowns, trigger lock release, then follow with starbirth conversions.',
      whyItWorks: 'Lock release creates the cleanest setup for your highest starbirth output.',
    },
  ],
};

const COMMON_MISTAKES_MAP: Record<EngineKey, CoreMechanicMistake[]> = {
  neutrality: [
    { mistake: 'Attacking too early', consequence: 'Low stack conversion and missed threshold draws.', correction: 'Delay attacks until meaningful stack and threshold values are reached.' },
  ],
  light: [
    { mistake: 'Firing Light Ophanim on weak turns', consequence: 'Radiance drains without a payoff line ready.', correction: 'Hold Light Ophanim until Seraphim/Angel attacks are online.' },
    { mistake: 'Spending Halo too soon', consequence: 'Eternity/Infinity Light cards convert below expected value.', correction: 'Build Radiance first, then spend Halo on a protected burst turn.' },
  ],
  thornbound: [
    { mistake: 'Converting too early', consequence: 'You run out of Trail and cannot continue your setup sequence.', correction: 'Build Trail first, then convert in short bursts.' },
    { mistake: 'Playing payoffs below threshold', consequence: 'Scar riders underperform and turns feel flat.', correction: 'Delay those cards until Scar 2+ or Scar 4+ is active.' },
    { mistake: 'Blooming Briar Spiral too soon', consequence: 'Eternal amplification lands before Trail/Scar is ready and the turn ceiling collapses.', correction: 'Treat Briar Spiral as a finisher amplifier, not a setup substitute.' },
    { mistake: 'Using Infinity roles out of order', consequence: 'You spend finisher pieces before Spiral and crown banks are prepared, cutting your top-end burst.', correction: 'Sequence forge -> refine -> surge -> finisher so each Infinity card amplifies the next one.' },
  ],
  mechanical: [
    { mistake: 'Ignoring the next Chime tick', consequence: 'High-value cards miss the best timing window.', correction: 'Track ticks-to-Chime and plan one or two plays ahead.' },
    { mistake: 'Spending primed Chime on weak attacks', consequence: 'Burst potential is wasted and tempo collapses.', correction: 'Hold prime for a meaningful Mechanical attack unless survival is at risk.' },
  ],
  prismatic: [
    { mistake: 'Channel repetition', consequence: 'Distinct-channel scaling stalls.', correction: 'Rotate channels aggressively during setup turns.' },
    { mistake: 'Premature fixed spend', consequence: 'Prism Charge and depth are both underbuilt.', correction: 'Delay charge spend cards until depth is established and 2-charge windows are available.' },
  ],
  blackGlass: [
    { mistake: 'Extreme flame imbalance', consequence: 'Balance-scaled Eclipse bursts underperform.', correction: 'Feed the lower flame track before committing burst cards.' },
    { mistake: 'Spending Eclipse on weak setup', consequence: 'You lose your best detonation window for low return.', correction: 'Bank Eclipse first, then spend when Fracture and parity are online.' },
  ],
  snowbound: [
    { mistake: 'Using Voltage with no stored charge', consequence: 'Payoff turns land flat.', correction: 'Bank Arctic Charge in Frost before spending cards in Voltage.' },
    { mistake: 'Using Frost as a finisher', consequence: 'You stay in setup mode and miss the burst window.', correction: 'Let Frost build the battery and let Voltage cash it out.' },
    { mistake: 'Releasing Polar Capacitors in the wrong phase', consequence: 'You miss the intended conversion and waste an Eternity payoff window.', correction: 'Confirm phase first: Voltage for Oblivion release, Frost for Arctic Charge release.' },
  ],
  glassAbsolute: [
    { mistake: 'Spending before fragment tiers', consequence: 'Charge conversions land below intended value.', correction: 'Push to at least 5 fragments before major Refraction spends.' },
    { mistake: 'Entering Infinite lines undercharged', consequence: 'Queue and ledger riders underperform or stall.', correction: 'Build Refraction Charge first, then trigger Infinite conversion windows.' },
  ],
  pyro: [
    { mistake: 'Bursting below Heat breakpoints', consequence: 'You cash out before the strongest payout rates are active.', correction: 'Delay burst until Heat crosses 5, 10, or ideally 15+.' },
    { mistake: 'Breaking your Heat ramp mid-turn', consequence: 'Your burst turn lands before scaling is online.', correction: 'Sequence Heat-building effects before pressing burst cards.' },
    { mistake: 'Firing attacks at low Heat', consequence: 'Seraphim and Angel attacks miss their Heat-based multiplier.', correction: 'Delay attacks until Heat is built unless survival requires an immediate hit.' },
    { mistake: 'Misordering higher-rarity overlays', consequence: 'You miss Chroma Ember attack scaling and lose same-turn value.', correction: 'In Eternal/Infinite Fire lines, keep Heat online first, then layer Chroma before your attack window.' },
  ],
  blazingGarden: [
    { mistake: 'Skipping Eternal generators', consequence: 'Seed effects fire on an empty or weak Wild Pollen bank.', correction: 'Sequence Eternal pollen generation before your first major seed spend.' },
    { mistake: 'Spending with two lineages only', consequence: 'Final bloom ceiling is capped.', correction: 'Establish all three lineages before primary finisher turns.' },
  ],
  butterfly: [
    { mistake: 'Early release spending', consequence: 'You miss major thresholds and lower your Descent ceiling.', correction: 'Climb to 8 first, then route your largest release sequence.' },
    { mistake: 'Ignoring Formation coverage', consequence: 'Cycle planning becomes inconsistent and payoff turns lose structure.', correction: 'Track missing unit types and complete Formation before all-in conversions.' },
    { mistake: 'Spending Wing Resonance on low setup', consequence: 'Higher-rarity cards underperform because Spectrum/Formation scalers are weak.', correction: 'Bank Resonance first, then cash it only after your Formation and Spectrum are already online.' },
  ],
  eternalSeas: [
    { mistake: 'Single-flow tunneling', consequence: 'Margin charge scaling stays low.', correction: 'Activate and maintain both white and black flows.' },
    { mistake: 'Current spend at low margin', consequence: 'Resource-to-damage efficiency underperforms.', correction: 'Wait for margin spikes before major release cards.' },
  ],
  abyssalForge: [
    { mistake: 'Recasting on low charge', consequence: 'Ledger replay lines are weak.', correction: 'Bank charges first, then trigger recast chains.' },
    { mistake: 'Splitting pearl/crown economy', consequence: 'One payoff pool is stranded.', correction: 'Plan turns that cash both resources in the same conversion window.' },
  ],
  deathFlamedHell: [
    { mistake: 'Flipping too early', consequence: 'The reveal has no pressure behind it.', correction: 'Keep the line veiled until Ember and Crown pressure are both online.' },
    { mistake: 'Spending Veil Marks on a weak reveal', consequence: 'Your Eternal/Infinite overlay converts for low value.', correction: 'Charge marks first, then reveal only when the base line can actually capitalize.' },
    { mistake: 'Never revealing', consequence: 'You sit on setup and never cash the turn.', correction: 'Use the back face as setup, then flip when you can actually close.' },
  ],
  wishedUponAStar: [
    { mistake: 'Starlight over lattice', consequence: 'Cashouts lack multiplier depth.', correction: 'Invest support turns into dream lattice before burst turns.' },
    { mistake: 'Early crown release', consequence: 'Lock finishers underperform.', correction: 'Hold crown spend until burst and starbirth routes are both prepared.' },
  ],
};

function pickEngineKey(packId: string, packCardPool: string[]): EngineKey | null {
  const trial = getTrialDeckDefinition(packId);
  if (trial) {
    for (const step of trial.guideSteps) {
      const def = CardRegistry.get(step.cardDefinitionId);
      if (!def) continue;
      const key = getEngineKeyForCard(def);
      if (key) return key;
    }
  }

  for (const cardId of packCardPool) {
    const def = CardRegistry.get(cardId);
    if (!def) continue;
    const key = getEngineKeyForCard(def);
    if (key) return key;
  }

  return null;
}

function getExampleCardIds(packId: string, packCardPool: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (id: string | undefined) => {
    if (!id) return;
    if (seen.has(id)) return;
    if (!CardRegistry.get(id)) return;
    seen.add(id);
    out.push(id);
  };

  const trial = getTrialDeckDefinition(packId);
  if (trial) {
    for (const step of trial.guideSteps) push(step.cardDefinitionId);
  }

  const cardPoolDefs = packCardPool
    .map(id => CardRegistry.get(id))
    .filter((d): d is NonNullable<ReturnType<typeof CardRegistry.get>> => d !== undefined);

  const byType: Record<string, string | undefined> = {
    Ophanim: cardPoolDefs.find(d => d.type === 'Ophanim')?.definitionId,
    Cherubim: cardPoolDefs.find(d => d.type === 'Cherubim')?.definitionId,
    Seraphim: cardPoolDefs.find(d => d.type === 'Seraphim')?.definitionId,
    Angel: cardPoolDefs.find(d => d.type === 'Angel')?.definitionId,
  };

  push(byType.Ophanim);
  push(byType.Cherubim);
  push(byType.Seraphim);
  push(byType.Angel);

  for (const d of cardPoolDefs) push(d.definitionId);

  return out.slice(0, 8);
}

function getExampleEffects(packId: string): CoreMechanicEffectExample[] {
  const trial = getTrialDeckDefinition(packId);
  if (!trial) return [];

  return trial.guideSteps.slice(0, 6).map(step => {
    const def = CardRegistry.get(step.cardDefinitionId);
    return {
      cardName: def?.name ?? step.cardDefinitionId,
      effectSummary: step.hint,
    };
  });
}

export function buildCoreMechanicContent(packId: string, packCardPool: string[]): CoreMechanicContent | null {
  const key = pickEngineKey(packId, packCardPool);
  if (!key) return null;

  const guide = SET_ENGINE_GUIDES[key];
  if (!guide) return null;

  return {
    engineKey: key,
    title: guide.title,
    intro: guide.intro,
    sections: guide.sections,
    exampleCardIds: getExampleCardIds(packId, packCardPool),
    playstyles: PLAYSTYLE_MAP[key],
    advancedLines: ADVANCED_LINES_MAP[key],
    commonMistakes: COMMON_MISTAKES_MAP[key],
    exampleEffects: getExampleEffects(packId),
  };
}
