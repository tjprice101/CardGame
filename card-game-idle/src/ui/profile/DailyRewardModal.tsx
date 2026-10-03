import { useEffect, useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
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

export default function DailyRewardModal({ onClose, onOpenForge }: Props) {
  const progress = useStore(selectProgress);
  const claimDailyReward = useStore(state => state.claimDailyReward);
  const claimDailyStreakMilestone = useStore(state => state.claimDailyStreakMilestone);
  const spinForgeWheel = useStore(state => state.spinForgeWheel);
  const forgeUnlocked = progress.forgeOfTranscendenceUnlocked === true;

  const [nowTick, setNowTick] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<CalendarTab>('calendar');
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelResult, setWheelResult] = useState<{ prize: WheelPrize; amount: number } | null>(null);
  const [recentSpins, setRecentSpins] = useState<string[]>([]);

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
    if (reward.kind === 'shards') return `${import.meta.env.BASE_URL}assets/resource-icons/aberrated-shards.png`;
    if (reward.kind === 'divine_light') return `${import.meta.env.BASE_URL}assets/resource-icons/divine-light.png`;
    if (reward.kind === 'transcendent_shards') return `${import.meta.env.BASE_URL}assets/forge/shards-of-transcendence.png`;
    return `${import.meta.env.BASE_URL}assets/resource-icons/card-light-shards.png`;
  };

  const wheelPrizeIcon = (prize: WheelPrize) => {
    if (prize.kind === 'aberrated_shards') return `${import.meta.env.BASE_URL}assets/resource-icons/aberrated-shards.png`;
    if (prize.kind === 'card_light_all') return `${import.meta.env.BASE_URL}assets/resource-icons/card-light-shards.png`;
    if (prize.kind === 'shards_of_transcendence') return `${import.meta.env.BASE_URL}assets/forge/shards-of-transcendence.png`;
    return `${import.meta.env.BASE_URL}assets/resource-icons/divine-light.png`;
  };

  function handleClaim() {
    const result = claimDailyReward();
    if (result) onClose();
  }

  function handleWheelSpin() {
    const result = spinForgeWheel();
    if (!result) return;
    setWheelResult(result);
    const segment = WHEEL_SEGMENTS.find(item => item.prize.id === result.prize.id);
    if (segment) {
      setWheelRotation(previous => {
        const current = ((previous % 360) + 360) % 360;
        const target = ((-90 - segment.middleAngle - current) % 360 + 360) % 360;
        return previous + 360 * 5 + target;
      });
    }
    const label = result.prize.kind === 'divine_light'
      ? `+${result.amount.toLocaleString()} Divine Light`
      : result.prize.label;
    setRecentSpins(previous => [label, ...previous].slice(0, 5));
  }

  const selectedIcon = rewardIcon(selectedReward);
  const upcomingSpecials = track
    .filter(entry => entry.day > today && entry.reward.kind !== 'shards')
    .slice(0, 4);

  return (
    <div className="login-calendar-screen" style={{
      ['--ui-accent' as string]: '201, 164, 92',
      ['--ui-accent-soft' as string]: '235, 217, 143',
    } as React.CSSProperties}>
      <header className="login-calendar-header">
        <div className="login-calendar-heading">
          <div className="login-calendar-eyebrow">Monthly expedition</div>
          <h1>Login calendar</h1>
          <p>One reward per local day. Missed calendar days do not queue.</p>
        </div>
        <div className="login-calendar-header-stats">
          <div className="login-calendar-wallet" aria-label="Current balances">
            <span title="Aberrated Shards"><img src={`${import.meta.env.BASE_URL}assets/resource-icons/aberrated-shards.png`} alt="" />{progress.aberratedShards.toLocaleString()}</span>
            <span title="Shards of Transcendence" className="is-violet"><img src={`${import.meta.env.BASE_URL}assets/forge/shards-of-transcendence.png`} alt="" />{(progress.shardsOfTranscendence ?? 0).toLocaleString()}</span>
            <span title="Divine Light" className="is-gold"><img src={`${import.meta.env.BASE_URL}assets/resource-icons/divine-light.png`} alt="" />{Math.floor(progress.divineLight).toLocaleString()}</span>
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
              <div className="login-calendar-legend">
                <span><i className="is-shard" />Aberrated Shards</span>
                <span><i className="is-light" />Card-light</span>
                <span><i className="is-dl" />Divine Light</span>
                <span><i className="is-trans" />Shards of Transcendence</span>
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
                      <img className="login-streak-icon" src={milestone.kind === 'aberrated_shards' ? `${import.meta.env.BASE_URL}assets/resource-icons/aberrated-shards.png` : `${import.meta.env.BASE_URL}assets/forge/shards-of-transcendence.png`} alt="" />
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
            <section className="login-wheel-view">
              <div className="login-wheel-stage">
                <div className="login-wheel-pointer" />
                <svg className="login-wheel-svg" viewBox="0 0 224 224" role="img" aria-label="Wheel of Transcendence prize wheel">
                  <circle cx="112" cy="112" r="108" fill="#100d19" stroke="#c9a45c" strokeWidth="2" />
                  <g className="login-wheel-rotor" style={{ transform: `rotate(${wheelRotation}deg)` }}>
                    {WHEEL_SEGMENTS.map(segment => {
                      const labelPosition = polarPoint(segment.middleAngle, 75);
                      return (
                        <g key={segment.prize.id}>
                          <path d={wheelSegmentPath(segment.startAngle, segment.endAngle)} fill={segment.prize.color} stroke="#c9a45c" strokeWidth="0.8" />
                          <text x={labelPosition[0]} y={labelPosition[1]} fill="#fff1c9" stroke="rgba(16,12,24,0.85)" strokeWidth="1.4" paintOrder="stroke" textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700">
                            {segment.index}
                          </text>
                        </g>
                      );
                    })}
                    <circle cx="112" cy="112" r="88" fill="none" stroke="rgba(248,232,199,0.42)" strokeWidth="0.7" />
                  </g>
                  <circle cx="112" cy="112" r="16" fill="#0d0a15" stroke="#c9a45c" strokeWidth="2" />
                  <path d="m112 103 8 9-8 9-8-9 8-9Z" fill="none" stroke="#f3d98f" strokeWidth="1.4" />
                  <circle cx="112" cy="112" r="2" fill="#72d9c6" />
                </svg>
              </div>
              <div className="login-wheel-controls">
                <div className="login-calendar-eyebrow">Wheel of Transcendence</div>
                <div className="login-wheel-spin-count">{spinsAvailable} <span>free {spinsAvailable === 1 ? 'spin' : 'spins'} available</span></div>
                <p>One free spin accrues each local day while the Forge is open. Spins accumulate when you are away.</p>
                {wheelResult && <div className="login-wheel-result" role="status">{wheelResult.prize.kind === 'divine_light' ? `+${wheelResult.amount.toLocaleString()} Divine Light` : wheelResult.prize.label}</div>}
                <button type="button" className="login-calendar-claim is-wheel" disabled={spinsAvailable < 1} onClick={handleWheelSpin}>Spin the wheel</button>
                <div className="login-wheel-history">
                  <h3>Recent spins</h3>
                  {recentSpins.length ? recentSpins.map((spin, index) => <div className="login-calendar-next" key={`${spin}-${index}`}><span>{spin}</span></div>) : <p className="login-calendar-muted">No spins yet.</p>}
                </div>
              </div>
              <div className="login-wheel-odds">
                <h3>Prize odds</h3>
                {FORGE_WHEEL_PRIZES.map((prize, index) => (
                  <div className="login-calendar-next login-wheel-prize-row" key={prize.id}>
                    <span><b className="login-wheel-prize-number">{index + 1}</b><img src={wheelPrizeIcon(prize)} alt="" /><strong>{prize.label}</strong></span>
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