import { uiTypography } from '@/ui/theme';

interface Props {
  onClose: () => void;
}

const DISPLAY_FONT = uiTypography.display;
const BODY_FONT = uiTypography.body;

const sectionStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(246, 233, 212, 0.94) 0%, rgba(238, 220, 193, 0.92) 100%)',
  border: '1px solid rgba(134, 94, 58, 0.26)',
  borderRadius: 14,
  padding: '13px 15px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 20px rgba(0,0,0,0.16)',
};

const headingStyle: React.CSSProperties = {
  fontSize: 11.5,
  letterSpacing: 1.1,
  textTransform: 'uppercase',
  color: '#5f2f17',
  marginBottom: 7,
  fontWeight: 700,
  fontFamily: DISPLAY_FONT,
};

const bodyTextStyle: React.CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.58,
  color: '#442618',
  fontFamily: BODY_FONT,
};

export default function TutorialModal({ onClose }: Props) {
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
        className="ornate-scroll"
        style={{
          width: 'min(820px, calc(100vw - 32px))',
          maxHeight: 'min(90vh, 820px)',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, rgba(248, 238, 223, 0.97) 0%, rgba(241, 226, 201, 0.97) 100%)',
          border: '1px solid rgba(150, 104, 66, 0.44)',
          borderRadius: 20,
          boxShadow: '0 28px 52px rgba(0,0,0,0.54), inset 0 0 0 1px rgba(255,255,255,0.38)',
          padding: '22px 22px 20px',
          color: '#3a2115',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(117, 78, 42, 0.24)', paddingBottom: 10 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#5f2f17', letterSpacing: 0.8, fontFamily: DISPLAY_FONT }}>How To Play</div>
            <div style={{ fontSize: 12.5, color: '#704022', marginTop: 3, fontFamily: BODY_FONT }}>Goal: go as infinite as possible before your deck engine stalls.</div>
          </div>
          <button className="menu-tactile-btn"
            onClick={onClose}
            style={{
              borderRadius: 10,
              border: '1px solid rgba(111, 73, 40, 0.35)',
              background: 'linear-gradient(180deg, rgba(255, 249, 240, 0.95) 0%, rgba(243, 223, 192, 0.92) 100%)',
              color: '#5f2f17',
              cursor: 'pointer',
              fontSize: 12.5,
              padding: '7px 13px',
              fontFamily: DISPLAY_FONT,
              letterSpacing: 0.5,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 11 }}>
          <div style={sectionStyle}>
            <div style={headingStyle}>Turn Flow</div>
            <div style={bodyTextStyle}>
              1) Begin Turn.
              <br />2) Mulligan: swap unwanted cards.
              <br />3) Play phase: place Seraphim/Cherubim, use Ophanim, summon Angels, then fire unit attacks.
              <br />4) End Turn: board resolves, cards recycle, next hand draws.
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={headingStyle}>Card Types</div>
            <div style={bodyTextStyle}>
              Ophanim: one-shot utility from hand.
              <br />Seraphim: front-row fighters with Unsynergized + Synergized attacks.
              <br />Cherubim: back-row ongoing effects with discard conditions (and some cards with durability).
              <br />Angel: extra-deck power cards with summon materials, awaken effects, and Primary/Exalted attacks.
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={headingStyle}>Oblivion Sources</div>
            <div style={bodyTextStyle}>
              Most Oblivion now comes from Seraphim and Angel attacks.
              <br />Play cards to build chain, reduce attack cooldowns, and enable your strongest attack lines.
              <br />Use board passives (especially Cherubim buffs) to amplify attack payouts.
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={headingStyle}>Cherubim Controls</div>
            <div style={bodyTextStyle}>
              Left-click plays a Cherubim from hand into the back row.
              <br />Left-click an occupied Cherubim on board to remove it.
              <br />Cherubim have no right-click alternate mode.
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={headingStyle}>Seraphim Attacks</div>
            <div style={bodyTextStyle}>
              Left-click a Seraphim on board to open its attack panel.
              <br />Right-click a Seraphim on board to remove it for free.
              <br />Unsynergized attacks are your reliable baseline and usually recover faster.
              <br />Synergized attacks require at least one Angel on your board and hit much harder.
              <br />Cooldowns are measured in cards played (not time), so sequencing matters.
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={headingStyle}>Angels</div>
            <div style={bodyTextStyle}>
              Open the ANGELS drawer during a play turn.
              <br />If a card says Angel Summon Ready, materials are met and you can summon.
              <br />Left-click an Angel on board to access Primary and Exalted attacks.
              <br />Exalted is your finisher: bigger impact, bigger cooldown, and often additional costs.
              <br />If an attack has costs, you will get a payment modal to discard or sacrifice exactly what is required.
              <br />Right-click is separate: it triggers the Angel's awaken effect once charged.
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={headingStyle}>Deck / Discard / Chain</div>
            <div style={bodyTextStyle}>
              Deck and Discard counters are clickable for pile inspection.
              <br />Chain rises as you play cards and scales attack payout.
              <br />Attack cooldowns also tick down from card plays, so cheap cycling is valuable.
              <br />Use board hover highlights to track your currently targeted front/back unit during sequencing.
              <br />Run your engine efficiently to avoid bricking and keep your attack windows active.
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={headingStyle}>Starter Deck Guide</div>
            <div style={bodyTextStyle}>
              The starter deck is 50 Neutrality cards. Suggested turn order:
              <br />1) Place Seraphim first so your attack lines are online.
              <br />2) Place Cherubim to buff attack base values, scaling, or cooldown cadence.
              <br />3) Play Ophanim to draw, cycle, and increase chain while reducing attack cooldowns.
              <br />4) Summon Angel when ready to unlock Synergized Seraphim lines.
              <br />5) Spend Primary/Exalted/Synergized attacks when they peak with your current chain.
              <br /><span style={{ color: '#6f3112', fontStyle: 'italic', fontFamily: BODY_FONT }}>Angel: Beginning - needs specific Seraphim on board. Open the ANGELS drawer to check summon conditions.</span>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={headingStyle}>Cherubim Tips</div>
            <div style={bodyTextStyle}>
              Each Cherubim card persists on the board until its discard condition is met (shown on the card), or until you remove it.
              <br />Most Cherubim passives apply globally while on board - you do not need adjacent Seraphim.
              <br />Cherubim are played normally from hand for their on-play effect and board passive.
              <br />Use their on-play effect for immediate value and their board presence for ongoing value.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}