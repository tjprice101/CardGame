import { useState } from 'react';
import { type NeutralityTutorialTier } from '@/data/trialDecks';
import { uiTypography } from '@/ui/theme';

interface Props {
  onClose: () => void;
  onPlayTutorialTurn: (tier: NeutralityTutorialTier) => void;
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
          Play cards each turn to earn <Tag>Oblivion</Tag>. Spend Oblivion on <Tag>Card Packs</Tag> to expand
          your collection, build stronger decks, and push deeper into <Tag>Eternity's Wake</Tag> boss fights
          and the <Tag>Infinitude</Tag> crafting chamber. There is no idle tick &mdash; every gain comes from a
          card you played.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <div style={cardAltStyle}>
          <div style={sectionHeadingStyle}>Currencies</div>
          <ListItem label="Oblivion">Primary currency. Earned from card plays and Seraphim / Angel attacks. Spent on card packs.</ListItem>
          <ListItem label="Shards">Aberrated Shards. Earned from boss clears and daily logins. Spent to convert cards into holofoils.</ListItem>
        </div>
        <div style={cardAltStyle}>
          <div style={sectionHeadingStyle}>Game Modes</div>
          <ListItem label="Main">The core deck loop &mdash; play turns, open packs, expand the collection.</ListItem>
          <ListItem label="Wake">Eternity's Wake. A single-turn boss fight where all Oblivion deals damage. Rewards Eternal-rarity cards.</ListItem>
          <ListItem label="Infinitude">Forge Infinite-rarity cards by consuming specific Eternals.</ListItem>
        </div>
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
        <div style={sectionHeadingStyle}>Cadence Tips</div>
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
{`[ S0 ] [ S1 ] [ S2 ] [ S3 ] [ S4 ]   <- Front: Seraphim / Angels
   [ C0 ]  [ C1 ]  [ C2 ]  [ C3 ]     <- Back: Cherubim (staggered)`}
        </pre>
        <div style={{ ...bodyTextStyle, marginTop: 8 }}>
          Back slot <Tag>Ci</Tag> is adjacent to front slots <Tag>Si</Tag> and <Tag>Si+1</Tag>. Many Cherubim
          buff adjacent Seraphim attacks; others apply effects to the whole board. All board cards go to
          discard at turn end (Angels simply leave &mdash; they live in the Extra Deck).
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Card Types</div>
        <ListItem label="Ophanim">Played from hand. Immediate effect. No board presence. Your main draw / cycling / resource tools.</ListItem>
        <ListItem label="Seraphim">Front-row fighters with an On-Play effect, a While-On-Board passive, and an attack profile.</ListItem>
        <ListItem label="Cherubim">Back-row support with durability. Has On-Play, optional Enthalpy (placed) and Entropy (expired) rituals, and a passive that pings each card played.</ListItem>
        <ListItem label="Angel">Extra Deck. Summoned at any time when conditions are met. Spends the listed Seraphim, but the summon itself does not count as a card play.</ListItem>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Click Reference</div>
        <ListItem label="Hand">Left-click plays the card. Cherubim go to back row; Seraphim to front.</ListItem>
        <ListItem label="Seraphim">Left-click opens its attack panel. Right-click removes it for free.</ListItem>
        <ListItem label="Cherubim">Left-click an occupied slot to remove that Cherubim.</ListItem>
        <ListItem label="Angel">Left-click opens Primary / Exalted attacks. Right-click triggers the awaken ability once its cards-played requirement is met.</ListItem>
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
          Seraphim and Angels gain attack opportunities as you play cards. Their <Tag>cooldownCards</Tag> field
          is the number of cards that must be played between firings &mdash; there is always a minimum of 1
          card between consecutive shots. Each attack pays out a chunk of Oblivion, scaled by chain and any
          adjacent buffs.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <div style={cardAltStyle}>
          <div style={sectionHeadingStyle}>Seraphim Attacks</div>
          <ListItem label="Unsynergized">The reliable baseline. Available any time. Costs are paid in element-appropriate resources or discards.</ListItem>
          <ListItem label="Synergized">Requires an Angel on the board (often a matching element). Hits much harder, longer cooldown.</ListItem>
        </div>
        <div style={cardAltStyle}>
          <div style={sectionHeadingStyle}>Angel Attacks</div>
          <ListItem label="Primary">Consistent damage on a moderate cooldown.</ListItem>
          <ListItem label="Exalted">Finisher. Biggest payoff, longest cooldown, frequently requires a discard or sacrifice cost.</ListItem>
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Payment Modals</div>
        <div style={bodyTextStyle}>
          When an attack or effect requires a discard or sacrifice, a selection modal appears. The game does
          not auto-pick &mdash; you choose exactly which cards to spend.
        </div>
      </div>
    </>
  );
}

function PatienceBody() {
  return (
    <>
      <div style={cardStyle}>
        <div style={sectionHeadingStyle}>Neutrality &mdash; Patience</div>
        <div style={bodyTextStyle}>
          The starter deck is built around <Tag>Patience</Tag>. Every Seraphim with a patience threshold
          slowly stockpiles Patience as the turn unfolds, and cashes it in on attack.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Accumulation Rules</div>
        <ListItem label="Eligibility">Patience flows only when at least one Seraphim <em>or</em> Angel is on the board. With neither present, the engine is paused.</ListItem>
        <ListItem label="Per Card">Each card you play adds +1 Patience to every Seraphim on the board (no Angel-element synergy required).</ListItem>
        <ListItem label="Cherubim">Adjacent Cherubim with <Tag>patience per card</Tag> add extra Patience on top of the base +1.</ListItem>
        <ListItem label="Bursts">Effects like <Tag>patience gain all</Tag> and <Tag>patience double all</Tag> inject or double current Patience on the spot.</ListItem>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>The Payoff</div>
        <div style={bodyTextStyle}>
          When a Seraphim or Angel fires an attack, all of its accumulated Patience is consumed for{' '}
          <Tag>+15 Oblivion each</Tag>. If the stack met the unit's <Tag>patienceThreshold</Tag>, you also
          draw bonus cards. Stacks reset to zero after the attack &mdash; time your big swings carefully.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Starter Deck Focus</div>
        <ListItem label="Core Plan">The starter Neutrality lane teaches simple Patience sequencing: establish board, stack Patience through card plays, then attack at threshold breakpoints.</ListItem>
        <ListItem label="Practical Tip">Open with board units first, then play your draw/search Ophanim so each play adds value while your Seraphim are active.</ListItem>
      </div>
    </>
  );
}

function SetsBody() {
  const sets: Array<[string, string, string]> = [
    ['Neutrality', 'Patience / Stasis', 'Stockpile Patience on Seraphim, cash it out on attack. The friendly starter engine.'],
    ['Heavenly Light', 'Cadence, Radiance & Halo', 'Build note variety and Anchors for Cadence, then spend stocked Halo on your biggest Light burst turns.'],
    ['Pyroabyss', 'Heat Roles and Burst Windows', 'Base cards now split into stoke, threshold, tutor, and burst roles. Build Heat first, then cash in one burst window; add Chroma overlays only on higher-rarity turns.'],
    ['Thornbound Plains', 'Trail, Scar & Briar Spiral', 'Build Trail, convert to Scar manually in the HUD, then use Eternal Briar Spirals to amplify your payoff turn.'],
    ['Snowbound Voltage', 'Frost, Voltage & Polar Capacitors', 'Frost cards build Arctic Charge and Voltage cards cash it out; Eternity/Infinite cards add Polar Capacitor bank-and-release lines.'],
    ['Mechanical Dreams', 'Strain & Clock-Chime', 'Build Strain, track the 3-tick Clock, and spend stored Chimes on your strongest Mechanical attacks.'],
    ['Prismatic', 'Refraction & Prism Charge', 'Switch channels to build Refraction Depth and Prism Charge, then spend fixed charge amounts on payoff turns.'],
    ['Black Glass Inferno', 'Twin-Flame, Fracture & Eclipse', 'Balance White and Black Flame, build Fracture, then convert banked Eclipse through Eternal/Infinity burst windows.'],
    ['Glass Absolute', 'Fragments, Formation & Refraction', 'Build dense Glass board presence to hit fragment tiers, then use Refraction Charge on Eternal/Infinite cards to convert that formation into larger burst turns.'],
    ['Blazing Garden', 'Burn, Grove, Echo & Wild Pollen', 'Keep units in Burn, let charred cards seed Ember Grove, generate Wild Pollen from Eternal cards, then spend seeded payoffs for your lineage burst turn.'],
    ['Age of the Butterfly', 'Flutter Formation + Wing Resonance', 'Charge shared Spectrum, complete Formation across unit types, then cash Wing Resonance windows on Eternity/Infinite turns before Descent reset.'],
    ['Eternal Seas', 'Undertow, Foam & Deepwake', 'Build Undertow during the turn, release it for burst, spend 5 Foam in the HUD to draw 1 card, and use Deepwake on Eternal/Infinite cards to amplify your conversion turns.'],
  ];

  return (
    <>
      <div style={cardStyle}>
        <div style={sectionHeadingStyle}>Set Engines</div>
        <div style={bodyTextStyle}>
          Each set has a distinctive engine. You can build a mono-set deck for clean synergy or mix sets for
          cross-resource conversion. The in-game <Tag>Engine</Tag> panel always shows your current state for
          whatever set you're playing.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        {sets.map(([name, mech, body]) => (
          <div key={name} style={{
            ...cardAltStyle,
            padding: '9px 11px',
          }}>
            <div style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: PALETTE.inkDeep,
              fontFamily: DISPLAY_FONT,
              letterSpacing: 0.4,
            }}>{name}</div>
            <div style={{
              fontSize: 10.5,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: PALETTE.accent,
              fontWeight: 700,
              marginTop: 1,
              marginBottom: 4,
            }}>{mech}</div>
            <div style={{ ...bodyTextStyle, fontSize: 11.5, lineHeight: 1.5 }}>{body}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function RaritiesBody() {
  const tiers: Array<[string, string, string]> = [
    ['Common', 'Card packs', 'Simple and modest. The early deck backbone.'],
    ['Rare', 'Card packs', 'Noticeably stronger than Commons; introduces subset mechanics.'],
    ['Epic', 'Card packs', 'Impactful, often combo-shaped.'],
    ['Legendary', 'Card packs', 'Dramatic, deck-defining plays.'],
    ['Eternal', "Eternity's Wake boss drops", 'Much stronger; higher patience thresholds, bigger Cherubim payouts, set-defining payoff lines.'],
    ['Infinite', 'Infinitude crafting', 'Apex tier. Forged by consuming specific Eternals. Patience thresholds 8+, Angels with patience-double abilities.'],
  ];

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
        {tiers.map(([tier, source, body], i) => (
          <div key={tier} style={{
            display: 'grid',
            gridTemplateColumns: '92px 160px 1fr',
            gap: 10,
            padding: '8px 4px',
            borderBottom: i < tiers.length - 1 ? `1px solid ${PALETTE.borderSoft}` : 'none',
            alignItems: 'baseline',
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: PALETTE.inkDeep, fontFamily: DISPLAY_FONT, letterSpacing: 0.4 }}>{tier}</div>
            <div style={{ fontSize: 11, color: PALETTE.inkSoft, fontStyle: 'italic' }}>{source}</div>
            <div style={{ ...bodyTextStyle, fontSize: 12 }}>{body}</div>
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
        <ListItem label="Format">One boss per session, 3-minute timer, single turn. All Oblivion you generate is dealt as damage instead of banked.</ListItem>
        <ListItem label="Categories">Bosses are organized by set &mdash; Neutrality, Pyroabyss, Heavenly Light, Thornbound Plains, and so on. Use the tab strip at the top of the Wake menu to switch.</ListItem>
        <ListItem label="Rewards">First clear and repeat clears both grant Aberrated Shards and the boss's signature Eternal card. 60-second cooldown after any attempt.</ListItem>
        <ListItem label="Tier Progress">On completion, this mode awards +X <Tag>Card-light</Tag> for each card in your deck (and Extra Deck). Higher-tier bosses give more — early bosses grant ~3 per card, the hardest grant ~35. Wake Trials apply a bonus multiplier (capped at ×2). The displayed amount is the base; each card also receives an extra +5% per Tier it has already reached.</ListItem>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Infinitude &mdash; Crafting</div>
        <ListItem label="Recipes">Each Infinite is forged by consuming a specific combination of Eternal cards. Recipes are listed in the Infinitude menu.</ListItem>
        <ListItem label="Visibility">If a set has no Infinite recipes yet, no Infinites appear for that set &mdash; the menu reflects only what is actually craftable.</ListItem>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Card Packs</div>
        <div style={bodyTextStyle}>
          Open the Card Store to spend Oblivion on packs. Each pack has its own rarity weights and pity
          counters; the store displays them up front. Use the Deck Builder to assemble up to 50 cards plus an
          Extra Deck of Angels (max 5, up to 2 copies per definition).
        </div>
      </div>
    </>
  );
}

function CardBornTierBody() {
  const tiers: Array<[string, string, number, string]> = [
    ['Practiced',     '◈', 25,     'First steps. The card becomes familiar in your hands.'],
    ['Veteran',       '◆', 75,     'Consistent use — you know this card\'s timing.'],
    ['Master',        '✦', 400,    'Real commitment. The card has shaped your play.'],
    ['Eternal Bond',  '★', 1_500,  'This card is a staple, deeply understood.'],
    ['Resonant',      '✵', 3_000,  'Refined command — you push its limits each turn.'],
    ['Transcendent',  '✷', 6_000,  'Near-peak. Rare few reach here.'],
    ['Ascendant',     '✸', 15_000, 'One of your defining cards. Profound familiarity.'],
    ['Infinite Bond', '∞', 30_000, 'The apex tier. You and this card are inseparable.'],
  ];

  return (
    <>
      <div style={cardStyle}>
        <div style={sectionHeadingStyle}>What is Card-born Tier?</div>
        <div style={bodyTextStyle}>
          Every card you play from hand gains <Tag>+1 Card-light</Tag>. As its Card-light climbs through{' '}
          <Tag>8 tiers</Tag> — from Practiced to Infinite Bond — it earns{' '}
          <Tag>Resonance points</Tag> and a one-time shard reward at each milestone. Resonance feeds
          directly into your <Tag>Collection Power</Tag> multiplier, permanently boosting Oblivion
          earned from all attacks. Owning more copies of a card has no effect on Resonance — only the
          Card-light value on each unique card matters.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>The 8 Tiers</div>
        {tiers.map(([name, glyph, threshold, desc], i) => (
          <div key={name} style={{
            display: 'grid', gridTemplateColumns: '28px 110px 70px 1fr',
            gap: 10, padding: '6px 4px',
            borderBottom: i < tiers.length - 1 ? `1px solid ${PALETTE.borderSoft}` : 'none',
            alignItems: 'baseline',
          }}>
            <div style={{ fontSize: 14, color: PALETTE.accent, textAlign: 'center' }}>{glyph}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: PALETTE.inkDeep, fontFamily: DISPLAY_FONT }}>{name}</div>
            <div style={{ fontSize: 11, color: PALETTE.inkSoft }}>{threshold.toLocaleString()} Card-light</div>
            <div style={{ ...bodyTextStyle, fontSize: 11.5, lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <div style={cardStyle}>
          <div style={sectionHeadingStyle}>Resonance</div>
          <div style={bodyTextStyle}>
            Each tier reached on a card permanently adds <Tag>Resonance points</Tag> to your global pool.
            Resonance is your measure of investment across your entire card-born history — one point per
            unique card per tier reached, regardless of how many copies you own.
          </div>
        </div>
        <div style={cardAltStyle}>
          <div style={sectionHeadingStyle}>Collection Power</div>
          <div style={bodyTextStyle}>
            Your total Resonance fuels the <Tag>Collection Power</Tag> multiplier — a passive bonus that
            amplifies all Oblivion earned from Seraphim and Angel attacks. Claim each tier milestone from
            the <Tag>Card-born Tier</Tag> screen to bank its shard reward.
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Tier Progress from Boss Content</div>
        <div style={bodyTextStyle}>
          Completing Eternity's Wake boss fights, Wake Trials, and the Endless Gauntlet awards{' '}
          <Tag>+X Card-light for each card in your deck upon completion</Tag>. This stacks with
          Card-light gained from in-hand plays. The base amount scales with difficulty:
        </div>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ListItem label="Boss fights">~3 per card for the easiest bosses, up to ~35 for the hardest. Higher-index bosses in each set are harder and grant more.</ListItem>
          <ListItem label="Wake Trials">Apply the trial's reward multiplier to the boss base (capped at ×2 so stacked modifiers don't skip tiers).</ListItem>
          <ListItem label="Endless Gauntlet">5 per card minimum + 6 per depth level cleared. A 10-boss run grants ~60 per card.</ListItem>
          <ListItem label="Per-tier scaling">Each card also receives an extra +5% for every tier it has already reached. A T4 card gets ×1.20 the base amount; a T7 card gets ×1.35. Fresh cards are unaffected.</ListItem>
        </div>
        <div style={{ ...bodyTextStyle, marginTop: 8, color: PALETTE.inkSoft }}>
          The result screen for every boss fight shows the exact base amount awarded. Higher tiers still
          require substantial hand-play — boss rewards supplement the grind but cannot replace it.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Shard Rewards</div>
        <div style={bodyTextStyle}>
          Completing a tier milestone shows a <Tag>Claim</Tag> button in the Card-born Tier screen. You must
          manually claim each reward — they do not auto-collect. Use the filter toolbar (All / Claimable /
          In Progress) to find your pending milestones quickly. After claiming, the Claim All button at the
          top lets you sweep the rest in one click.
        </div>
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
          The secondary currency. Earned from <Tag>boss clears</Tag> (first-clear bonus + repeat bonus) and{' '}
          <Tag>daily logins</Tag>. Streak rewards scale across a 7-day cycle in the Daily Reward modal.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Holofoil Workshop</div>
        <ListItem label="Purpose">Spend Aberrated Shards to permanently convert one owned normal copy of a card into a holofoil copy.</ListItem>
        <ListItem label="Effect">Holofoils are purely cosmetic &mdash; they're tracked separately in your collection and in deck-building.</ListItem>
        <ListItem label="Filters">The Workshop supports filter, sort, and "show convertible" toggles so you can plan upgrades.</ListItem>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Card-born Tier</div>
        <div style={bodyTextStyle}>
          Every card you play accumulates Card-light mastery across <Tag>8 tiers</Tag> (Practiced → Infinite Bond).
          Each tier grants <Tag>Resonance points</Tag> and a shard reward. Resonance feeds your{' '}
          <Tag>Collection Power</Tag> multiplier, permanently boosting Oblivion earned from attacks.
          See the <Tag>Card-born Tier</Tag> section in this guide for the full breakdown.
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Profile, Titles &amp; Themes</div>
        <ListItem label="Profile">Set your display name and avatar from the Profile menu.</ListItem>
        <ListItem label="Titles">Earned by defeating specific bosses or crafting specific Infinites. They show as epithets on your profile card.</ListItem>
        <ListItem label="UI Theme">Switch between palette presets or save a custom theme from the Settings menu.</ListItem>
      </div>
    </>
  );
}

function PlayTutorialTurnBody({ onPlayTutorialTurn }: { onPlayTutorialTurn: (tier: NeutralityTutorialTier) => void }) {
  const launch = (tier: NeutralityTutorialTier) => () => onPlayTutorialTurn(tier);

  return (
    <>
      <div style={cardStyle}>
        <div style={sectionHeadingStyle}>Neutrality Training Lanes</div>
        <div style={bodyTextStyle}>
          Pick a single-turn tutorial lane and jump directly into a practice turn. These runs are training-only:
          no Card-light, no mastery rewards, no Resonance points, and no permanent account rewards.
        </div>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Starter Lane</div>
        <div style={{ ...bodyTextStyle, marginBottom: 10 }}>
          Default Neutrality deck. Learn patience flow and setup rhythm before moving up.
        </div>
        <button className="menu-tactile-btn" style={styles.playTurnBtn} onClick={launch('starter')}>
          Play Tutorial Turn: Neutrality Starter
        </button>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Eternal Lane</div>
        <div style={{ ...bodyTextStyle, marginBottom: 10 }}>
          Neutrality Eternal practice deck with advanced lines and heavier payoffs.
        </div>
        <button className="menu-tactile-btn" style={styles.playTurnBtn} onClick={launch('eternal')}>
          Play Tutorial Turn: Neutrality Eternal
        </button>
      </div>

      <div style={{ ...cardAltStyle, marginTop: 10 }}>
        <div style={sectionHeadingStyle}>Infinite Lane</div>
        <div style={{ ...bodyTextStyle, marginBottom: 10 }}>
          Neutrality Infinite practice deck for endgame sequencing and high-pressure turns.
        </div>
        <button className="menu-tactile-btn" style={styles.playTurnBtn} onClick={launch('infinite')}>
          Play Tutorial Turn: Neutrality Infinite
        </button>
      </div>
    </>
  );
}

// --- Modal -------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  playTurnBtn: {
    borderRadius: 10,
    border: `1px solid ${PALETTE.border}`,
    background: 'linear-gradient(180deg, rgba(255, 249, 240, 0.95) 0%, rgba(243, 223, 192, 0.92) 100%)',
    color: PALETTE.inkDeep,
    cursor: 'pointer',
    fontSize: 12,
    padding: '8px 12px',
    fontFamily: DISPLAY_FONT,
    letterSpacing: 0.45,
    width: '100%',
    textAlign: 'left',
  },
};

function buildSections(onPlayTutorialTurn: (tier: NeutralityTutorialTier) => void): Section[] {
  return [
    { id: 'overview', label: 'Overview', title: 'How To Play', subtitle: 'The game loop, currencies, and modes.', body: <OverviewBody /> },
    { id: 'play-turn', label: 'Play Tutorial Turn', title: 'Play Tutorial Turn', subtitle: 'Neutrality Starter -> Eternal -> Infinite practice lanes.', body: <PlayTutorialTurnBody onPlayTutorialTurn={onPlayTutorialTurn} /> },
    { id: 'turn-flow', label: 'Turn Flow', title: 'Turn Flow', subtitle: 'Begin -> Mulligan -> Play -> End.', body: <TurnFlowBody /> },
    { id: 'board', label: 'Board & Cards', title: 'The Board', subtitle: 'Slots, card types, and click behavior.', body: <BoardBody /> },
    { id: 'attacks', label: 'Attacks', title: 'Attacks', subtitle: 'How Seraphim and Angel attacks pay out.', body: <AttacksBody /> },
    { id: 'patience', label: 'Patience', title: 'Patience System', subtitle: 'The Neutrality starter engine.', body: <PatienceBody /> },
    { id: 'sets', label: 'Sets', title: 'Set Engines', subtitle: 'The mechanical identity of every set.', body: <SetsBody /> },
    { id: 'rarities', label: 'Rarities', title: 'Rarity Tiers', subtitle: 'From Common through Infinite.', body: <RaritiesBody /> },
    { id: 'modes', label: 'Modes', title: 'Wake, Infinitude & Packs', subtitle: 'Boss fights, crafting, and the store.', body: <ModesBody /> },
    { id: 'card-born-tier', label: 'Card-born Tier', title: 'Card-born Tier', subtitle: 'Card-light mastery, Resonance, and Collection Power.', body: <CardBornTierBody /> },
    { id: 'progression', label: 'Progression', title: 'Progression & Cosmetics', subtitle: 'Shards, holofoils, profile, and themes.', body: <ProgressionBody /> },
  ];
}

export default function TutorialModal({ onClose, onPlayTutorialTurn }: Props) {
  const sections = buildSections(onPlayTutorialTurn);
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
