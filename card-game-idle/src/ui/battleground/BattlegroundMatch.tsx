/**
 * BattlegroundMatch — supplementary HUD strip for an active Battleground match.
 *
 * The normal HUD renders as-is. This component adds only the battleground-specific
 * extras the normal HUD doesn't have: opponent name/score, match timer, and concede.
 * Positioned as a compact pill anchored just below the TopStatusBar (top: 54px).
 */
import { useEffect, useRef } from 'react';
import { useStore, selectBattleground } from '@/state/store';
import { useBattlegroundStore } from '@/state/battlegroundStore';
import { uiTypography } from '@/ui/theme';
import { CardRegistry } from '@/cards/CardRegistry';
import type { BoardState } from '@/types/game';

const DISPLAY_FONT = uiTypography.display;

// Palette
const BG_ACCENT = '#e85040';
const BG_GOLD   = '#daa058';
const BG_MUTED  = 'rgba(244,238,235,0.42)';

// Visual reference for the time bar — matches battleground match duration.
const BATTLEGROUND_MATCH_SECONDS = 300;

export default function BattlegroundMatch() {
  const battleground           = useStore(selectBattleground);
  const completeBattleground   = useStore(s => s.completeBattleground);
  const updateOpponentBattleground = useStore(s => s.updateOpponentBattleground);
  const beginTurn              = useStore(s => s.beginTurn);
  const board                  = useStore(s => s.board);
  const turn                   = useStore(s => s.turn);
  const broadcastBoard         = useBattlegroundStore(s => s.broadcastBoard);

  // CPU AI state refs — mutable without triggering re-renders.
  const cpuScoreRef = useRef(0);
  const cpuHandRef  = useRef(20);
  const cpuBoardRef = useRef<BoardState | null>(null);

  // Broadcast board to opponent whenever score changes (PvP only).
  useEffect(() => {
    if (battleground.mode !== 'active' || battleground.kind !== 'pvp') return;
    broadcastBoard(board, battleground.myScore);
  }, [battleground.myScore, battleground.kind, battleground.mode, board, broadcastBoard]);

  // CPU AI — accumulates score and updates the opponent board every 3 seconds.
  useEffect(() => {
    if (battleground.mode !== 'active' || battleground.kind !== 'cpu') return;

    const seraphimDefs = CardRegistry.getAll().filter(d => d.type === 'Seraphim');
    const fakeFront = Array.from({ length: 5 }, (_, i) => {
      const def = seraphimDefs[i];
      if (!def || def.type !== 'Seraphim') return null;
      return {
        instanceId: `cpu-s-${i}`,
        definitionId: def.definitionId,
        type: 'Seraphim' as const,
        element: def.element,
        rarity: def.rarity,
        finish: 'normal' as const,
        level: 1,
        isActive: true,
        attackCooldowns: {} as Record<string, number>,
        boardSlot: i as 0 | 1 | 2 | 3 | 4,
      };
    }) as BoardState['frontSlots'];

    cpuBoardRef.current = { frontSlots: fakeFront, backSlots: [null, null, null, null], activeBoardEffects: [] };
    cpuHandRef.current  = 20;
    cpuScoreRef.current = 0;

    const difficulty = battleground.cpuDifficulty ?? 'normal';
    const basePer3s  = difficulty === 'easy' ? 400 : difficulty === 'hard' ? 3000 : 1200;

    const id = setInterval(() => {
      const hand = Math.max(0, cpuHandRef.current - 1);
      cpuHandRef.current   = hand;
      cpuScoreRef.current += Math.round(basePer3s * (0.8 + Math.random() * 0.4));
      updateOpponentBattleground(cpuBoardRef.current, cpuScoreRef.current, hand);
      if (hand === 0) clearInterval(id);
    }, 3000);

    return () => clearInterval(id);
  }, [battleground.mode, battleground.kind, battleground.cpuDifficulty, updateOpponentBattleground]);

  if (battleground.mode !== 'active') return null;

  // ── Derived display values ─────────────────────────────────────────────────
  const remainingSecs = Math.max(0, battleground.timeRemaining);
  const mins    = Math.floor(remainingSecs / 60);
  const secs    = Math.floor(remainingSecs % 60);
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
  const timePercent = Math.max(0, remainingSecs / BATTLEGROUND_MATCH_SECONDS);
  const urgent  = remainingSecs <= 30;
  const warn    = remainingSecs <= 60;
  const timeColor = urgent ? '#ff4d4d' : warn ? '#ffcc00' : '#4dff91';

  const myAhead = battleground.myScore >= battleground.opponentScore;
  const oppName = battleground.kind === 'cpu'
    ? `CPU (${(battleground.cpuDifficulty ?? 'normal').toUpperCase()})`
    : (battleground.opponentProfile?.displayName ?? 'Opponent');

  const isIdle  = turn.phase === 'idle';
  // "Begin Turn" is only offered once per match — hide it after the player's turn is taken.
  const canBeginTurn = isIdle && !battleground.turnTaken;

  const modeBadge = battleground.kind === 'cpu'
    ? { text: `CPU · ${(battleground.cpuDifficulty ?? 'normal').toUpperCase()}`, color: '#c2a8ff', bg: 'rgba(140,90,255,0.18)', border: 'rgba(140,90,255,0.45)' }
    : { text: 'PVP · LIVE', color: '#4dff91', bg: 'rgba(40,200,80,0.12)', border: 'rgba(40,200,80,0.4)' };

  // Sits between TopStatusBar (52px tall) and the board (starts ~146px).
  // Absolute, horizontally centered, leaves the right rail (340px) clear.
  return (
    <div
      aria-label="Battleground match info"
      style={{
        position: 'absolute',
        top: 54,
        left: 0,
        right: 340,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <div
        style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '5px 14px',
        background: 'rgba(5,5,7,0.82)',
        border: '1px solid rgba(244,244,248,0.10)',
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.38)',
        pointerEvents: 'auto',
        fontFamily: DISPLAY_FONT,
      }}>

        {/* Mode badge */}
        <div style={{
          fontSize: 8, letterSpacing: 1.4, fontWeight: 700,
          padding: '2px 7px', borderRadius: 4,
          background: modeBadge.bg, color: modeBadge.color,
          border: `1px solid ${modeBadge.border}`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {modeBadge.text}
        </div>

        {/* Opponent info */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 8, letterSpacing: 1.4, color: BG_MUTED, textTransform: 'uppercase' }}>
            {oppName}
          </span>
          <span style={{
            fontSize: 16, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
            color: !myAhead ? BG_ACCENT : BG_MUTED,
            textShadow: !myAhead ? `0 0 12px ${BG_ACCENT}55` : 'none',
            transition: 'color 0.4s',
          }}>
            {battleground.opponentScore.toLocaleString()}
          </span>
          {battleground.opponentHandEmpty && (
            <span style={{ fontSize: 7, color: BG_ACCENT, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              · Empty
            </span>
          )}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 18, background: 'rgba(244,244,248,0.14)', flexShrink: 0 }} />

        {/* Timer */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 4,
          animation: urgent ? 'ewTimerPulse 1.1s ease-in-out infinite' : undefined,
        }}>
          <span style={{ fontSize: 7, letterSpacing: 1.6, color: BG_MUTED, textTransform: 'uppercase' }}>
            Time
          </span>
          <span style={{
            fontSize: 20, fontWeight: 900, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            color: timeColor,
            textShadow: `0 0 10px ${timeColor}66`,
            transition: 'color 0.4s',
          }}>
            {timeStr}
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 18, background: 'rgba(244,244,248,0.14)', flexShrink: 0 }} />

        {/* My score label (the actual number is in ScoreDisplay) */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontSize: 16, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
            color: myAhead ? BG_GOLD : BG_MUTED,
            textShadow: myAhead ? `0 0 12px ${BG_GOLD}44` : 'none',
            transition: 'color 0.4s',
          }}>
            {battleground.myScore.toLocaleString()}
          </span>
          <span style={{ fontSize: 8, letterSpacing: 1.4, color: BG_MUTED, textTransform: 'uppercase' }}>
            You
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 18, background: 'rgba(244,244,248,0.14)', flexShrink: 0 }} />

        {/* Begin Turn (only once per match) */}
        {canBeginTurn && (
          <button
            onClick={() => beginTurn()}
            style={{
              background: 'rgba(80,210,110,0.14)', border: '1px solid rgba(80,210,110,0.38)',
              borderRadius: 4, color: '#7defa0', fontSize: 8, fontFamily: DISPLAY_FONT,
              letterSpacing: 1.2, textTransform: 'uppercase', padding: '2px 8px',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(80,210,110,0.26)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(80,210,110,0.14)')}
          >
            Begin Turn
          </button>
        )}

        {/* Concede */}
        <button
          onClick={completeBattleground}
          title="End match now"
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(232,80,64,0.42)', fontSize: 8,
            fontFamily: DISPLAY_FONT, letterSpacing: 1,
            textTransform: 'uppercase', padding: '2px 0',
            cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = BG_ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,80,64,0.42)')}
        >
          Concede
        </button>
      </div>

      {/* Time-remaining bar — full width under the pill */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: 'rgba(0,0,0,0.25)', pointerEvents: 'none', zIndex: 1,
      }}>
        <div style={{
          height: '100%',
          width: `${timePercent * 100}%`,
          background: timeColor,
          transition: 'width 1s linear, background 0.5s ease',
          boxShadow: `0 0 5px ${timeColor}66`,
        }} />
      </div>
    </div>
  );
}