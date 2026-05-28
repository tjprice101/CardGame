import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, selectBossFight, selectTurn } from '@/state/store';
import { BOSS_DEFINITIONS, BOSS_FIGHT_ROUND_SECONDS } from '@/data/bosses/bossDefinitions';

// Cosmic cataclysm colour palette — void black with crimson accretion ring + chrome-white typography.
const EW_ACCENT = '#ff6b6b';
const EW_PANEL_BORDER = 'rgba(255,80,80,0.6)';
const EW_PANEL_TINT = 'rgba(2,2,4,0.96)';
const EW_TEXT = 'rgba(244,244,248,0.95)';
const EW_TEXT_MUTED = 'rgba(244,244,248,0.48)';
const EW_GOLD = '#ffd87a';

const MOTIVATIONAL_THRESHOLDS: { min: number; label: string }[] = [
  { min: 50_000_000, label: 'TRANSCENDENT!!!' },
  { min: 10_000_000, label: 'ETERNAL STRIKE!!' },
  { min: 5_000_000, label: 'CATACLYSMIC!' },
  { min: 1_000_000, label: 'DEVASTATING!' },
  { min: 250_000, label: 'CRUSHING' },
  { min: 50_000, label: 'STRONG' },
];

function motivationalLabel(value: number): string | null {
  for (const tier of MOTIVATIONAL_THRESHOLDS) {
    if (value >= tier.min) return tier.label;
  }
  return null;
}

export default function BossFightArena() {
  const bossFight = useStore(selectBossFight);
  const turn = useStore(selectTurn);
  const tickBossTimer = useStore(s => s.tickBossTimer);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (bossFight.mode !== 'active') {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(() => { tickBossTimer(1); }, 1000);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [bossFight.mode, tickBossTimer]);

  const damageThisTurn = turn.oblivionEarnedThisTurn;
  const currentLabel = motivationalLabel(damageThisTurn);
  const [callout, setCallout] = useState<{ key: number; text: string } | null>(null);
  const lastLabelRef = useRef<string | null>(null);

  useEffect(() => {
    if (bossFight.mode !== 'active') return;
    if (currentLabel && currentLabel !== lastLabelRef.current) {
      lastLabelRef.current = currentLabel;
      setCallout({ key: Date.now(), text: currentLabel });
      // CATACLYSMIC and above → hard shake; STRONG/CRUSHING → soft shake.
      const hardTiers = ['TRANSCENDENT!!!', 'ETERNAL STRIKE!!', 'CATACLYSMIC!', 'DEVASTATING!'];
      const isHard = hardTiers.includes(currentLabel);
      window.dispatchEvent(new Event(isHard ? 'hud-shake-hard' : 'hud-shake-soft'));
    }
    if (!currentLabel) lastLabelRef.current = null;
  }, [currentLabel, bossFight.mode]);

  useEffect(() => {
    if (bossFight.mode !== 'active') {
      lastLabelRef.current = null;
      setCallout(null);
    }
  }, [bossFight.activeBossId, bossFight.mode]);

  if (bossFight.mode !== 'active') return null;

  const boss = BOSS_DEFINITIONS.find(b => b.id === bossFight.activeBossId);
  if (!boss) return null;

  const hpPercent = Math.max(0, bossFight.bossCurrentHp / Math.max(1, bossFight.bossMaxHp));
  const timePercent = Math.max(0, bossFight.fightTimeRemaining / BOSS_FIGHT_ROUND_SECONDS);
  const timeCritical = timePercent <= 0.25;
  const timeWarn = timePercent <= 0.5;
  const timeColor = timeCritical ? '#ff4d4d' : timeWarn ? '#ffcc00' : '#4dff91';
  const remainingSeconds = Math.max(0, Math.ceil(bossFight.fightTimeRemaining));
  const timerMinutes = Math.floor(remainingSeconds / 60);
  const timerSeconds = String(remainingSeconds % 60).padStart(2, '0');

  const lowHp = hpPercent <= 0.3;
  const hpColor = lowHp ? '#ffae5e' : EW_ACCENT;

  const kind = bossFight.kind ?? 'normal';
  const gauntletDepth = bossFight.gauntletDepth ?? 0;
  const gauntletShardsBanked = bossFight.gauntletShardsBanked ?? 0;
  const modifiers = bossFight.modifiers ?? [];

  const modeBadge =
    kind === 'gauntlet'
      ? { text: `GAUNTLET · DEPTH ${gauntletDepth + 1}`, color: '#c2a8ff', bg: 'rgba(140, 90, 255, 0.18)' }
      : kind === 'trial'
        ? { text: 'WAKE TRIAL', color: '#ffd87a', bg: 'rgba(255, 215, 130, 0.18)' }
        : null;

  const damageDealtPct = bossFight.bossMaxHp > 0
    ? Math.min(100, (bossFight.damageDealtThisFight / bossFight.bossMaxHp) * 100)
    : 0;

  return (
    <div
      style={{
        position: 'absolute', top: 52, left: 0, right: 0, zIndex: 25, pointerEvents: 'none',
      }}
    >
      {/* Crimson chamber vignette overlay */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1,
          background: lowHp
            ? 'radial-gradient(circle at 50% 30%, rgba(255, 80, 80, 0.12) 0%, rgba(255, 80, 80, 0) 55%), radial-gradient(circle at 50% 110%, rgba(120, 20, 30, 0.32) 0%, rgba(120, 20, 30, 0) 60%)'
            : 'radial-gradient(circle at 50% 30%, rgba(255, 107, 107, 0.08) 0%, rgba(255, 107, 107, 0) 55%), radial-gradient(circle at 50% 110%, rgba(50, 10, 20, 0.22) 0%, rgba(50, 10, 20, 0) 60%)',
          transition: 'background 0.6s ease',
        }}
      />

      {/* Boss arena banner panel — cosmic cataclysm */}
      <div
        style={{
          margin: '0 auto 0 160px', width: 'calc(100% - 220px)', maxWidth: 860,
          background: `linear-gradient(180deg, ${EW_PANEL_TINT} 0%, rgba(8,2,14,0.97) 100%)`,
          border: `1px solid ${EW_PANEL_BORDER}`,
          borderRadius: '0 0 12px 12px',
          padding: '4px 14px 6px',
          display: 'flex', flexDirection: 'column', gap: 3,
          pointerEvents: 'auto',
          position: 'relative',
          animation: 'bossPanelSlideIn 0.8s cubic-bezier(0.22,0.61,0.36,1) both, accretionDiskGlow 3.6s ease-in-out infinite',
          overflow: 'hidden',
        }}
      >
        {/* Decorative top chrome accent — crimsoned at edges, star-white at centre */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 180, height: 2,
          background: `linear-gradient(90deg, transparent, ${EW_ACCENT}bb, rgba(244,244,248,0.9), ${EW_ACCENT}bb, transparent)`,
          borderRadius: 2,
          boxShadow: `0 0 12px ${EW_ACCENT}55`,
        }} />

        {/* Star-scatter micro-constellation on the panel void */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          opacity: 0.08,
          animation: 'voidStarDrift 60s linear infinite',
        }} />

        {/* Low-HP meteor streaks */}
        {lowHp && [0, 1, 2, 3, 4].map(n => (
          <div key={n} style={{
            position: 'absolute',
            left: `${8 + n * 19}%`,
            top: -8,
            width: 2, height: 10,
            borderRadius: 2,
            background: n % 2 === 0
              ? 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,80,80,0.4) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(200,100,255,0.4) 100%)',
            boxShadow: `0 0 6px ${n % 2 === 0 ? 'rgba(255,80,80,0.8)' : 'rgba(180,100,255,0.8)'}`,
            animation: `meteorFall ${1.6 + n * 0.3}s ease-in ${n * 0.28}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Header row: badge + boss name + timer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {modeBadge && (
              <div style={{
                fontSize: 10, letterSpacing: 1.5, fontWeight: 'bold',
                padding: '3px 8px', borderRadius: 4,
                background: modeBadge.bg,
                color: modeBadge.color,
                border: `1px solid ${modeBadge.color}88`,
                fontFamily: 'Georgia, serif',
                whiteSpace: 'nowrap',
              }}>{modeBadge.text}</div>
            )}
            <div style={{
              fontSize: 14, fontWeight: 'bold', color: 'rgba(244,244,248,0.98)',
              fontFamily: 'Georgia, serif',
              letterSpacing: 3,
              textShadow: `0 1px 4px rgba(0,0,0,0.9), 0 0 20px ${EW_ACCENT}88, 0 0 44px rgba(180,80,255,0.28)`,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {boss.name}
            </div>
          </div>

          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '2px 8px', borderRadius: 6,
              background: 'rgba(0,0,0,0.55)',
              border: `1px solid ${timeColor}66`,
              boxShadow: timeCritical ? `0 0 14px ${timeColor}44` : undefined,
              animation: timeCritical ? 'ewTimerPulse 1.1s ease-in-out infinite' : undefined,
            }}
          >
            <span style={{ fontSize: 8, color: EW_TEXT_MUTED, letterSpacing: 2 }}>TIME</span>
            <span style={{
              fontSize: 17, color: 'rgba(244,244,248,0.98)', fontFamily: 'Georgia, serif', fontWeight: 'bold',
              fontVariantNumeric: 'tabular-nums',
              textShadow: `0 0 14px ${timeColor}99, 0 1px 3px rgba(0,0,0,0.85)`,
              lineHeight: 1,
            }}>
              {timerMinutes}:{timerSeconds}
            </span>
          </div>
        </div>

        <HpBar hpPercent={hpPercent} damageDealtPct={damageDealtPct} color={hpColor} lowHp={lowHp} />

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6,
          fontSize: 10, fontFamily: 'Georgia, serif',
        }}>
          <Stat label="BOSS HP" value={`${bossFight.bossCurrentHp.toLocaleString()} / ${bossFight.bossMaxHp.toLocaleString()}`} color={EW_TEXT} />
          <Stat
            label="THIS TURN"
            value={turn.oblivionEarnedThisTurn.toLocaleString()}
            color={EW_GOLD}
            emphasize
          />
          <Stat label="TOTAL DEALT" value={bossFight.damageDealtThisFight.toLocaleString()} color={EW_TEXT_MUTED} align="right" />
        </div>

        {/* Timer bar */}
        <div style={{
          position: 'relative', height: 4, background: 'rgba(0,0,0,0.45)', borderRadius: 3, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: `${timePercent * 100}%`,
            background: `linear-gradient(90deg, ${timeColor}, ${timeColor}cc)`,
            borderRadius: 3,
            transition: 'width 1s linear, background 0.5s ease',
            boxShadow: `0 0 10px ${timeColor}88`,
          }} />
        </div>

        {kind === 'trial' && modifiers.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2,
          }}>
            {modifiers.map((m, i) => (
              <div key={i} style={{
                fontSize: 9.5, letterSpacing: 0.6,
                padding: '2px 7px', borderRadius: 4,
                background: 'rgba(255,215,130,0.12)',
                color: '#ffd87a',
                border: '1px solid rgba(255,215,130,0.35)',
                fontFamily: 'Georgia, serif',
              }}>{m.text}</div>
            ))}
          </div>
        )}

        {kind === 'gauntlet' && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 2, padding: '4px 8px', borderRadius: 6,
            background: 'rgba(140,90,255,0.08)',
            border: '1px solid rgba(140,90,255,0.3)',
            fontSize: 10, fontFamily: 'Georgia, serif', letterSpacing: 0.5,
          }}>
            <span style={{ color: '#c2a8ff' }}>SHARDS BANKED</span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{gauntletShardsBanked.toLocaleString()}</span>
          </div>
        )}
      </div>

      {callout && (
        <div
          key={callout.key}
          style={{
            position: 'fixed', top: 120, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'Georgia, serif', fontWeight: 'bold',
            fontSize: 42, letterSpacing: 6,
            textShadow: '0 0 22px rgba(244,244,248,0.6), 0 2px 5px rgba(0,0,0,0.9), 0 0 44px rgba(255,80,80,0.55)',
            animation: 'ewMotivationalRise 1.8s ease-out forwards',
            pointerEvents: 'none',
            background: 'linear-gradient(90deg, rgba(244,244,248,0.95), #ff6b6b, rgba(244,244,248,0.95))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            zIndex: 26,
          }}
        >
          {callout.text}
        </div>
      )}
    </div>
  );
}

function HpBar({
  hpPercent, damageDealtPct, color, lowHp,
}: {
  hpPercent: number;
  damageDealtPct: number;
  color: string;
  lowHp: boolean;
}) {
  const milestones = useMemo(() => [0.25, 0.5, 0.75], []);
  return (
    <div
      style={{
        position: 'relative',
        height: 11,
        background: 'rgba(0,0,0,0.65)',
        borderRadius: 14,
        overflow: 'hidden',
        border: `1px solid ${EW_PANEL_BORDER}`,
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.85)',
        animation: lowHp ? 'ewLowHpAlert 0.85s ease-in-out infinite' : undefined,
      }}
    >
      {/* Starfield visible in the unfilled/empty portion of the HP track */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(255,255,255,0.65) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        opacity: 0.14,
      }} />
      <div
        style={{
          position: 'absolute', top: 0, right: 0, height: '100%',
          width: `${damageDealtPct}%`,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.14))',
          borderRadius: 14,
          transition: 'width 0.6s ease',
        }}
      />
      {/* Afterburn ghost — lingers briefly after damage */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${hpPercent * 100}%`,
          background: `linear-gradient(180deg, rgba(255,180,80,0.35), rgba(255,100,60,0.35))`,
          borderRadius: 14,
          animation: 'afterburnFade 0.9s ease-out forwards',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${hpPercent * 100}%`,
          background: `linear-gradient(180deg, ${color}, #b3382b)`,
          borderRadius: 14,
          transition: 'width 0.45s cubic-bezier(.22,.61,.36,1), background 0.4s ease',
          boxShadow: `0 0 14px ${color}88, inset 0 1px 0 rgba(255,255,255,0.25)`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '40%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
            animation: 'ewHpSheen 3s ease-in-out infinite',
          }}
        />
      </div>
      {milestones.map(m => (
        <div
          key={m}
          style={{
            position: 'absolute', top: 4, bottom: 4,
            left: `${m * 100}%`,
            width: 1,
            background: 'rgba(255,255,255,0.18)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}

function Stat({ label, value, color, align, emphasize }: {
  label: string;
  value: string;
  color: string;
  align?: 'left' | 'right';
  emphasize?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <span style={{ fontSize: 8.5, letterSpacing: 1.4, color: EW_TEXT_MUTED }}>{label}</span>
      <span style={{
        color,
        fontSize: emphasize ? 12 : 10,
        fontWeight: emphasize ? 'bold' : 'normal',
        fontVariantNumeric: 'tabular-nums',
        textShadow: emphasize ? `0 0 10px ${color}88` : undefined,
      }}>{value}</span>
    </div>
  );
}
