import { useState } from 'react';
import { uiTypography } from '@/ui/theme';
import { RARITY_TIERS, CARD_BORN_TIERS, TUTORIAL_SECTIONS } from '@/data/tutorialContent';
import { AIN_SOPH_AUR_SUMMON_STACK_REWARD, SOPH_FLIP_CHARGE_REQUIRED } from '@/systems/cards/AinSophRuntime';
import { MASTERY_TIERS } from '@/systems/progression/cardMastery';
import { ABILITY_DEFINITIONS } from '@/data/abilities/abilityDefinitions';

interface Props {
  onClose: () => void;
}

const DISPLAY_FONT = uiTypography.display;
const BODY_FONT = uiTypography.body;

// Local accent palette - parchment / warm gold to match the rest of the menus.
const PALETTE = {
  parchment: 'linear-gradient(180deg, rgba(248, 238, 223, 0.97) 0%, rgba(241, 226, 201, 0.97) 100%)',
  panel: 'linear-gradient(180deg, rgba(246, 233, 212, 0.96) 0%, rgba(238, 220, 193, 0.94) 100%)',
  panelAlt: 'linear-gradient(180deg, rgba(252, 244, 228, 0.96) 0%, rgba(244, 228, 200, 0.94) 100%)',
  border: 'rgba(150, 104, 66, 0.44)',
  borderSoft: 'rgba(134, 94, 58, 0.26)',
  ink: '#3a2115',
  inkDeep: '#5f2f17',
  inkMuted: '#704022',
  inkSoft: '#6f3112',
  accent: '#b56a2e',
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
  padding: '12px 14px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 4px 10px rgba(0,0,0,0.07)',
};

const cardAltStyle: React.CSSProperties = {
  ...cardStyle,
  background: PALETTE.panelAlt,
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 1.4,
  textTransform: 'uppercase',
  color: PALETTE.inkDeep,
  fontWeight: 700,
  fontFamily: DISPLAY_FONT,
  marginBottom: 6,
};

const bodyTextStyle: React.CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.6,
  color: PALETTE.ink,
  fontFamily: BODY_FONT,
};

const inlineTagStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 7px',
  borderRadius: 6,
  background: 'rgba(150, 104, 66, 0.18)',
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

function ListItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 5 }}>
      <div style={{
        flexShrink: 0,
        minWidth: 80,
        fontSize: 11.5,
        fontWeight: 700,
        color: PALETTE.inkDeep,
        fontFamily: DISPLAY_FONT,
        letterSpacing: 0.4,
        paddingTop: 1,
      }}>
        {label}
      </div>
      <div style={{ ...bodyTextStyle, flex: 1 }}>{children}</div>
    </div>
  );
}

function NumberedStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
      <div style={{
        flexShrink: 0,
        width: 26, height: 26, borderRadius: '50%',
        background: 'linear-gradient(180deg, #ebc48e 0%, #d59f55 100%)',
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.inkDeep,
        fontWeight: 700,
        fontFamily: DISPLAY_FONT,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
      }}>{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: PALETTE.inkDeep, fontFamily: DISPLAY_FONT, marginBottom: 2 }}>
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
        <div style={sectionHeadingStyle}>The Loop</div>
        <div style={bodyTextStyle}>
          Play cards each turn to earn <Tag>Divine Light</Tag>. Spend Divine Light on <Tag>Card Packs</Tag> to expand
          your collection, build stronger decks, and push deeper into <Tag>Eternity's Wake</Tag> boss fights
          and the <Tag>Infinitude</Tag> crafting chamber. There is no idle tick &mdash; every gain comes from a
          card you played.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <div style={cardAltStyle}>
          <div style={sectionHeadingStyle}>Currencies</div>
          <ListItem label="Divine Light">Primary currency. Earned from card plays and attacks. Spent on card packs.</ListItem>
          <ListItem label="Shards">Aberrated Shards. Earned from boss clears and daily logins. Spend them on progression and rewards.</ListItem>
        </div>
        <div style={cardAltStyle}>
          <div style={sectionHeadingStyle}>Game Modes</div>
          <ListItem label="Main">The core deck loop &mdash; play turns, open packs, expand the collection.</ListItem>
          <ListItem label="Wake">Eternity's Wake. A single-turn boss fight where all Divine Light deals damage. Rewards Eternal-rarity cards.</ListItem>
          <ListItem label="Infinitude">Forge Infinite-rarity cards by consuming specific Eternals.</ListItem>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Attack Orbit Sequences</div>
        <ListItem label="Ain / Soph">The attacking card appears in a central orbit field. Move the cursor in a complete, consistent circle around the center target to build revolution-only payout.</ListItem>
        <ListItem label="Bridge the Light">Bridge uses the same central orbit language while its Ain Soph Aur constellation remains part of the presentation. Complete revolutions are the scoring input.</ListItem>
        <ListItem label="No star clicks">There are no clickable stars or ordered hit paths. Straight lines, jitter, direction reversals, and random movement do not score.</ListItem>
        <ListItem label="Stable payout">Orbit score is uncapped and committed by the store when the sequence resolves. Attack cost, cooldown, and payout are applied atomically at resolution.</ListItem>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Quick Keys</div>
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
        <div style={sectionHeadingStyle}>A Single Turn</div>
        <NumberedStep n={1} title="Begin Turn">
          From the main menu, press the large <Tag>Begin Turn</Tag> button. A fresh hand draws and
          per-turn resources (Radiance, Heat, Strain, etc.) reset.
        </NumberedStep>
        <NumberedStep n={2} title="Mulligan">
          Click cards in hand to mark them for replacement, then confirm. Use it to dig for setup pieces or to
          remove dead draws.
        </NumberedStep>
        <NumberedStep n={3} title="Play Phase">
          Play any combination of cards. Place Seraphim and Cherubim, fire Ophanim, summon Angels, and click
          board units to use their attacks when off cooldown. Press <Tag>E</Tag> any time to peek your Extra
          Deck without spending a play.
        </NumberedStep>
        <NumberedStep n={4} title="End Turn">
          Click the <Tag>End Turn</Tag> button in the arena footer. The board resolves, front-row units go to
          discard, and you return to the main menu for the next turn.
        </NumberedStep>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Timing Tips</div>
        <ListItem label="Cheap First">Cycle low-cost Ophanim early to reduce attack cooldowns.</ListItem>
        <ListItem label="Set Up">Drop Seraphim and Cherubim before your big payoff plays so passives are already online.</ListItem>
        <ListItem label="Sequence">Cooldowns tick in cards played, not seconds. Fire each attack at peak resource windows.</ListItem>
      </div>
    </>
  );
}

function BoardBody() {
  return (
    <>
      <div style={cardStyle}>
        <div style={sectionHeadingStyle}>Board Layout</div>
        <pre style={{
          margin: 0,
          lineHeight: 1.5,
          color: PALETTE.inkDeep,
          background: 'rgba(255, 246, 226, 0.6)',
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
          Back-row cards begin on their <Tag>Soph</Tag> side. Front-row cards are <Tag>Ain Soph Aur</Tag>
          summons. The board and hand reset at turn end; only persistent progression and Divine Light remain.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Card Types</div>
        <ListItem label="Light">Creature cards with an Ain Attack and a stack-consuming Soph Attack.</ListItem>
        <ListItem label="Dark">Utility cards that activate from their face-up Ain side on the board.</ListItem>
        <ListItem label="Ain Soph Aur">Extra Deck summons. Sacrifice the listed back-row materials to place one in the front row.</ListItem>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Click Reference</div>
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
        <div style={sectionHeadingStyle}>How Attacks Fire</div>
        <div style={bodyTextStyle}>
          Every card shows its own base Divine Light, cooldown, and scaling values. Cooldowns are measured in cards
          played, not seconds. Universal rules belong here; the card panel only shows what is unique to that card.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <div style={cardAltStyle}>
          <div style={sectionHeadingStyle}>Light Attacks</div>
          <ListItem label="Ain Attack">Reads the current Limitless Light Stack pool and does not consume it.</ListItem>
          <ListItem label="Soph Attack">Uses the card&apos;s own stack cost and scaling, then pays Divine Light.</ListItem>
        </div>
        <div style={cardAltStyle}>
          <div style={sectionHeadingStyle}>Ain Soph Aur</div>
          <ListItem label="Summon">On summon, every Ain Soph Aur grants +{AIN_SOPH_AUR_SUMMON_STACK_REWARD} Limitless Light Stack.</ListItem>
          <ListItem label="Bridge">Each summon has one Bridge the Light attack with its own base, scaling, cooldown, and optional stack cost.</ListItem>
          <ListItem label="Collection Power">Attack scaling uses Collection Power directly. Limitless Light Stacks remain a separate core resource and are only spent when card text says so.</ListItem>
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Payment Modals</div>
        <div style={bodyTextStyle}>
          When an attack or effect requires a discard or sacrifice, a selection modal appears. The game does
          not auto-pick &mdash; you choose exactly which cards to spend.
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Shatter the Infinite Light</div>
        <div style={bodyTextStyle}>
          Fully bridge the board with four front-row Ain Soph Aur and four back-row Light or Dark cards already
          flipped to Ain to unlock this finisher. The screen first fades completely to black, then opens a
          10-second event-horizon orbit field. Each full, consistent cursor revolution around the core creates one
          <Tag>Limitless Infinity</Tag> stack worth 1,000 base Divine Light before Collection Power scaling.
          Gameplay timers pause during the sequence.
        </div>
        <ListItem label="Aftermath">Front-row Ain Soph Aur return to the Extra Deck. Back-row and discarded cards return to the draw pile, while your current hand is preserved. Light Stacks and board effects clear without advancing the turn.</ListItem>
        <ListItem label="Boss fights">Shattering immediately staggers the boss and restores the encounter clock to its full duration.</ListItem>
      </div>
    </>
  );
}

function PatienceBody() {
  return (
    <>
      <div style={cardStyle}>
        <div style={sectionHeadingStyle}>Light Stack Runtime</div>
        <div style={bodyTextStyle}>
          Limitless Light Stacks are created when charged Soph cards flip to Ain. They are a shared, per-turn resource.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Accumulation Rules</div>
        <ListItem label="Charge">Each card played adds charge to every face-down Soph card on the back row.</ListItem>
        <ListItem label="Flip">At {SOPH_FLIP_CHARGE_REQUIRED}+ charge, flip a Soph card to Ain and convert its charge into Light Stacks.</ListItem>
        <ListItem label="Spend">Soph Attacks, Dark activations, and some Bridge attacks spend stacks according to their card text.</ListItem>
        <ListItem label="Reset">The stack pool and board charges reset at the end of the turn.</ListItem>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>The Payoff</div>
        <div style={bodyTextStyle}>
          Attack resolution reads Collection Power directly for scaling, while Limitless Light Stack costs are paid separately when an attack requires them.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Starter Deck Focus</div>
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
        <div style={sectionHeadingStyle}>Ability Amplification</div>
        <div style={bodyTextStyle}>
          Materialized abilities are purchased with Divine Light, equipped three at a time in the Deck Builder,
          and activated from the in-turn Ability Amplification panel. The shop has Neutrality and Causality filters; Causality abilities unlock from full base Causality ownership, Causality Eternal ownership, and Causality Infinite ownership.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        {ABILITY_DEFINITIONS.map(ability => (
          <div key={ability.id} style={{
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
        <div style={sectionHeadingStyle}>Rarity Tiers</div>
        <div style={bodyTextStyle}>
          Rarity is feel-based. Higher tiers scale harder but the same effect families live across all tiers
          &mdash; there's no fixed "must-have" tier per slot.
        </div>
      </div>

      <div style={{ marginTop: 10, ...cardAltStyle, padding: '6px 10px' }}>
        {tiers.map(({ name, source, description }, i) => (
          <div key={name} style={{
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
        <div style={sectionHeadingStyle}>Eternity's Wake &mdash; Boss Fights</div>
        <ListItem label="Format">One boss per session, 3-minute timer, single turn. All Divine Light you generate is dealt as damage instead of banked.</ListItem>
        <ListItem label="Categories">Bosses are organized by set &mdash; Neutrality, Pyroabyss, Heavenly Light, Thornbound Plains, and so on. Use the tab strip at the top of the Wake menu to switch.</ListItem>
        <ListItem label="Rewards">First clear and repeat clears grant Aberrated Shards and the boss's signature Eternal card. Aberrated Shards are reserved for event Packs, Boxes, and Cases.</ListItem>
        <ListItem label="Causality Wake">The Causality filter contains five endgame-heavy bosses, each with a unique Causality Eternal reward.</ListItem>
        <ListItem label="Tier Progress">On completion, this mode awards +X <Tag>Card-light</Tag> for each card in your deck (and Extra Deck). Higher-tier bosses give more, up to 20 Card-light per card. The displayed amount is the base; each card also receives an extra +5% per Tier it has already reached.</ListItem>
      </div>
      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Rift of Causality</div>
        <div style={bodyTextStyle}>The Causality Garden filter opens a four-encounter endgame expedition. Its rewards are Seed of Causality, Causal Bloom, Shattered Causal Transcript, and Heart of Causality. These materials combine only with Causality Eternal cards to forge five Causality Infinite cards.</div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Infinitude &mdash; Crafting</div>
        <ListItem label="Recipes">Each Infinite is forged by consuming a specific combination of Eternal cards. Recipes are listed in the Infinitude menu.</ListItem>
        <ListItem label="Visibility">If a set has no Infinite recipes yet, no Infinites appear for that set &mdash; the menu reflects only what is actually craftable.</ListItem>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Card Packs</div>
        <div style={bodyTextStyle}>
          Open the Card Store to spend Divine Light on packs. Each pack has its own rarity weights and pity
          counters; the store displays them up front. Use the Deck Builder to assemble up to 50 cards plus an
          Extra Deck of Angels (up to 10 total, max 4 copies per definition).
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>More Modes</div>
        <ListItem label="Challenges">Daily and weekly challenges provide rotating rewards. Claim every weekly reward to consume that rotation into two Super Weekly boss challenges.</ListItem>
        <ListItem label="Card-light Resonance">Refine eligible duplicate copies into Card-light Shards, then spend them 1:1 to add Card-light to any card.</ListItem>
        <ListItem label="Monthly Login">Open Login Calendar from Main Menu → Progress at any time. The full month is shown with Aberrated Shards, Card-light Shards, and actual card artwork for each reward. Missed days remain queued, but only one daily reward can be claimed per UTC day.</ListItem>
        <ListItem label="Enigma">After 10 packs, the Enigma menu lets you search for manuscripts. An opening riddle passively unlocks a manuscript without focusing it. Only an acquired manuscript can be locked on, and only the selected Enigma progresses. Cumulative goals show live trackers, while requirements that say “in one turn,” “at once,” or “at end of turn” only complete in that exact scope.</ListItem>
        <ListItem label="Phantom Matrix">Phantom Matrix opens a free-summon picker. Every Ain Soph Aur stays bright and selectable; choose any ASA and confirm without selecting or spending materials. Normal ASA summons still use their authored materials.</ListItem>
        <ListItem label="Amplifier of the Void">This Enigmatic Dark reward draws 2 cards and grants 3 Limitless Light Stacks. If you hold at least 5 stacks after activation, it also grants 1,500 Divine Light.</ListItem>
        <ListItem label="Silent Exchange">This Neutrality Dark utility exchanges one Light or Dark card from hand for one opposite-type card from the deck, then shuffles the returned card into the deck.</ListItem>
        <ListItem label="Eternity's Wake">Eternity's Wake unlocks after you acquire 3 unique Enigmatic cards.</ListItem>
        <ListItem label="Infinitude">Infinitude unlocks after you acquire 5 Eternal-rarity cards.</ListItem>
        <ListItem label="Ascension">Ascension unlocks after you acquire 5 Infinite-rarity cards.</ListItem>
      </div>
    </>
  );
}

function CardBornTierBody() {
  return (
    <>
      <div style={cardStyle}>
        <div style={sectionHeadingStyle}>What is Card-born Tier?</div>
        <div style={bodyTextStyle}>Each card played from your hand adds <Tag>1 Card-light</Tag> to that card definition's shared progress. The eight milestones provide claimable Aberrated Shards rewards and update the card's highest-tier <Tag>Resonance</Tag> contribution. Copies of the same card share one progression.</div>
      </div>
      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>The 8 Tiers</div>
        {MASTERY_TIERS.map(tier => (
          <div key={tier.tier} style={{ display: 'grid', gridTemplateColumns: '28px 110px 70px 1fr', gap: 10, padding: '6px 4px', alignItems: 'baseline' }}>
            <div style={{ fontSize: 14, color: PALETTE.accent, textAlign: 'center' }}>{CARD_BORN_TIERS[tier.tier - 1]?.glyph ?? '◇'}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: PALETTE.inkDeep, fontFamily: DISPLAY_FONT }}>T{tier.tier} · {tier.label}</div>
            <div style={{ fontSize: 11, color: PALETTE.inkSoft }}>{tier.threshold.toLocaleString()} Card-light</div>
            <div style={{ ...bodyTextStyle, fontSize: 11.5, lineHeight: 1.5 }}>+{tier.shardReward} Aberrated Shards; +{tier.resonanceContribution} Resonance.</div>
          </div>
        ))}
      </div>
      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Current Sources and Rewards</div>
        <div style={bodyTextStyle}>Hand plays add 1 Card-light to the played card. Completed Eternity's Wake boss fights add Card-light to each unique card in the participating Main and Extra Deck, with awards based on boss position and capped at 20 per card. Tier rewards are claimed manually as Aberrated Shards.</div>
      </div>
      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Resonance and Collection Power</div>
        <div style={bodyTextStyle}>Each unique card contributes the Resonance value of its highest reached Tier, regardless of copies owned. Card-light advances the card toward its next Tier; Resonance increases only when that milestone is crossed. Every 10 Resonance adds +0.01 Collection Power through the formula 1 + Resonance / 1,000. The natural maximum assumes every registered card has reached Infinite Bond, so adding cards to the game automatically raises the cap. Collection Power amplifies Divine Light gains and contributes to Light attack and Ain Soph Aur Bridge scaling.</div>
      </div>
      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Card-light Resonance</div>
        <div style={bodyTextStyle}>The <Tag>Card-light Resonance</Tag> menu converts eligible duplicate copies into Card-light Shards while preserving protected and locked copies. Spend Card-light Shards <Tag>1:1 for Card-light</Tag> on a selected card.</div>
      </div>
    </>
  );
}

function ProgressionBody() {
  return (
    <>
      <div style={cardStyle}>
        <div style={sectionHeadingStyle}>Aberrated Shards</div>
        <div style={bodyTextStyle}>
          The secondary event and specialized pack currency. Earned from <Tag>boss clears</Tag> (first-clear bonus + repeat bonus),{' '}
          <Tag>daily logins</Tag>, achievements, and Card-born Tier milestones. Spent on limited-time Causality event packs.
        </div>
      </div>
      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Holofoil Cards</div>
        <ListItem label="Acquisition">Every card rolled in a single Pack has a 2% chance to drop as a holofoil. Boxes and Cases guarantee at least one holofoil.</ListItem>
        <ListItem label="Visual Finish">Every front-facing card includes its complete top type/name ribbon, artwork, and bottom rules panel. Holofoils use source-specific full-card metallic treatments: base pack foils use black/red/white, Enigma uses black/white/gold, Eternal uses purple-red, and Infinite uses chromatic black/white. Face-down collection/back views intentionally show only the back.</ListItem>
        <ListItem label="Collection">Holofoils are purely cosmetic and are tracked separately in your collection and deck-building. They cannot be created with Aberrated Shards.</ListItem>
      </div>
      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Monthly Login Calendar</div>
        <div style={bodyTextStyle}>Login rewards follow a persistent full-screen monthly track available from Main Menu → Progress → Login Calendar. Every day is displayed at once with its actual reward icon or card artwork. Missing a day does not reset anything: unclaimed days stay queued, but the account can claim only one daily reward per UTC day.</div>
      </div>
      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Card-born Tier</div>
        <div style={bodyTextStyle}>Every hand play adds Card-light to that card definition. The Card-born Tier menu shows the eight thresholds, current progress, Resonance contribution, and claimable rewards.</div>
        </div>
      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Profile, Titles &amp; Themes</div>
        <ListItem label="Profile">Set your display name and avatar from the Profile menu.</ListItem>
        <ListItem label="Titles">Earned by defeating specific bosses or crafting specific Infinites.</ListItem>
        <ListItem label="UI Theme">Switch between palette presets or save a custom theme from the Settings menu.</ListItem>
      </div>
    </>
  );
}

// --- Modal -------------------------------------------------------------------

function ForgeBody() {
  return (
    <>
      <div style={cardStyle}>
        <div style={sectionHeadingStyle}>Unlocking the Forge</div>
        <div style={bodyTextStyle}>
          The Forge of Transcendence is a permanent, one-time-ever gallery that belongs to no set and no
          master. It opens once every boss belonging to the current live event (currently <Tag>Causality</Tag>,
          its five Eternity's Wake bosses) has been beaten at least once, and you have spent 1{' '}
          <Tag>Key of Transcendence</Tag> to open it. Once opened, it stays open forever on that save.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Key of Transcendence</div>
        <div style={bodyTextStyle}>
          Clearing every event boss for the first time claims a single Key of Transcendence automatically.
          Only one Key is ever awarded this way &mdash; it is what you spend to open the Forge.
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Shards of Transcendence</div>
        <div style={bodyTextStyle}>
          Shards only ever drop after the Forge has been opened. Once unlocked, they can fall from:
        </div>
        <ListItem label="Boss clears">Any Eternity's Wake boss victory has a small chance to drop a Shard.</ListItem>
        <ListItem label="Login Calendar">Certain bonus days on the Monthly Login Calendar can also drop a Shard.</ListItem>
        <ListItem label="Rift of Causality">The final encounter of the Rift of Causality expedition can drop a Shard.</ListItem>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>The 4 Transcendent Cards</div>
        <div style={bodyTextStyle}>
          Every Transcendent card carries the same innate <Tag>Transcendent Ability</Tag>: if it is anywhere in
          your deck or Extra Deck, your maximum hand size becomes 10 instead of 8. Beyond that shared passive,
          each of the 4 cards has its own attack or effect with the single highest numbers in the game.
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
    'patience':       <PatienceBody />,
    'sets':           <SetsBody />,
    'rarities':       <RaritiesBody />,
    'modes':          <ModesBody />,
    'card-born-tier': <CardBornTierBody />,
    'progression':    <ProgressionBody />,
    'forge':          <ForgeBody />,
  };
  return TUTORIAL_SECTIONS.map(s => ({ ...s, body: bodyMap[s.id] ?? null }));
}

export default function TutorialModal({ onClose }: Props) {
  const sections = buildSections();
  const [activeId, setActiveId] = useState<string>(sections[0].id);
  const active = sections.find(s => s.id === activeId) ?? sections[0];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 15% 12%, rgba(230, 155, 79, 0.23) 0%, rgba(230, 155, 79, 0) 36%), radial-gradient(circle at 84% 20%, rgba(154, 111, 70, 0.2) 0%, rgba(154, 111, 70, 0) 34%), linear-gradient(180deg, rgba(14, 11, 11, 0.94) 0%, rgba(26, 22, 19, 0.96) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 55,
        pointerEvents: 'auto',
        fontFamily: BODY_FONT,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        className="ornate-scroll ui-panel-intro"
        style={{
          width: 'min(960px, calc(100vw - 32px))',
          height: 'min(88vh, 720px)',
          background: PALETTE.parchment,
          border: `1px solid ${PALETTE.border}`,
          borderRadius: 20,
          boxShadow: '0 28px 52px rgba(0,0,0,0.54), inset 0 0 0 1px rgba(255,255,255,0.38)',
          color: PALETTE.ink,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          ['--ui-accent' as any]: '230, 155, 79',
          ['--ui-accent-soft' as any]: '250, 215, 165',
        } as React.CSSProperties}
      >
        {/* Header */}
        <div className="ui-shimmer-band" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 22px 12px',
          borderBottom: `1px solid ${PALETTE.borderSoft}`,
          position: 'relative',
        }}>
          <div>
            <div className="ui-title-glow" style={{
              fontSize: 22,
              fontWeight: 700,
              color: PALETTE.inkDeep,
              letterSpacing: 0.8,
              fontFamily: DISPLAY_FONT,
            }}>
              How To Play
            </div>
            <div style={{ fontSize: 12, color: PALETTE.inkMuted, marginTop: 2, fontFamily: BODY_FONT }}>
              Go as infinite as possible before your deck engine stalls.
            </div>
          </div>
          <button
            className="menu-tactile-btn"
            onClick={onClose}
            style={{
              borderRadius: 10,
              border: `1px solid ${PALETTE.border}`,
              background: 'linear-gradient(180deg, rgba(255, 249, 240, 0.95) 0%, rgba(243, 223, 192, 0.92) 100%)',
              color: PALETTE.inkDeep,
              cursor: 'pointer',
              fontSize: 12.5,
              padding: '7px 14px',
              fontFamily: DISPLAY_FONT,
              letterSpacing: 0.5,
            }}
          >
            Close
          </button>
        </div>

        {/* Body: sidebar + content */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Sidebar nav */}
          <nav style={{
            width: 184,
            flexShrink: 0,
            borderRight: `1px solid ${PALETTE.borderSoft}`,
            background: 'rgba(245, 230, 205, 0.55)',
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            overflowY: 'auto',
          }}>
            {sections.map(section => {
              const isActive = section.id === activeId;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveId(section.id)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: 9,
                    border: `1px solid ${isActive ? PALETTE.border : 'transparent'}`,
                    background: isActive
                      ? 'linear-gradient(180deg, rgba(255, 240, 213, 0.98) 0%, rgba(244, 217, 175, 0.96) 100%)'
                      : 'transparent',
                    color: isActive ? PALETTE.inkDeep : PALETTE.inkMuted,
                    fontFamily: DISPLAY_FONT,
                    fontSize: 12.5,
                    fontWeight: isActive ? 700 : 600,
                    letterSpacing: 0.5,
                    cursor: 'pointer',
                    boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.45), 0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {section.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            padding: '18px 22px 22px',
          }}>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: PALETTE.inkDeep,
              fontFamily: DISPLAY_FONT,
              letterSpacing: 0.6,
            }}>
              {active.title}
            </div>
            <div style={{
              fontSize: 12,
              color: PALETTE.inkMuted,
              fontStyle: 'italic',
              marginTop: 2,
              marginBottom: 14,
            }}>
              {active.subtitle}
            </div>
            <div>{active.body}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
