import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, selectProgress, type ForgeWheelSpinResult } from '@/state/store';
import { useTranscendentUnlockStore } from '@/state/transcendentUnlockStore';
import { warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import {
  evaluateDailyLogin,
  getLocalDayIndex,
  getMonthlyTrackDays,
  getMonthlyTrackKey,
  getNextLocalDayResetAt,
  monthlyRewardForDay,
} from '@/systems/progression/dailyLogin';
import { formatQuestCountdown } from '@/systems/progression/quests';
import ShardDropRate from '@/ui/components/ShardDropRate';
import GameEmblem from '@/ui/components/GameEmblem';
import { originalItemIconUrl } from '@/ui/originalItemIcons';
import {
  FORGE_CALENDAR_BONUS_DAYS,
  FORGE_STREAK_MILESTONES,
  FORGE_WHEEL_PRIZES,
  FORGE_WHEEL_TOTAL_WEIGHT,
  areShardDropRatesVisible,
  formatShardDropChance,
} from '@/data/forge/forgeDefinitions';

interface Props {
  onClose: () => void;
  onOpenForge: () => void;
}

type CalendarTab = 'calendar' | 'streak' | 'wheel';
type WheelPrize = typeof FORGE_WHEEL_PRIZES[number];

const WHEEL_SPIN_MS = 5200;

function wheelPrizeLabel(result: ForgeWheelSpinResult): string {
  return result.prize.kind === 'divine_light' ? `+${result.amount.toLocaleString()} Divine Light` : result.prize.label;
}

/** Announces an already-committed wheel prize once the wheel has visually stopped. */
function presentWheelReward(result: ForgeWheelSpinResult): void {
  useStore.getState().enqueueToast(result.toastMessage, 'reward', 4200);
  if (result.prize.kind === 'shards_of_transcendence' && result.shardsOfTranscendenceTotal !== undefined) {
    useTranscendentUnlockStore.getState().enqueue({ kind: 'shards', amount: result.amount, totalOwned: result.shardsOfTranscendenceTotal });
  }
}

function shadeHex(color: string, amount: number): string {
  const channels = colorToRgbChannels(color).split(',').map(value => Number(value.trim()));
  const target = amount >= 0 ? 255 : 0;
  const mix = Math.abs(amount);
  return `rgb(${channels.map(channel => Math.round(channel + (target - channel) * mix)).join(', ')})`;
}

const WHEEL_BULB_COUNT = 24;

const WHEEL_SEGMENTS = (() => {
  let angle = -90;
  return FORGE_WHEEL_PRIZES.map((prize, index) => {
    const startAngle = angle;
    const sweep = prize.weight / FORGE_WHEEL_TOTAL_WEIGHT * 360;
    angle += sweep;
    return { prize, index: index + 1, startAngle, endAngle: angle, middleAngle: startAngle + sweep / 2 };
  });
})();

function polarPoint(angle: number, radius: number): [number, number] {
  const radians = angle * Math.PI / 180;
  return [112 + radius * Math.cos(radians), 112 + radius * Math.sin(radians)];
}

function wheelSegmentPath(startAngle: number, endAngle: number): string {
  const [startX, startY] = polarPoint(startAngle, 102);
  const [endX, endY] = polarPoint(endAngle, 102);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M 112 112 L ${startX} ${startY} A 102 102 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

function colorToRgbChannels(color: string): string {
  const match = color.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (!match) return '201, 164, 92';
  const hex = match[1]!.length === 3
    ? match[1]!.split('').map(channel => `${channel}${channel}`).join('')
    : match[1]!;
  return `${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}`;
}

export default function DailyRewardModal({ onClose, onOpenForge }: Props) {
  useThemeVersion();
  const progress = useStore(selectProgress);
  const colorMode = useStore(state => state.settings.buttonColorMode);
  const claimDailyReward = useStore(state => state.claimDailyReward);
  const claimDailyStreakMilestone = useStore(state => state.claimDailyStreakMilestone);
  const spinForgeWheel = useStore(state => state.spinForgeWheel);
  const forgeUnlocked = progress.forgeOfTranscendenceUnlocked === true;

  const [nowTick, setNowTick] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<CalendarTab>('calendar');
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelResult, setWheelResult] = useState<ForgeWheelSpinResult | null>(null);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [frozenWallet, setFrozenWallet] = useState<{ aberratedShards: number; shardsOfTranscendence: number; divineLight: number } | null>(null);
  const [recentSpins, setRecentSpins] = useState<string[]>([]);
  const pendingWheelReveal = useRef<ForgeWheelSpinResult | null>(null);
  const wheelRevealTimer = useRef<number | undefined>(undefined);
  const reducedMotion = useStore(state => state.settings.reducedMotion) === true;

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const evalResult = useMemo(() => evaluateDailyLogin(progress, nowTick), [progress, nowTick]);
  const nextResetCountdown = formatQuestCountdown(getNextLocalDayResetAt(nowTick) - nowTick);
  const trackKey = getMonthlyTrackKey(nowTick);
  const daysInMonth = getMonthlyTrackDays(nowTick);
  const today = new Date(nowTick).getDate();
  const todayIndex = getLocalDayIndex(nowTick);
  const currentStreak = progress.dailyLogin.streak ?? 0;
  const isClaimedToday = progress.dailyLogin.lastClaimedDayIndex === todayIndex;
  const rawClaimedDays = progress.dailyLogin.monthlyTrackKey === trackKey
    ? (progress.dailyLogin.monthlyClaimedDays ?? [])
    : [];
  const claimedDays = useMemo(() => {
    let days = rawClaimedDays;
    if (isClaimedToday && progress.dailyLogin.monthlyTrackKey === trackKey && !days.includes(today) && days.some(day => day > today)) {
      days = days.map(day => day > today ? today : day);
    } else if (days.length === 0 && isClaimedToday) {
      days = [today];
    }
    return Array.from(new Set(days));
  }, [rawClaimedDays, isClaimedToday, progress.dailyLogin.monthlyTrackKey, trackKey, today]);
  const track = useMemo(
    () => Array.from({ length: daysInMonth }, (_, index) => ({ day: index + 1, reward: monthlyRewardForDay(index + 1, nowTick) })),
    [daysInMonth, nowTick],
  );
  const selectedReward = track.find(entry => entry.day === selectedDay)?.reward ?? monthlyRewardForDay(today, nowTick);
  const pendingDay = evalResult.monthlyDay;
  const pendingReward = evalResult.monthlyReward;
  const canClaim = evalResult.claimable && pendingReward !== undefined;
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(nowTick));
  const firstWeekday = new Date(new Date(nowTick).getFullYear(), new Date(nowTick).getMonth(), 1).getDay();
  const showShardRates = areShardDropRatesVisible(progress);
  const claimedStreakMilestones = progress.dailyLogin.claimedStreakMilestones ?? [];
  const storedSpins = progress.forgeWheelSpins ?? 0;
  const lastSpinDay = progress.forgeWheelLastAccruedDayIndex ?? todayIndex;
  const spinsAvailable = forgeUnlocked ? storedSpins + Math.max(0, todayIndex - lastSpinDay) : 0;

  const rewardSummary = (reward: typeof track[number]['reward']) => {
    if (reward.kind === 'shards') return `+${reward.amount} Aberrated Shards`;
    if (reward.kind === 'divine_light') return `+${reward.amount.toLocaleString()} Divine Light`;
    if (reward.kind === 'transcendent_shards') return `+${reward.amount} Shard${reward.amount === 1 ? '' : 's'} of Transcendence`;
    return `+${reward.amount} Card-light to all owned cards`;
  };

  const rewardDescription = (reward: typeof track[number]['reward']) => {
    if (reward.kind === 'shards') return 'Aberrated Shards can be spent in the Card Store.';
    if (reward.kind === 'divine_light') return 'Divine Light is added to your persistent balance and scaled by Collection Power.';
    if (reward.kind === 'transcendent_shards') return 'Shards of Transcendence are used by the Forge of Transcendence.';
    return 'Advances Card-light mastery for every card you own.';
  };

  const rewardIcon = (reward: typeof track[number]['reward']) => {
    if (reward.kind === 'shards') return originalItemIconUrl('resource-icons/aberrated-shards.png');
    if (reward.kind === 'divine_light') return originalItemIconUrl('resource-icons/divine-light.png');
    if (reward.kind === 'transcendent_shards') return originalItemIconUrl('forge/shards-of-transcendence.png');
    return originalItemIconUrl('resource-icons/card-light-shards.png');
  };

  const wheelPrizeIcon = (prize: WheelPrize) => {
    if (prize.kind === 'aberrated_shards') return originalItemIconUrl('resource-icons/aberrated-shards.png');
    if (prize.kind === 'card_light_all') return originalItemIconUrl('resource-icons/card-light-shards.png');
    if (prize.kind === 'shards_of_transcendence') return originalItemIconUrl('forge/shards-of-transcendence.png');
    return originalItemIconUrl('resource-icons/divine-light.png');
  };

  function handleClaim() {
    const result = claimDailyReward();
    if (result) onClose();
  }

  function handleWheelSpin() {
    if (wheelSpinning) return;
    const balancesBeforeSpin = {
      aberratedShards: progress.aberratedShards,
      shardsOfTranscendence: progress.shardsOfTranscendence ?? 0,
      divineLight: progress.divineLight,
    };
    const result = spinForgeWheel({ deferPresentation: true });
    if (!result) return;
    pendingWheelReveal.current = result;
    setFrozenWallet(balancesBeforeSpin);
    setWheelResult(null);
    setWheelSpinning(true);
    const segment = WHEEL_SEGMENTS.find(item => item.prize.id === result.prize.id);
    if (segment) {
      const sweep = segment.endAngle - segment.startAngle;
      const landingAngle = segment.middleAngle + (Math.random() - 0.5) * sweep * 0.6;
      setWheelRotation(previous => {
        const current = ((previous % 360) + 360) % 360;
        const target = ((-90 - landingAngle - current) % 360 + 360) % 360;
        return previous + 360 * 6 + target;
      });
    }
    window.clearTimeout(wheelRevealTimer.current);
    wheelRevealTimer.current = window.setTimeout(revealWheelResult, reducedMotion ? 50 : WHEEL_SPIN_MS + 120);
  }

  function revealWheelResult() {
    window.clearTimeout(wheelRevealTimer.current);
    const result = pendingWheelReveal.current;
    if (!result) return;
    pendingWheelReveal.current = null;
    presentWheelReward(result);
    setWheelResult(result);
    setWheelSpinning(false);
    setFrozenWallet(null);
    setRecentSpins(previous => [wheelPrizeLabel(result), ...previous].slice(0, 5));
  }

  useEffect(() => () => {
    // Leaving mid-spin still announces the already-granted reward.
    window.clearTimeout(wheelRevealTimer.current);
    if (pendingWheelReveal.current) presentWheelReward(pendingWheelReveal.current);
    pendingWheelReveal.current = null;
  }, []);

  const wallet = frozenWallet ?? {
    aberratedShards: progress.aberratedShards,
    shardsOfTranscendence: progress.shardsOfTranscendence ?? 0,
    divineLight: progress.divineLight,
  };

  const selectedIcon = rewardIcon(selectedReward);
  const upcomingSpecials = track
    .filter(entry => entry.day > today && entry.reward.kind !== 'shards')
    .slice(0, 4);

  return (
    <div className="login-calendar-screen" style={{
      ['--calendar-base' as string]: colorMode === 'light' ? '#ffffff' : '#000000',
      ['--ui-accent' as string]: colorToRgbChannels(warmTheme.accent),
      ['--ui-accent-soft' as string]: colorToRgbChannels(warmTheme.accentSoft),
      ['--calendar-accent' as string]: warmTheme.accent,
      ['--calendar-accent-soft' as string]: warmTheme.accentSoft,
      ['--calendar-accent-deep' as string]: warmTheme.accentDeep,
      ['--calendar-border' as string]: warmTheme.border,
      ['--calendar-border-strong' as string]: warmTheme.borderStrong,
      ['--calendar-surface' as string]: warmTheme.surface,
      ['--calendar-surface-strong' as string]: warmTheme.surfaceStrong,
      ['--calendar-surface-muted' as string]: warmTheme.surfaceMuted,
      ['--calendar-text' as string]: warmTheme.text,
      ['--calendar-text-soft' as string]: warmTheme.textSoft,
      ['--calendar-text-muted' as string]: warmTheme.textMuted,
      ['--calendar-text-faint' as string]: warmTheme.textFaint,
      ['--calendar-success' as string]: warmTheme.accentSoft,
      ['--calendar-danger' as string]: warmTheme.danger,
      ['--calendar-button' as string]: warmTheme.button,
    } as React.CSSProperties}>
      <header className="login-calendar-header">
        <div className="login-calendar-heading">
          <div className="login-calendar-eyebrow">Monthly expedition</div>
          <h1>Login calendar</h1>
          <p>One reward per local day. Missed calendar days do not queue.</p>
        </div>
        <div className="login-calendar-header-stats">
          <div className="login-calendar-wallet" aria-label="Current balances">
            <span title="Aberrated Shards"><img src={originalItemIconUrl('resource-icons/aberrated-shards.png')}             alt="" />{wallet.aberratedShards.toLocaleString()}</span>
                        <span title="Shards of Transcendence" className="is-violet"><img src={originalItemIconUrl('forge/shards-of-transcendence.png')} alt="" />{wallet.shardsOfTranscendence.toLocaleString()}</span>
                        <span title="Divine Light" className="is-gold"><img src={originalItemIconUrl('resource-icons/divine-light.png')} alt="" />{Math.floor(wallet.divineLight).toLocaleString()}</span>
          </div>
          <div className="login-calendar-month">
            <strong>{monthLabel}</strong>
            <span>{claimedDays.length} / {daysInMonth} claimed</span>
            <div className="login-calendar-progress"><i style={{ width: `${claimedDays.length / daysInMonth * 100}%` }} /></div>
          </div>
        </div>
      </header>

      <nav className="login-calendar-tabs" aria-label="Login rewards sections" role="tablist">
        {([
          ['calendar', 'Calendar'],
          ['streak', 'Streak rewards'],
          ['wheel', `${forgeUnlocked ? '◈' : '🔒'} Wheel of Transcendence`],
        ] as const).map(([tab, label]) => (
          <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>
            {label}
          </button>
        ))}
      </nav>

      <main className="login-calendar-main">
        {activeTab === 'calendar' && (
          <div className="login-calendar-content">
            <section className="login-calendar-board" aria-label={`${monthLabel} reward calendar`}>
              <div className="login-calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span key={day}>{day}</span>)}
              </div>
              <div className="login-calendar-days">
                {Array.from({ length: firstWeekday }, (_, index) => <div key={`empty-${index}`} aria-hidden="true" />)}
                {track.map(({ day, reward }) => {
                  const isClaimed = claimedDays.includes(day);
                  const isToday = day === today;
                  const isPending = day === pendingDay;
                  const isMissed = day < today && !isClaimed;
                  const icon = rewardIcon(reward);
                  const status = isClaimed ? 'Claimed' : isPending ? 'Ready' : isToday ? 'Today' : isMissed ? 'Missed' : 'Upcoming';
                  return (
                    <button key={day} type="button" aria-label={`Day ${day}: ${rewardSummary(reward)}. ${status}.`} aria-pressed={selectedDay === day}
                      className={`login-calendar-day${isClaimed ? ' is-claimed' : ''}${isToday ? ' is-today' : ''}${isPending ? ' is-pending' : ''}${isMissed ? ' is-missed' : ''}${selectedDay === day ? ' is-selected' : ''}`}
                      onClick={() => setSelectedDay(day)}>
                      <span className="login-calendar-day-top"><span>Day {day}</span><em>{isClaimed ? '✓ Claimed' : isPending ? 'Ready' : isToday ? 'Today' : isMissed ? 'Missed' : ''}</em></span>
                      <span className="login-calendar-day-reward">
                        {icon && <img src={icon} alt="" aria-hidden="true" />}
                        <span className="login-calendar-day-copy"><strong>{rewardSummary(reward)}</strong><small>{reward.kind === 'mastery_all_owned' ? 'Card-light mastery' : reward.kind === 'divine_light' ? 'Persistent currency' : reward.kind === 'transcendent_shards' ? 'Forge currency' : 'Aberrated Shards'}</small></span>
                      </span>
                      {showShardRates && FORGE_CALENDAR_BONUS_DAYS.includes(day) && <span className="login-calendar-bonus">Bonus shard · {formatShardDropChance()}</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            <aside className="login-calendar-inspector" aria-label={`Day ${selectedDay} reward details`}>
              <div className={`login-calendar-inspector-art reward-${selectedReward.kind}`}>
                {selectedIcon && <img src={selectedIcon} alt="" aria-hidden="true" />}
              </div>
              <div className="login-calendar-inspector-body">
                <h2>{rewardSummary(selectedReward)}</h2>
                <div className="login-calendar-inspector-type">Day {selectedDay} · {selectedDay === today ? 'Today' : claimedDays.includes(selectedDay) ? 'Claimed' : selectedDay < today ? 'Missed' : 'Upcoming'}</div>
                <h3>Reward</h3>
                <p>{rewardDescription(selectedReward)}</p>
                {showShardRates && FORGE_CALENDAR_BONUS_DAYS.includes(selectedDay) && (
                  <div className="login-calendar-inspector-bonus">
                    <h3>Bonus chance</h3>
                    <ShardDropRate label={`${formatShardDropChance()} · 1–3 bonus Shards of Transcendence`} fontSize={11} style={{ marginTop: 5, padding: '5px 8px' }} />
                  </div>
                )}
                <h3>Coming up</h3>
                {upcomingSpecials.length ? upcomingSpecials.map(entry => (
                  <div className="login-calendar-next" key={entry.day}>
                    <span>Day {entry.day} · {rewardSummary(entry.reward)}</span><em>in {entry.day - today}d</em>
                  </div>
                )) : <p className="login-calendar-muted">No more special rewards this month.</p>}
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'streak' && (
          <section className="login-streak-view">
            <div className="login-streak-summary">
              <div className="login-calendar-eyebrow">Login streak</div>
              <strong>{currentStreak}</strong>
              <span>consecutive days</span>
              <p>Daily Aberrated Shard rewards continue as usual. These one-time milestones are separate from calendar rewards.</p>
            </div>
            <div className="login-streak-milestones">
              {FORGE_STREAK_MILESTONES.map(milestone => {
                const isClaimed = claimedStreakMilestones.includes(milestone.day);
                const isReady = currentStreak >= milestone.day && !isClaimed;
                const rewardName = milestone.kind === 'aberrated_shards' ? 'Aberrated Shards' : 'Shards of Transcendence';
                return (
                  <article key={milestone.day} className={`login-streak-card${isReady ? ' is-ready' : ''}`}>
                    <div className="login-streak-card-main">
                      <div>
                        <div className="login-calendar-eyebrow">{milestone.day}-day streak</div>
                        <h2>{milestone.label}</h2>
                        <p>{Math.min(currentStreak, milestone.day)} / {milestone.day} consecutive days</p>
                      </div>
                      <img className="login-streak-icon" src={milestone.kind === 'aberrated_shards' ? originalItemIconUrl('resource-icons/aberrated-shards.png') : originalItemIconUrl('forge/shards-of-transcendence.png')} alt="" />
                    </div>
                    <div className="login-streak-meter"><i style={{ width: `${Math.min(100, currentStreak / milestone.day * 100)}%` }} /></div>
                    <button type="button" className="login-calendar-claim" disabled={!isReady} onClick={() => claimDailyStreakMilestone(milestone.day as 3 | 14)}>
                      {isClaimed ? 'Claimed' : isReady ? `Claim ${milestone.amount.toLocaleString()} ${rewardName}` : 'Locked'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'wheel' && (
          forgeUnlocked ? (
            <section className={`login-wheel-view${wheelSpinning ? ' is-spinning' : ''}${wheelResult ? ' is-revealed' : ''}`}>
              <div className="login-wheel-stage">
                <div className="login-wheel-aura" aria-hidden="true" />
                <svg className="login-wheel-pointer" viewBox="0 0 40 52" aria-hidden="true">
                  <defs>
                    <linearGradient id="login-wheel-pointer-gold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#fff4cf" /><stop offset="0.45" stopColor="#e2b85c" /><stop offset="1" stopColor="#7c5419" />
                    </linearGradient>
                  </defs>
                  <path d="M20 50 4 14a16 16 0 1 1 32 0Z" fill="url(#login-wheel-pointer-gold)" stroke="#3b2608" strokeWidth="1.2" />
                  <circle cx="20" cy="16" r="7" fill="#1a0f22" stroke="#fff1c7" strokeWidth="1" />
                  <circle cx="20" cy="16" r="3.6" className="login-wheel-pointer-gem" />
                </svg>
                <svg className="login-wheel-svg" viewBox="0 0 224 224" role="img" aria-label="Wheel of Transcendence prize wheel">
                  <defs>
                    <linearGradient id="login-wheel-gold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#fff2c6" /><stop offset="0.28" stopColor="#d9ab4f" /><stop offset="0.55" stopColor="#80571a" /><stop offset="0.8" stopColor="#e8c370" /><stop offset="1" stopColor="#6d4813" />
                    </linearGradient>
                    <radialGradient id="login-wheel-shade" cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" /><stop offset="0.45" stopColor="#ffffff" stopOpacity="0.04" /><stop offset="0.86" stopColor="#000000" stopOpacity="0.12" /><stop offset="1" stopColor="#000000" stopOpacity="0.42" />
                    </radialGradient>
                    <linearGradient id="login-wheel-sheen" x1="0.15" y1="0" x2="0.7" y2="1">
                      <stop offset="0" stopColor="#ffffff" stopOpacity="0.3" /><stop offset="0.38" stopColor="#ffffff" stopOpacity="0.05" /><stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                    {WHEEL_SEGMENTS.map(segment => (
                      <radialGradient key={segment.prize.id} id={`login-wheel-segment-${segment.prize.id}`} cx="112" cy="112" r="102" gradientUnits="userSpaceOnUse">
                        <stop offset="0.12" stopColor={shadeHex(segment.prize.color, 0.32)} /><stop offset="0.66" stopColor={segment.prize.color} /><stop offset="1" stopColor={shadeHex(segment.prize.color, -0.42)} />
                      </radialGradient>
                    ))}
                  </defs>
                  <circle cx="112" cy="112" r="111" fill="url(#login-wheel-gold)" />
                  <circle cx="112" cy="112" r="106.5" fill="#0c0712" stroke="var(--calendar-border-strong)" strokeWidth="0.8" />
                  {Array.from({ length: WHEEL_BULB_COUNT }, (_, index) => {
                    const [x, y] = polarPoint(index / WHEEL_BULB_COUNT * 360 - 90, 108.8);
                    return <circle key={index} className="login-wheel-bulb" cx={x} cy={y} r="1.5" style={{ animationDelay: `${(index % 6) * 0.12}s` }} />;
                  })}
                  <g className="login-wheel-rotor" style={{ transform: `rotate(${wheelRotation}deg)`, transitionDuration: `${reducedMotion ? 0 : WHEEL_SPIN_MS}ms` }}>
                    {WHEEL_SEGMENTS.map(segment => {
                      const labelPosition = polarPoint(segment.middleAngle, 80);
                      const isWinner = wheelResult?.prize.id === segment.prize.id;
                      return (
                        <g key={segment.prize.id} className={isWinner ? 'is-winner' : undefined}>
                          <path d={wheelSegmentPath(segment.startAngle, segment.endAngle)} fill={segment.prize.color} />
                          <path d={wheelSegmentPath(segment.startAngle, segment.endAngle)} fill={`url(#login-wheel-segment-${segment.prize.id})`} />
                          {isWinner && <path className="login-wheel-winner-glow" d={wheelSegmentPath(segment.startAngle, segment.endAngle)} />}
                          <circle cx={labelPosition[0]} cy={labelPosition[1]} r="8.6" fill="rgba(12,7,18,0.68)" stroke="#f2d48b" strokeWidth="0.8" />
                          <text x={labelPosition[0]} y={labelPosition[1] + 0.4} fill="#ffffff" textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fontFamily="Georgia, 'Times New Roman', serif">
                            {segment.index}
                          </text>
                        </g>
                      );
                    })}
                    {WHEEL_SEGMENTS.map(segment => {
                      const [x, y] = polarPoint(segment.startAngle, 102);
                      const [pegX, pegY] = polarPoint(segment.startAngle, 97);
                      return (
                        <path key={`divider-${segment.prize.id}`} d={`M 112 112 L ${x} ${y} M ${pegX - 0.01} ${pegY} a 2.3 2.3 0 1 0 0.02 0`} stroke="#f2d48b" strokeWidth="1.1" fill="#fff3cf" strokeLinecap="round" />
                      );
                    })}
                    <circle cx="112" cy="112" r="102" fill="url(#login-wheel-shade)" />
                    <circle cx="112" cy="112" r="58" fill="none" stroke="rgba(255,240,200,0.32)" strokeWidth="0.6" strokeDasharray="1.2 3" />
                    <circle cx="112" cy="112" r="101.5" fill="none" stroke="#f2d48b" strokeWidth="1.1" />
                  </g>
                  <path d="M 30 70 A 90 90 0 0 1 150 26 L 112 112 Z" fill="url(#login-wheel-sheen)" pointerEvents="none" />
                  <circle cx="112" cy="112" r="23" fill="url(#login-wheel-gold)" />
                  <circle cx="112" cy="112" r="19" fill="#120a1a" stroke="#3a250a" strokeWidth="0.8" />
                  <circle cx="112" cy="112" r="15.5" fill="none" stroke="rgba(242,212,139,0.45)" strokeWidth="0.6" strokeDasharray="1 2" />
                  <path className="login-wheel-hub-star" d="m112 99 3.2 9.8 9.8 3.2-9.8 3.2-3.2 9.8-3.2-9.8-9.8-3.2 9.8-3.2Z" />
                  <circle cx="112" cy="112" r="2.2" fill="#fff8e1" />
                </svg>
              </div>
              <div className="login-wheel-controls">
                <div className="login-calendar-eyebrow">Wheel of Transcendence</div>
                <div className="login-wheel-spin-count">{spinsAvailable} <span>free {spinsAvailable === 1 ? 'spin' : 'spins'} available</span></div>
                <p>One free spin accrues each local day while the Forge is open. Spins accumulate when you are away. Each spin is spent and saved the instant you pull the wheel.</p>
                <div className="login-wheel-reveal-slot" role="status" aria-live="polite">
                  {wheelSpinning && <div className="login-wheel-turning"><i /><span>The wheel is turning&hellip;</span></div>}
                  {!wheelSpinning && wheelResult && (
                    <div className="login-wheel-reveal" key={`${wheelResult.prize.id}-${recentSpins.length}`} style={{ ['--prize-color' as string]: wheelResult.prize.color } as React.CSSProperties}>
                      <img src={wheelPrizeIcon(wheelResult.prize)} alt="" />
                      <span><small>Fate grants</small><strong>{wheelPrizeLabel(wheelResult)}</strong></span>
                    </div>
                  )}
                </div>
                <button type="button" className="login-calendar-claim is-wheel" disabled={spinsAvailable < 1 || wheelSpinning} onClick={handleWheelSpin}>{wheelSpinning ? 'Spinning' + '\u2026' : 'Spin the wheel'}</button>
                <div className="login-wheel-history">
                  <h3>Recent spins</h3>
                  {recentSpins.length ? recentSpins.map((spin, index) => <div className="login-calendar-next" key={`${spin}-${index}`}><span>{spin}</span></div>) : <p className="login-calendar-muted">No spins yet.</p>}
                </div>
              </div>
              <div className="login-wheel-odds">
                <h3>Prize odds</h3>
                {FORGE_WHEEL_PRIZES.map((prize, index) => (
                  <div className={`login-calendar-next login-wheel-prize-row${!wheelSpinning && wheelResult?.prize.id === prize.id ? ' is-winner' : ''}`} key={prize.id}>
                    <span><b className="login-wheel-prize-number" style={{ backgroundColor: prize.color, borderColor: prize.color, color: '#ffffff' }}>{index + 1}</b><img src={wheelPrizeIcon(prize)} alt="" /><strong>{prize.label}</strong></span>
                    <em>{(prize.weight / FORGE_WHEEL_TOTAL_WEIGHT * 100).toFixed(1)}%</em>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="login-wheel-locked">
              <div className="login-wheel-lock-symbol"><GameEmblem id="transcendence-shard" size={116} /></div>
              <h2>The wheel is sealed</h2>
              <p>Open the Forge of Transcendence to begin accruing free daily spins.</p>
              <button type="button" className="login-calendar-claim is-wheel" onClick={() => { onClose(); onOpenForge(); }}>Open the Forge</button>
            </section>
          )
        )}
      </main>

      <footer className="login-calendar-footer">
        <span className="login-calendar-autosave"><i />Autosave active</span>
        {activeTab === 'calendar' && (
          <div className="login-calendar-footer-status">
            <small>{canClaim ? `Next unclaimed reward · Day ${pendingDay}` : `Next reset in ${nextResetCountdown}`}</small>
            <strong>{pendingReward?.label ?? "Today's reward is already claimed."}</strong>
          </div>
        )}
        <button type="button" className="login-calendar-close" onClick={onClose}>Close calendar</button>
        {activeTab === 'calendar' && (
          <button type="button" className="login-calendar-claim" disabled={!canClaim} onClick={handleClaim}>{canClaim ? `Claim Day ${pendingDay}` : 'Claimed'}</button>
        )}
      </footer>
    </div>
  );
}