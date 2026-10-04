import { useLayoutEffect, useRef, useState } from 'react';
import { uiTypography } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { RARITY_TIERS, CARD_BORN_TIERS, TUTORIAL_SECTIONS } from '@/data/tutorialContent';
import { AIN_SOPH_AUR_SUMMON_STACK_REWARD, SOPH_FLIP_CHARGE_REQUIRED } from '@/systems/cards/AinSophRuntime';
import { MASTERY_TIERS } from '@/systems/progression/cardMastery';
import { ABILITY_DEFINITIONS } from '@/data/abilities/abilityDefinitions';
import { CUSTOM_MAIN_MENU_BACKGROUND_REWARDS } from '@/data/profile/customMainMenuBackgrounds';
import { CROWN_BACKGROUND_REWARDS } from '@/data/profile/crownBackgroundRewards';
import { ACHIEVEMENT_CATEGORIES } from '@/systems/progression/achievementCategories';
import './TutorialModal.css';

interface Props {
  onClose: () => void;
}

const DISPLAY_FONT = uiTypography.display;
const BODY_FONT = uiTypography.body;

// Use the shared profile palette so this reference screen follows the rest of the UI.
const PALETTE = {
  panel: 'linear-gradient(180deg, var(--profile-surface) 0%, var(--profile-surface-muted) 100%)',
  panelAlt: 'linear-gradient(180deg, var(--profile-surface-strong) 0%, var(--profile-surface) 100%)',
  border: 'var(--profile-border-strong)',
  borderSoft: 'var(--profile-border)',
  ink: 'var(--profile-text)',
  inkDeep: 'var(--profile-accent)',
  inkMuted: 'var(--profile-text-muted)',
  inkSoft: 'var(--profile-text-soft)',
  accent: 'var(--profile-accent-soft)',
};

interface Section {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  body: React.ReactNode;
}

// --- Reusable small primitives -------------------------------------------------

const cardStyle: React.CSSProperties = {
  background: PALETTE.panel,
  border: `1px solid ${PALETTE.borderSoft}`,
  borderRadius: 12,
  padding: '20px 24px',
};

const cardAltStyle: React.CSSProperties = {
  ...cardStyle,
  background: PALETTE.panelAlt,
};

const bodyTextStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.7,
  color: PALETTE.ink,
  fontFamily: BODY_FONT,
};

const inlineTagStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 7px',
  borderRadius: 6,
  background: 'color-mix(in srgb, var(--profile-accent) 18%, transparent)',
  border: `1px solid ${PALETTE.borderSoft}`,
  color: PALETTE.inkDeep,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.3,
  margin: '0 1px',
};

function Tag({ children }: { children: React.ReactNode }) {
  return <span style={inlineTagStyle}>{children}</span>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="codex-block-heading">{children}</h2>;
}

function ListItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="codex-entry">
      <div className="codex-entry-label">
        {label}
      </div>
      <div className="codex-entry-copy">{children}</div>
    </div>
  );
}

function NumberedStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="codex-step">
      <div className="codex-step-number">{n}</div>
      <div style={{ flex: 1 }}>
        <div className="codex-step-title">
          {title}
        </div>
        <div style={bodyTextStyle}>{children}</div>
      </div>
    </div>
  );
}

// --- Section content ----------------------------------------------------------

function OverviewBody() {
  return (
    <>
      <div style={cardStyle}>
        <SectionHeading>The Loop</SectionHeading>
        <div style={bodyTextStyle}>
          Play cards to build your board and earn <Tag>Divine Light</Tag> through card effects and attacks. Other
          rewards come from quests, encounters, bosses, and login rewards. Spend Divine Light on base packs and
          eligible progression; Aberrated Shards pay for event packs. There is no passive idle income.
        </div>
      </div>

      <div className="codex-card-grid">
        <div style={cardAltStyle}>
          <SectionHeading>Currencies</SectionHeading>
          <ListItem label="Divine Light">Main currency. Card effects and attacks can earn it; Collection Power scales those gains. Spend it on packs and eligible abilities.</ListItem>
          <ListItem label="Aberrated Shards">Event currency earned from bosses, logins, achievements, and milestones. Spend it on event packs and other event rewards.</ListItem>
          <ListItem label="Card-light Shards">Created by refining eligible duplicate cards. Spend them 1:1 to add Card-light to a chosen card.</ListItem>
          <ListItem label="Shards of Transcendence">Used to acquire Forge cards and materialize Transcendent abilities. Calendar rewards can grant them directly; some bonus drops require the Forge to be open.</ListItem>
        </div>
        <div style={cardAltStyle}>
          <SectionHeading>Game Modes</SectionHeading>
          <ListItem label="Main">The core deck loop &mdash; play turns, open packs, expand the collection.</ListItem>
          <ListItem label="Wake">Eternity's Wake is a timed boss encounter. Divine Light earned during the fight damages the boss; victories can award its signature Eternal card.</ListItem>
          <ListItem label="Garden">Garden of Cards is a sequence of timed encounters. Each dungeon awards its own materials; finish the expedition to complete the run.</ListItem>
          <ListItem label="Infinitude">Craft specific Infinite cards by consuming their listed Eternal cards and required materials.</ListItem>
          <ListItem label="Forge">Open the Forge of Transcendence after clearing its event bosses and claiming/spending the Key. It contains Transcendent cards and abilities.</ListItem>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Attack Orbit Sequences</SectionHeading>
        <ListItem label="Ain / Soph">The attacking card appears in a central orbit field. Move the cursor in a complete, consistent circle around the center target to build revolution-only payout.</ListItem>
        <ListItem label="Bridge the Light">Bridge uses the same central orbit language while its Ain Soph Aur constellation remains part of the presentation. Complete revolutions are the scoring input.</ListItem>
        <ListItem label="Orbit scoring">Ain, Soph, and Bridge attacks do not use clickable stars. Straight lines, jitter, direction reversals, and random movement do not score; Shatter uses a separate star-click window.</ListItem>
        <ListItem label="Stable payout">Orbit score is uncapped and committed by the store when the sequence resolves. Attack cost, cooldown, and payout are applied atomically at resolution.</ListItem>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Quick Keys</SectionHeading>
        <div style={bodyTextStyle}>
          <Tag>?</Tag> opens this tutorial. <Tag>Esc</Tag> closes the topmost menu. <Tag>E</Tag> swaps your
          hand view with your Extra Deck (read-only preview). Click any deck or discard pile counter to inspect
          its contents. Rebind any key under Settings &rarr; Controls.
        </div>
      </div>
    </>
  );
}

function TurnFlowBody() {
  return (
    <>
      <div style={cardStyle}>
        <SectionHeading>A Single Turn</SectionHeading>
        <NumberedStep n={1} title="Begin Turn">
          Press <Tag>Begin Turn</Tag> to draw a fresh hand and begin at Spectrum Level 0. Your board and turn-scoped
          resources start fresh.
        </NumberedStep>
        <NumberedStep n={2} title="Mulligan">
          Click cards in hand to mark them for replacement, then confirm. Use it to dig for setup pieces or to
          remove dead draws.
        </NumberedStep>
        <NumberedStep n={3} title="Play Phase">
          Place <Tag>Light</Tag> and <Tag>Dark</Tag> cards in the back row as face-down Soph or face-up Ain. Play
          more cards to charge Soph cards, then flip or sacrifice them. Use Light attacks and Dark utilities,
          summon <Tag>Ain Soph Aur</Tag> from your Extra Deck with the listed materials, and use their Bridge
          attacks. Press <Tag>E</Tag> to preview your Extra Deck.
        </NumberedStep>
        <NumberedStep n={4} title="End Turn">
          Click <Tag>End Turn</Tag> to clear the board and hand, reset turn resources, and cycle cards through
          discard and draw. Ending your turn during a boss fight fails that fight; ending it during a Garden
          expedition abandons the run.
        </NumberedStep>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Timing Tips</SectionHeading>
        <ListItem label="Charge Soph">Each card played adds charge to every face-down Soph card. At 2 charge, flip it to gain stacks or sacrifice it for stacks.</ListItem>
        <ListItem label="Attack timing">Attack and persistent Dark-card cooldowns decrease as you play cards. Ability cooldowns use seconds instead.</ListItem>
        <ListItem label="Raise Spectrum">Spend Limitless Light Stacks and sacrifice a hand card to unlock higher-level cards. Keep enough low-level cards to build your turn.</ListItem>
      </div>
    </>
  );
}

function BoardBody() {
  return (
    <>
      <div style={cardStyle}>
        <SectionHeading>Board Layout</SectionHeading>
        <pre className="codex-board-diagram" style={{
          margin: 0,
          lineHeight: 1.5,
          color: PALETTE.inkDeep,
          background: 'color-mix(in srgb, var(--profile-accent) 10%, transparent)',
          border: `1px solid ${PALETTE.borderSoft}`,
          borderRadius: 8,
          padding: '10px 14px',
          textAlign: 'center',
          letterSpacing: 0.5,
        }}>
{`[ F0 ] [ F1 ] [ F2 ] [ F3 ]   <- Front: Ain Soph Aur
 [ B0 ] [ B1 ] [ B2 ] [ B3 ]   <- Back: Light / Dark`}
        </pre>
        <div style={{ ...bodyTextStyle, marginTop: 8 }}>
          Back-row Light and Dark cards can be placed face-down as <Tag>Soph</Tag> or face-up as Ain. Front-row
          cards are <Tag>Ain Soph Aur</Tag> summons. At turn end, the board and hand clear and turn-scoped resources reset. Main Deck cards cycle
          through discard and draw; Ain Soph Aur cards return to the Extra Deck.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Card Types</SectionHeading>
        <ListItem label="Light">Main Deck cards with two attacks, Ain and Soph. Both are used while the card is face-up on its Ain side; its text defines costs and scaling.</ListItem>
        <ListItem label="Dark">Main Deck utility cards. Place one as Ain to activate its effect; card text shows any cost, cooldown, or repeat-use rule.</ListItem>
        <ListItem label="Ain Soph Aur">Extra Deck summons. Select back-row cards that satisfy the summon requirements, then place the summon in the front row. They cannot be searched from the Main Deck or salvaged from discard.</ListItem>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Click Reference</SectionHeading>
        <ListItem label="Hand">Left-click places a main-deck card face-down on its Soph side. Right-click places it face-up on its Ain side.</ListItem>
        <ListItem label="Soph card">At {SOPH_FLIP_CHARGE_REQUIRED}+ charge, choose Flip to Ain or sacrifice it to convert part of the stored charge into Limitless Light Stacks.</ListItem>
        <ListItem label="Ain card">Click to choose its attack or utility action when ready.</ListItem>
        <ListItem label="Extra Deck">Click an Ain Soph Aur, choose materials, then confirm the front-row summon.</ListItem>
        <ListItem label="Field removal">Right-click any field card to open a confirmation that removes it. Main-deck cards go to discard; Ain Soph Aur cards return to the Extra Deck.</ListItem>
      </div>
    </>
  );
}

function AttacksBody() {
  return (
    <>
      <div style={cardStyle}>
        <SectionHeading>How Attacks Fire</SectionHeading>
        <div style={bodyTextStyle}>
          Each attack shows its base Divine Light, cooldown, and card-specific scaling. Ain, Soph, and Bridge attacks
          launch an orbit sequence: move the cursor in sustained circles around the center to increase the payout.
          Straight or erratic movement does not score. Attack cooldowns count cards played, not seconds.
        </div>
      </div>

      <div className="codex-card-grid">
        <div style={cardAltStyle}>
          <SectionHeading>Light Attacks</SectionHeading>
          <ListItem label="Ain Attack">Does not spend Limitless Light Stacks. Any stack or Collection Power scaling is defined by that card.</ListItem>
          <ListItem label="Soph Attack">May spend stacks as shown on the card. Its scaling uses the stack pool from before payment.</ListItem>
        </div>
        <div style={cardAltStyle}>
          <SectionHeading>Ain Soph Aur</SectionHeading>
          <ListItem label="Summon">On summon, every Ain Soph Aur grants +{AIN_SOPH_AUR_SUMMON_STACK_REWARD} Limitless Light Stack.</ListItem>
          <ListItem label="Bridge">Each summon has one Bridge the Light attack with its own base, scaling, cooldown, and optional stack cost.</ListItem>
          <ListItem label="Scaling and cost">Each card specifies its scaling inputs, which may include Collection Power, Light Stacks, or front-row count. Stack costs are paid separately from the values used for scaling.</ListItem>
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Payment Modals</SectionHeading>
        <div style={bodyTextStyle}>
          When an attack or effect requires a discard or sacrifice, a selection modal appears. The game does
          not auto-pick &mdash; you choose exactly which cards to spend.
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Shatter the Infinite Light</SectionHeading>
        <div style={bodyTextStyle}>
          Fill all four front-row slots with Ain Soph Aur and all four back-row slots with Light or Dark cards
          flipped to Ain to unlock this finisher. After a fade to black, a 10-second window opens with glowing
          stars to click. Each star clicked adds one <Tag>Limitless Infinity</Tag> stack, worth 1,000 base Divine
          Light before Collection Power scaling. Board actions and gameplay timers pause until it resolves.
        </div>
        <ListItem label="Aftermath">Front-row Ain Soph Aur return to the Extra Deck. Back-row and discarded cards return to the draw pile, while your current hand is preserved. Light Stacks and board effects clear without advancing the turn.</ListItem>
        <ListItem label="Boss fights">Shattering immediately staggers the boss and restores the encounter clock to its full duration.</ListItem>
      </div>
    </>
  );
}

function LightStacksBody() {
  return (
    <>
      <div style={cardStyle}>
        <SectionHeading>Light Stack Runtime</SectionHeading>
        <div style={bodyTextStyle}>
          Limitless Light Stacks are a shared, turn-scoped resource. Flipping a charged Soph card is a main source;
          card effects and Ain Soph Aur summons can also change the total.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Accumulation Rules</SectionHeading>
        <ListItem label="Charge">Each card played adds charge to every face-down Soph card on the back row.</ListItem>
        <ListItem label="Flip">At {SOPH_FLIP_CHARGE_REQUIRED}+ charge, flip a Soph card to Ain and add its stored charge to your Light Stacks.</ListItem>
        <ListItem label="Sacrifice">A charged Soph card can instead be sacrificed. This removes it from the board and converts a percentage of its charge into stacks.</ListItem>
        <ListItem label="Spend">Soph Attacks, Dark activations, Bridge attacks, Spectrum level-ups, and abilities may spend stacks. Check each action&apos;s displayed cost.</ListItem>
        <ListItem label="Reset">The stack pool and board charges reset at turn end. Summoning an Ain Soph Aur grants +{AIN_SOPH_AUR_SUMMON_STACK_REWARD} stack.</ListItem>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Limitless Cosmos</SectionHeading>
        <div style={bodyTextStyle}>
          Causality cards use <Tag>Limitless Cosmos</Tag> as a separate turn-scoped resource. Causality effects
          generate it, convert Limitless Light Stacks into it, or spend it for card effects. The card text shows
          each cost and payoff; Cosmos and Light Stacks are not interchangeable.
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Limitless Inferno</SectionHeading>
        <div style={bodyTextStyle}>
          Intensity cards build uncapped <Tag>Limitless Inferno</Tag> during a turn. Level 3+ Intensity Light
          Soph attacks, including Eternal and Infinite Light cards, spend Inferno instead of Light Stacks.
          Dark activations and Ain Soph Aur summons build, recover, or react to it without spending it.
          Intensity abilities can also consume or reshape Inferno. Embers kindle the next Intensity hand plays;
          prepared tempering boosts the next Inferno Soph attack. Inferno, embers, amplifiers, and tempering
          reset at turn end. Ordinary Light costs and Spectrum level-ups still use Light Stacks.
        </div>
        <div style={bodyTextStyle}>Achievements &gt; Progression &gt; Intensity tracks volcanic card play, lifetime Inferno generation/spending, a 50-Inferno single-turn record, Crater expedition clears, and ability mastery. Each Intensity boss also earns its own profile trophy. The five portrait images await artwork; unlocked sigils remain usable.</div>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Spectrum Level</SectionHeading>
        <div style={bodyTextStyle}>
          Every card has a <Tag>Spectrum Level</Tag> from 0 to 5. You can only play a card from hand, or summon an
          Ain Soph Aur, when your current Spectrum Level is at or above the card&apos;s level. Every turn, Garden
          encounter, boss fight, and Battleground match starts at Lv 0.
        </div>
        <ListItem label="Raise">Press Raise Spectrum (default hotkey R) to spend 5 Limitless Light Stacks and sacrifice 1 hand card to reach Lv 1. Each further level costs 1 more stack (6, 7, 8, then 9 for Lv 5).</ListItem>
        <ListItem label="Light-bound Abyss">Sacrificed cards stay outside your deck until the next deck reset, unless an explicit reclaim effect returns them sooner. The Absolute Null and The White Throne Before Beginning recover the oldest eligible Neutrality Light/Dark cards, never Ain Soph Aur cards.</ListItem>
        <ListItem label="Rarity floors">Enigmatic cards are Lv 1+, Eternal Lv 2+, Infinite Lv 4+, and Transcendent cards are always Lv 5.</ListItem>
        <ListItem label="Neutrality Infinites">All eight original Neutrality Infinites are playable with their existing artwork and Infinity recipes: two Light, four persistent Dark, and two Ain Soph Aur cards. They require Spectrum Level 4 or 5 as shown on each card. Their effects specialize in Light Stack resonance, Abyss recovery, Soph charge release/granting, cooldown acceleration, and balanced Neutrality support pairs. Their attacks spend Light Stacks, not Inferno.</ListItem>
        <ListItem label="Phantom Matrix">Its free summon may reach one level above your current Spectrum Level.</ListItem>
        <ListItem label="Deckbuilding">Higher-level cards hit harder but take tempo to unlock, so keep enough Lv 0 cards to start every turn and mulligan high-level cards you cannot reach soon.</ListItem>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>The Payoff</SectionHeading>
        <div style={bodyTextStyle}>
          Attack resolution reads Collection Power directly for scaling, while Limitless Light Stack costs are paid separately when an attack requires them.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Starter Deck Focus</SectionHeading>
        <ListItem label="Core Plan">Play cards to charge Soph units, flip them, then sequence stack costs around cooldowns.</ListItem>
        <ListItem label="Practical Tip">Keep enough stacks for your strongest card action instead of spending the entire pool at once.</ListItem>
      </div>
    </>
  );
}

function SetsBody() {
  return (
    <>
      <div style={cardStyle}>
        <SectionHeading>Ability Amplification</SectionHeading>
        <div style={bodyTextStyle}>
          Buy abilities in Ability Materialization with the listed set materials, then equip up to three owned
          abilities in a saved deck. Activate them from the in-turn Ability Amplification panel. Neutrality and
          Causality and Intensity abilities have separate ownership gates; Transcendent abilities cost Divine Light and Shards
          of Transcendence instead of Garden materials.
        </div>
      </div>

      <div className="codex-card-grid">
        {ABILITY_DEFINITIONS.map(ability => (
          <div key={ability.id} className="codex-ability" style={{
            ...cardAltStyle,
            padding: '9px 11px',
          }}>
            <div style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: PALETTE.inkDeep,
              fontFamily: DISPLAY_FONT,
              letterSpacing: 0.4,
            }}>{ability.name}</div>
            <div style={{
              fontSize: 10.5,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: PALETTE.accent,
              fontWeight: 700,
              marginTop: 1,
              marginBottom: 4,
            }}>{ability.setId} ability</div>
            <div style={{ ...bodyTextStyle, fontSize: 11.5, lineHeight: 1.5 }}>{ability.description}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function RaritiesBody() {
  const tiers = RARITY_TIERS;

  return (
    <>
      <div style={cardStyle}>
        <SectionHeading>Rarity Tiers</SectionHeading>
        <div style={bodyTextStyle}>
          Rarity is feel-based. Higher tiers scale harder but the same effect families live across all tiers
          &mdash; there's no fixed "must-have" tier per slot.
        </div>
      </div>

      <div style={{ marginTop: 10, ...cardAltStyle, padding: '6px 10px' }}>
        {tiers.map(({ name, source, description }, i) => (
          <div key={name} className="codex-rarity-row" style={{
            display: 'grid',
            gridTemplateColumns: '92px 160px 1fr',
            gap: 10,
            padding: '8px 4px',
            borderBottom: i < tiers.length - 1 ? `1px solid ${PALETTE.borderSoft}` : 'none',
            alignItems: 'baseline',
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: PALETTE.inkDeep, fontFamily: DISPLAY_FONT, letterSpacing: 0.4 }}>{name}</div>
            <div style={{ fontSize: 11, color: PALETTE.inkSoft, fontStyle: 'italic' }}>{source}</div>
            <div style={{ ...bodyTextStyle, fontSize: 12 }}>{description}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function ModesBody() {
  return (
    <>
      <div style={cardStyle}>
        <SectionHeading>Eternity's Wake &mdash; Boss Fights</SectionHeading>
        <ListItem label="Format">One boss per session, 3-minute timer, single turn. All Divine Light you generate is dealt as damage instead of banked.</ListItem>
        <ListItem label="Categories">The current boss sets are Neutrality, Causality, and Intensity. Use the set filters in the Wake menu to switch.</ListItem>
        <ListItem label="Rewards">First clear and repeat clears grant Aberrated Shards and the boss's signature Eternal card. Aberrated Shards are reserved for event Packs, Boxes, and Cases.</ListItem>
        <ListItem label="Causality Wake">The Causality filter contains five endgame-heavy bosses, each with a unique Causality Eternal reward.</ListItem>
        <ListItem label="Intensity Wake">Five volcanic and abyssal bosses award the five Intensity Eternals. Their first boss starts at the midway Neutrality boss&apos;s health, not Causality endgame health.</ListItem>
        <ListItem label="Tier Progress">On completion, this mode awards +X <Tag>Card-light</Tag> for each card in your deck (and Extra Deck). Higher-tier bosses give more, up to 20 Card-light per card. The displayed amount is the base; each card also receives an extra +5% per Tier it has already reached.</ListItem>
      </div>
      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Garden of Cards</SectionHeading>
        <div style={bodyTextStyle}>Choose a set filter to enter an expedition. Valley of Null has three Neutrality encounters; Rift of Causality has four Causality encounters; Crater of Flames has four Intensity encounters. Each encounter awards its listed set materials. Complete the final encounter to finish the run.</div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Infinitude &mdash; Crafting</SectionHeading>
        <ListItem label="Recipes">Each Infinite is forged by consuming a specific combination of Eternal cards. Recipes are listed in the Infinitude menu.</ListItem>
        <ListItem label="Visibility">If a set has no Infinite recipes yet, no Infinites appear for that set &mdash; the menu reflects only what is actually craftable.</ListItem>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Card Packs</SectionHeading>
        <div style={bodyTextStyle}>
          Open the Card Store to spend Divine Light on packs. Each pack has its own rarity weights and pity
          counters; the store displays them up front. Use the Deck Builder to assemble up to 50 Main Deck cards
          plus an Extra Deck of up to 10 Ain Soph Aur cards (max 4 copies per definition).
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>More Modes</SectionHeading>
        <ListItem label="Challenges">Daily and weekly challenges provide rotating rewards. Claim every weekly reward to consume that rotation into two Super Weekly boss challenges.</ListItem>
        <ListItem label="Card-light Resonance">Refine eligible duplicate copies into Card-light Shards, then spend them 1:1 to add Card-light to any card.</ListItem>
        <ListItem label="Monthly Login">Open Login Calendar from Main Menu → Progress. The calendar shows each local date&apos;s reward; claim the current day&apos;s reward, with at most one claim per day. Missed dates do not queue for later claims.</ListItem>
        <ListItem label="Enigma">After 10 packs, the Enigma menu lets you search for manuscripts. An opening riddle passively unlocks a manuscript without focusing it. Only an acquired manuscript can be locked on, and only the selected Enigma progresses. Cumulative goals show live trackers, while requirements that say “in one turn,” “at once,” or “at end of turn” only complete in that exact scope.</ListItem>
        <ListItem label="Phantom Matrix">This ability spends 10 Limitless Light Stacks to open a free-summon picker. Choose any Ain Soph Aur without selecting or spending summon materials; normal summons still require their listed materials.</ListItem>
        <ListItem label="Amplifier of the Void">This Enigmatic Dark reward draws 2 cards and grants 3 Limitless Light Stacks. If you hold at least 5 stacks after activation, it also grants 1,500 Divine Light.</ListItem>
        <ListItem label="Silent Exchange">This Neutrality Dark utility exchanges one Light or Dark card from hand for one opposite-type card from the deck, then shuffles the returned card into the deck.</ListItem>
        <ListItem label="Eternity's Wake">Eternity's Wake unlocks after you acquire 3 unique Enigmatic cards.</ListItem>
        <ListItem label="Infinitude">Infinitude unlocks after you acquire 5 Eternal-rarity cards.</ListItem>
        <ListItem label="Forge">The Forge opens after you clear every current event boss, claim the Key of Transcendence from the event screen, then spend it to unlock the Forge permanently.</ListItem>
      </div>
    </>
  );
}

function CardBornTierBody() {
  return (
    <>
      <div style={cardStyle}>
        <SectionHeading>What is Card-born Tier?</SectionHeading>
        <div style={bodyTextStyle}>Each card played from your hand adds <Tag>1 Card-light</Tag> to that card definition's shared progress. The eight milestones provide claimable Aberrated Shards rewards and update the card's highest-tier <Tag>Resonance</Tag> contribution. Copies of the same card share one progression.</div>
      </div>
      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>The 8 Tiers</SectionHeading>
        {MASTERY_TIERS.map(tier => (
          <div key={tier.tier} className="codex-tier-row" style={{ display: 'grid', gridTemplateColumns: '28px 110px 70px 1fr', gap: 10, padding: '6px 4px', alignItems: 'baseline' }}>
            <div style={{ fontSize: 14, color: PALETTE.accent, textAlign: 'center' }}>{CARD_BORN_TIERS[tier.tier - 1]?.glyph ?? '◇'}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: PALETTE.inkDeep, fontFamily: DISPLAY_FONT }}>T{tier.tier} · {tier.label}</div>
            <div style={{ fontSize: 11, color: PALETTE.inkSoft }}>{tier.threshold.toLocaleString()} Card-light</div>
            <div style={{ ...bodyTextStyle, fontSize: 11.5, lineHeight: 1.5 }}>+{tier.shardReward} Aberrated Shards; +{tier.resonanceContribution} Resonance.</div>
          </div>
        ))}
      </div>
      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Current Sources and Rewards</SectionHeading>
        <div style={bodyTextStyle}>Hand plays add 1 Card-light to the played card. Completed Eternity's Wake boss fights add Card-light to each unique card in the participating Main and Extra Deck, with awards based on boss position and capped at 20 per card. Tier rewards are claimed manually as Aberrated Shards.</div>
      </div>
      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Resonance and Collection Power</SectionHeading>
        <div style={bodyTextStyle}>Each unique card contributes the Resonance value of its highest reached Tier, regardless of copies owned. Card-light advances the card toward its next Tier; Resonance increases only when that milestone is crossed. Every 10 Resonance adds +0.01 Collection Power through the formula 1 + Resonance / 1,000. The natural maximum assumes every registered card has reached Infinite Bond, so adding cards to the game automatically raises the cap. Collection Power amplifies Divine Light gains and contributes to Light attack and Ain Soph Aur Bridge scaling.</div>
      </div>
      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Card-light Resonance</SectionHeading>
        <div style={bodyTextStyle}>The <Tag>Card-light Resonance</Tag> menu converts eligible duplicate copies into Card-light Shards while preserving protected and locked copies. Spend Card-light Shards <Tag>1:1 for Card-light</Tag> on a selected card.</div>
      </div>
    </>
  );
}

function ProgressionBody() {
  return (
    <>
      <div style={cardStyle}>
        <SectionHeading>Aberrated Shards</SectionHeading>
        <div style={bodyTextStyle}>
          The secondary event and specialized pack currency. Earned from <Tag>boss clears</Tag> (first-clear bonus + repeat bonus),{' '}
          <Tag>daily logins</Tag>, achievements, and Card-born Tier milestones. Spent on limited-time Causality event packs.
        </div>
      </div>
      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Holofoil Cards</SectionHeading>
        <ListItem label="Acquisition">Every card rolled in a single Pack has a 2% chance to drop as a holofoil. Boxes and Cases guarantee at least one holofoil.</ListItem>
        <ListItem label="Visual Finish">Front-facing cards show full-bleed artwork under the screened splotched-ink frame; names and rules appear in inspectors or detail views rather than over the art. Holofoils use source-specific full-card metallic treatments: base pack foils use black/red/white, Enigma uses black/white/gold, Eternal uses purple-red, and Infinite uses chromatic black/white. Face-down views show only the card back.</ListItem>
        <ListItem label="Collection">Holofoils are purely cosmetic and are tracked separately in your collection and deck-building. They cannot be created with Aberrated Shards.</ListItem>
      </div>
      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Monthly Login Calendar</SectionHeading>
        <div style={bodyTextStyle}>Login rewards follow a persistent full-screen monthly track available from Main Menu → Progress → Login Calendar. Every date is displayed with its reward icon or card artwork. Claim the current local date&apos;s reward; missed dates do not queue, and only one daily reward can be claimed per local day.</div>
      </div>
      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Card-born Tier</SectionHeading>
        <div style={bodyTextStyle}>Every hand play adds Card-light to that card definition. The Card-born Tier menu shows the eight thresholds, current progress, Resonance contribution, and claimable rewards.</div>
        </div>
      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Profile, Titles &amp; Themes</SectionHeading>
        <ListItem label="Player Information">Open your profile to edit your display name (up to 24 characters), avatar, title, and bio (up to 200 characters). Save the bio explicitly. Showcase up to five signature cards, manage social features, or use the Save Data tab for portable saves.</ListItem>
        <ListItem label="Titles">Earn titles through gameplay milestones, boss clears, Infinity crafting, set completion, progression, social activity, and custom-background achievements. Pick an earned title from your profile.</ListItem>
        <ListItem label="UI Theme">Choose an unlocked Core or Rewards palette in Player Information and select Save UI Theme. Its four swatches rotate through accents, outlines, glows, and readable heading/button-title gradients: each holds for one minute, followed by a three-second fade. Reduced motion switches swatches without fading; Pantheon Default stays monochrome.</ListItem>
        <ListItem label="Appearance">Light and Dark Mode are available in Settings and your profile. Ordinary reading surfaces stay predominantly white or black; your palette supplies the decorative color. Artwork, main-menu backgrounds, card foil, and special experiences retain their own colors. Small captions remain solid and readable.</ListItem>
        <ListItem label="Collection">Browse, search, sort, and favorite cards without changing their artwork or finish. Infinite cards group by Neutrality, Causality, or Intensity, not by Light, Dark, or Ain Soph Aur.</ListItem>
      </div>
      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Finding &amp; Claiming Achievements</SectionHeading>
        <ListItem label="Browse">Achievements has {ACHIEVEMENT_CATEGORIES.length} subcategories under Gameplay, Collection, Battles, Progression, Social, and Cosmetics. All Achievements shows the same sectioned organization.</ListItem>
        <ListItem label="Find">Search titles, requirements, or background reward names. Filter by All statuses, Ready to claim, Locked, or Claimed. Category counts show total unlock progress; the shown count follows your current filters.</ListItem>
        <ListItem label="Claims">Claim earned rewards individually or use Claim All. Reorganizing the categories does not change requirements, saved claims, or currency payouts. Custom-background achievements award a background and title, not extra currency.</ListItem>
      </div>
      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Custom Main Menu Backgrounds</SectionHeading>
        <div style={bodyTextStyle}>Find fourteen background achievements in Achievements &gt; Cosmetics &gt; Custom Backgrounds: four Eternal/Infinite set crowns, seven Transcendent Forge rewards, and three Intensity base/Eternal/Infinite completion splashes. The first eleven images are installed; the three Intensity splashes await dedicated artwork. Once earned and available, open Player Information &gt; Main Menu Background and select the unlocked image. These backgrounds change splash art, not your UI color palette.</div>
        {[...CROWN_BACKGROUND_REWARDS, ...CUSTOM_MAIN_MENU_BACKGROUND_REWARDS].map(reward => (
          <ListItem key={reward.achievementId} label={reward.name}>{reward.requirement}</ListItem>
        ))}
        <div style={{ ...bodyTextStyle, marginTop: 8 }}>The all-four reward requires four distinct Volume I cards; duplicate copies of one card do not count as different cards. Ability rewards require acquisition, not equipping or activation. Backgrounds unlock automatically when earned and remain earned on that save. Claiming the achievement records its claim; it is not required to equip the art. If an image is unavailable, its tile shows Artwork pending and cannot be equipped.</div>
      </div>
    </>
  );
}

// --- Modal -------------------------------------------------------------------

function ForgeBody() {
  return (
    <>
      <div style={cardStyle}>
        <SectionHeading>Unlocking the Forge</SectionHeading>
        <div style={bodyTextStyle}>
          The Forge of Transcendence is a permanent gallery that belongs to no set. Beat every boss in the
          current event roster (currently the five <Tag>Causality</Tag> Eternity&apos;s Wake bosses), claim the
          one-time <Tag>Key of Transcendence</Tag> reward from the event screen, then spend the Key to open the
          Forge permanently on that save.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Key of Transcendence</SectionHeading>
        <div style={bodyTextStyle}>
          After clearing every current event boss at least once, claim the one-time Key of Transcendence reward
          from the event screen. Then spend that Key to open the Forge permanently.
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <SectionHeading>Shards of Transcendence</SectionHeading>
        <div style={bodyTextStyle}>
          The Monthly Login Calendar directly grants 1 Shard on day 10 and 2 on day 25. Separate 1% bonus rolls
          for 1–3 Shards are available only after the Forge is open:
        </div>
        <ListItem label="Boss clears">Any Eternity's Wake boss victory has a 1% chance (multiplied by x2/x3 fight choice) to drop 1–3 Shards.</ListItem>
        <ListItem label="Login bonus">The Forge-open bonus roll is available on calendar days 10 and 25. Day 10 also has its direct 1-Shard reward; day 25 directly grants 2 Shards.</ListItem>
        <ListItem label="Garden expeditions">The final encounter of any available Garden expedition has a 1% chance to drop 1–3 Shards. Earlier encounters do not roll.</ListItem>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <SectionHeading>Transcendent Cards (Vol. 1)</SectionHeading>
        <div style={bodyTextStyle}>
          Every Transcendent card carries the same innate <Tag>Transcendent Ability</Tag>: if it is in your Main
          Deck or Extra Deck, your maximum hand size becomes 10 instead of 8. Vol. 1: Before the First Shuffle contains
          four cards, with additional Transcendent volumes planned for future expansions. Each card also has its own
          Spectrum Level 5 rules and attacks. Each Forge gallery card costs 25 Shards of Transcendence. Separately,
          Ability Materialization offers four abilities, each costing 8,000,000 Divine Light and 30 Shards: First
          Dawn Accord makes your next 3 cards each grant 1,500 base Divine Light; Axiom of Acceleration makes your
          next 3 card plays add 1 extra charge to every face-down Soph; Vault of Unwritten Futures lets you choose
          2 cards from your discard pile and raises your hand limit by 2 for 40 seconds, with a 2-minute cooldown.
          At expiry, discard down to your normal 8-card limit (10 if your Main or Extra Deck contains a Transcendent
          card). Confluence of All Origins gives your next Ain, Soph, or Bridge attack +2 multiplier. They spend
          Limitless Light Stacks to activate
          and do not use Cosmos or another set&apos;s mechanics.
        </div>
      </div>
    </>
  );
}

function buildSections(): Section[] {
  const bodyMap: Record<string, React.ReactNode> = {
    'overview':       <OverviewBody />,
    'turn-flow':      <TurnFlowBody />,
    'board':          <BoardBody />,
    'attacks':        <AttacksBody />,
    'patience':       <LightStacksBody />,
    'sets':           <SetsBody />,
    'rarities':       <RaritiesBody />,
    'modes':          <ModesBody />,
    'card-born-tier': <CardBornTierBody />,
    'progression':    <ProgressionBody />,
    'forge':          <ForgeBody />,
  };
  return TUTORIAL_SECTIONS.map(s => ({ ...s, body: bodyMap[s.id] ?? null }));
}

const TOPIC_GROUPS = [
  { label: 'Basics', ids: ['overview', 'turn-flow', 'board'] },
  { label: 'Systems', ids: ['attacks', 'patience', 'sets', 'rarities'] },
  { label: 'Growth', ids: ['modes', 'card-born-tier', 'progression', 'forge'] },
];

const TOPIC_MARKS: Record<string, string> = {
  overview: '01', 'turn-flow': '02', board: '03', attacks: '04', patience: '05',
  sets: '06', rarities: '07', modes: '08', 'card-born-tier': '09', progression: '10', forge: '11',
};

export default function TutorialModal({ onClose }: Props) {
  useThemeVersion();
  const sections = buildSections();
  const [activeId, setActiveId] = useState<string>(sections[0].id);
  const [query, setQuery] = useState('');
  const [visited, setVisited] = useState(() => new Set([sections[0].id]));
  const [pageIndex, setPageIndex] = useState<Array<{ id: string; label: string }>>([]);
  const articleRef = useRef<HTMLElement>(null);
  const active = sections.find(s => s.id === activeId) ?? sections[0];
  const activeIndex = sections.findIndex(section => section.id === active.id);
  const search = query.trim().toLocaleLowerCase();
  const filteredSections = sections.filter(section =>
    `${section.label} ${section.title} ${section.subtitle}`.toLocaleLowerCase().includes(search),
  );

  useLayoutEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    article.scrollTop = 0;
    setPageIndex(Array.from(article.querySelectorAll<HTMLElement>('.codex-block-heading')).map((heading, index) => {
      heading.id = `codex-${activeId}-${index}`;
      return { id: heading.id, label: heading.textContent ?? '' };
    }));
  }, [activeId]);

  function selectTopic(id: string) {
    setActiveId(id);
    setVisited(previous => new Set([...previous, id]));
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    } else if (event.key === 'Tab') {
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
        'button, input, a[href], [tabindex="0"]',
      )).filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }

  return (
    <div className="codex-screen ui-panel-intro" role="dialog" aria-modal="true" aria-labelledby="codex-title" onKeyDown={handleDialogKeyDown}>
      <div className="codex-shell">
        <header className="codex-header">
          <div>
            <div className="codex-eyebrow">The Codex</div>
            <h1 id="codex-title" className="ui-title-glow">How To Play</h1>
            <p>
              Go as infinite as possible before your deck engine stalls.
            </p>
          </div>
          <button className="codex-close" onClick={onClose} autoFocus>
            Close <kbd>Esc</kbd>
          </button>
        </header>
        <div className="codex-layout">
          <nav className="codex-rail ornate-scroll" aria-label="Codex topics">
            <label className="codex-search">
              <span className="codex-search-label">Find a topic</span>
              <input type="search" value={query} onChange={event => setQuery(event.target.value)}
                placeholder="Search the Codex..." aria-label="Search Codex topics" />
            </label>
            {TOPIC_GROUPS.map(group => {
              const topics = filteredSections.filter(section => group.ids.includes(section.id));
              if (!topics.length) return null;
              return <div className="codex-topic-group" key={group.label}>
                <h2>{group.label}</h2>
                {topics.map(section => (
                  <button key={section.id} className={`codex-topic${section.id === activeId ? ' is-active' : ''}`}
                    aria-current={section.id === activeId ? 'page' : undefined}
                    onClick={() => selectTopic(section.id)} aria-controls="codex-article">
                    <span className="codex-topic-mark" aria-hidden="true">{TOPIC_MARKS[section.id]}</span>
                    <span className={section.id === activeId ? 'ui-button-title' : undefined}>{section.label}</span>
                    <span className="codex-topic-visited" aria-label={visited.has(section.id) ? 'Viewed' : undefined}>
                      {visited.has(section.id) ? '\u2713' : ''}
                    </span>
                  </button>
                ))}
              </div>;
            })}
            {!filteredSections.length && <p className="codex-empty" role="status">No topics match your search.</p>}
            <div className="codex-progress">
              <span>{visited.size} of {sections.length} topics viewed</span>
              <progress value={visited.size} max={sections.length} aria-label="Topics viewed" />
            </div>
          </nav>
          <article ref={articleRef} id="codex-article" className="codex-article ornate-scroll" aria-labelledby="codex-topic-title" tabIndex={0}>
            <div className="codex-reading-pane">
              <div className="codex-article-heading">
                <span className="codex-eyebrow">Chapter {TOPIC_MARKS[active.id]}</span>
                <h2 id="codex-topic-title">{active.title}</h2>
                <p>{active.subtitle}</p>
              </div>
              <div className="codex-content" key={active.id}>{active.body}</div>
              <nav className="codex-pagination" aria-label="Chapter navigation">
                {activeIndex > 0 && <button onClick={() => selectTopic(sections[activeIndex - 1].id)}>
                  <small>Previous chapter</small><span>{sections[activeIndex - 1].label}</span>
                </button>}
                {activeIndex < sections.length - 1 && <button className="codex-next" onClick={() => selectTopic(sections[activeIndex + 1].id)}>
                  <small>Next chapter</small><span>{sections[activeIndex + 1].label}</span>
                </button>}
              </nav>
            </div>
          </article>
          <aside className="codex-index ornate-scroll" aria-label="On this page">
            <h2>On this page</h2>
            {pageIndex.map(entry => <a key={entry.id} href={`#${entry.id}`} onClick={event => {
              event.preventDefault();
              articleRef.current?.querySelector<HTMLElement>(`#${entry.id}`)?.scrollIntoView({ block: 'start', behavior: 'instant' });
            }}>{entry.label}</a>)}
          </aside>
        </div>
      </div>
    </div>
  );
}
