import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useStore, selectProgress } from '@/state/store';
import {
  formatQuestCountdown, getNextDailyResetAt, getNextWeeklyResetAt,
  getCollectionPowerMultiplier, getScaledQuestDivineLight, refreshQuestRotation,
  isQuestComplete, isSuperWeeklyReady, type QuestInstance, type QuestKind,
} from '@/systems/progression/quests';
import { computeGlobalResonanceScore } from '@/systems/progression/cardMastery';
import { uiTypography, warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import './QuestsModal.css';

interface Props { onClose: () => void; }
type Cadence = 'daily' | 'weekly';
type LedgerTab = Cadence | 'super';

const KIND_PRESENTATION: Record<QuestKind, { label: string; icon: string }> = {
  play_cards: { label: 'Play cards', icon: '▤' },
  play_light: { label: 'Play Light', icon: '✦' },
  play_dark: { label: 'Play Dark', icon: '◐' },
  summon_ain_soph_aur: { label: 'Summon Ain Soph Aur', icon: '✧' },
  flip_soph: { label: 'Flip Soph', icon: '◑' },
  activate_ain_attack: { label: 'Ain Attack', icon: '◉' },
  activate_soph_attack: { label: 'Soph Attack', icon: '◌' },
  activate_dark: { label: 'Dark activation', icon: '◐' },
  bridge_ain_soph_aur: { label: 'Bridge attack', icon: '✧' },
  spend_light_stacks: { label: 'Spend Light Stacks', icon: '✧' },
  earn_divine_light_in_turn: { label: 'Earn Divine Light', icon: '✦' },
  open_packs: { label: 'Open packs', icon: '▤' },
  win_boss: { label: 'Defeat bosses', icon: '⚔' },
  clear_null_raid: { label: 'Clear Null Raid', icon: '◇' },
};

function ResetTimer({ cadence, now }: { cadence: Cadence; now: number }) {
  const resetAt = cadence === 'daily' ? getNextDailyResetAt(now) : getNextWeeklyResetAt(now);
  return <span className="trials-reset">Next reset <b>{formatQuestCountdown(resetAt - now)}</b></span>;
}

function RotationSummary({ cadence, quests, now }: { cadence: Cadence; quests: QuestInstance[]; now: number }) {
  const completed = quests.filter(isQuestComplete).length;
  const ready = quests.filter(q => isQuestComplete(q) && !q.claimed).length;
  return <div className="trials-rotation-summary">
    <div className="trials-ring" style={{ '--ring-progress': `${quests.length ? completed / quests.length * 100 : 0}%` } as CSSProperties}>
      <b>{completed}/{quests.length}</b>
    </div>
    <div><small>{cadence}</small><strong>{ready} ready to claim</strong><ResetTimer cadence={cadence} now={now} /></div>
  </div>;
}

function QuestCard({ quest, resonanceScore, onClaim }: { quest: QuestInstance; resonanceScore: number; onClaim: () => void }) {
  const complete = isQuestComplete(quest);
  const claimable = complete && !quest.claimed;
  const displayedProgress = Math.max(0, Math.min(quest.progress, quest.goal));
  const progressPct = Math.min(100, displayedProgress / Math.max(1, quest.goal) * 100);
  const presentation = KIND_PRESENTATION[quest.kind];
  return <article className={`trials-card${quest.claimed ? ' is-claimed' : claimable ? ' is-ready' : ''}`} data-quest-id={quest.id}>
    <div className="trials-emblem" aria-hidden="true">{quest.claimed ? '✓' : presentation.icon}</div>
    <div className="trials-card-body">
      <small>{presentation.label}</small>
      <h3>{quest.text}</h3>
      <div className="trials-progress" role="progressbar" aria-label={quest.text} aria-valuemin={0} aria-valuemax={quest.goal} aria-valuenow={displayedProgress}>
        <i style={{ width: `${progressPct}%` }} />
      </div>
      <div className="trials-rewards">
        {!!quest.divineLightReward && <span className="trials-reward">+{getScaledQuestDivineLight(quest.divineLightReward, resonanceScore).toLocaleString()} Divine Light</span>}
        {!!quest.shardReward && <span className="trials-reward">+{quest.shardReward.toLocaleString()} Aberrated Shards</span>}
        {!!quest.divineLightReward && <span className="trials-base">{quest.divineLightReward.toLocaleString()} base × {getCollectionPowerMultiplier(resonanceScore).toFixed(2)} Collection Power</span>}
      </div>
    </div>
    <div className="trials-card-action">
      <div className="trials-count">{displayedProgress.toLocaleString()}<span>/{quest.goal.toLocaleString()}</span></div>
      <button className={`trials-button${claimable ? ' is-primary' : ''}`} onClick={onClaim} disabled={!claimable}>
        {quest.claimed ? 'Claimed' : claimable ? 'Claim Reward' : 'In progress'}
      </button>
    </div>
  </article>;
}

export default function QuestsModal({ onClose }: Props) {
  useThemeVersion();
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<LedgerTab>('daily');
  const progress = useStore(selectProgress);
  const claimQuest = useStore(s => s.claimQuest);
  const activateSuperWeekly = useStore(s => s.activateSuperWeekly);
  const resonanceScore = computeGlobalResonanceScore(progress);
  const view = useMemo(() => refreshQuestRotation({
    daily: progress.quests.daily.map(q => ({ ...q })), weekly: progress.quests.weekly.map(q => ({ ...q })),
    lastDailyRollDay: progress.quests.lastDailyRollDay, lastWeeklyRollWeek: progress.quests.lastWeeklyRollWeek,
    superWeekly: progress.quests.superWeekly ? { ...progress.quests.superWeekly } : undefined,
    superWeeklies: progress.quests.superWeeklies?.map(challenge => ({ ...challenge })),
  }, now), [progress.quests, now]);
  const readyQuests = [...view.daily, ...view.weekly].filter(q => isQuestComplete(q) && !q.claimed);
  const readyLight = readyQuests.reduce((sum, q) => sum + getScaledQuestDivineLight(q.divineLightReward ?? 0, resonanceScore), 0);
  const readyShards = readyQuests.reduce((sum, q) => sum + q.shardReward, 0);
  const superWeeklies = view.superWeeklies ?? (view.superWeekly ? [view.superWeekly] : []);
  const superReady = isSuperWeeklyReady(view);
  const consumed = superWeeklies.some(challenge => challenge.active || challenge.completed);
  const superCompleted = superWeeklies.length > 0 && superWeeklies.every(challenge => challenge.completed);
  const weeklyCompleted = view.weekly.filter(isQuestComplete).length;
  const weeklyClaimed = view.weekly.filter(q => q.claimed).length;
  const steps = [
    { label: 'Complete every weekly', text: `${weeklyCompleted} / ${view.weekly.length} complete`, done: view.weekly.length > 0 && weeklyCompleted === view.weekly.length },
    { label: 'Claim every reward', text: `${weeklyClaimed} / ${view.weekly.length} claimed`, done: view.weekly.length > 0 && weeklyClaimed === view.weekly.length },
    { label: 'Consume the rotation', text: consumed ? 'Rotation consumed' : 'Unlocks both bosses', done: consumed },
  ];
  const styles = {
    '--trials-bg': warmTheme.appBackground, '--trials-surface': warmTheme.surface,
    '--trials-strong': warmTheme.surfaceStrong, '--trials-muted': warmTheme.surfaceMuted,
    '--trials-text': warmTheme.text, '--trials-secondary': warmTheme.textMuted,
    '--trials-accent': warmTheme.accent, '--trials-accent-soft': warmTheme.accentSoft,
    '--trials-border': warmTheme.border, '--trials-border-strong': warmTheme.borderStrong,
    '--trials-success': warmTheme.success, '--trials-font': uiTypography.body,
    '--trials-display': uiTypography.display,
    '--trials-banner': `url("${import.meta.env.BASE_URL}assets/menu-banners/challenges.png")`,
  } as CSSProperties;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <div onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="trials-title" className="ui-panel-intro trials-ledger" style={styles}>
    <div className="trials-layout" onClick={event => event.stopPropagation()}>
      <header className="ui-artwork-header trials-header">
        <div data-ui-artwork-copy>
          <small>✦ DAILY &amp; WEEKLY OBJECTIVES</small>
          <h1 id="trials-title">Challenges</h1>
          <p>A rotating ledger of trials. Complete objectives to earn Divine Light and Aberrated Shards.</p>
        </div>
        <button className="trials-close" onClick={onClose} aria-label="Close Challenges">✕</button>
      </header>
      <section className="trials-summary" aria-label="Challenge rotation summary">
        <RotationSummary cadence="daily" quests={view.daily} now={now} />
        <RotationSummary cadence="weekly" quests={view.weekly} now={now} />
        <div className="trials-totals"><small>Ready to claim</small><strong>+{readyLight.toLocaleString()} Divine Light</strong><span>+{readyShards.toLocaleString()} Aberrated Shards</span><span>Collection Power <b>×{getCollectionPowerMultiplier(resonanceScore).toFixed(2)}</b></span></div>
        <button className="trials-button is-primary trials-claim-all" disabled={!readyQuests.length} onClick={() => readyQuests.forEach(q => claimQuest(q.id))}>Claim All{readyQuests.length > 0 ? ` (${readyQuests.length})` : ''}</button>
      </section>
      <nav className="trials-tabs" aria-label="Challenge categories">
        {(['daily', 'weekly', 'super'] as const).map(cadence => {
          const quests = cadence === 'super' ? [] : view[cadence];
          const ready = quests.filter(q => isQuestComplete(q) && !q.claimed).length;
          return <button key={cadence} className={`trials-tab${tab === cadence ? ' is-active' : ''}`} aria-pressed={tab === cadence} aria-controls="trials-content" onClick={() => setTab(cadence)}>
            <strong className={tab === cadence ? 'ui-button-title' : undefined} style={{ font: 'inherit' }}>{cadence === 'super' ? 'Super Weekly' : cadence === 'daily' ? 'Daily' : 'Weekly'}</strong>
            <span className={ready || (cadence === 'super' && superReady) ? 'is-ready' : ''}>{cadence === 'super' ? superCompleted ? 'Completed' : consumed ? 'Active' : superReady ? 'Ready' : 'Locked' : ready ? `${ready} ready` : `${quests.filter(isQuestComplete).length}/${quests.length}`}</span>
          </button>;
        })}
      </nav>
      <main id="trials-content" className="trials-content ornate-scroll" key={tab}>
        {tab !== 'super' ? <section aria-label={tab === 'daily' ? 'Daily Challenges' : 'Weekly Challenges'}>
          <div className="trials-section-heading"><h2>{tab === 'daily' ? 'Daily Challenges' : 'Weekly Challenges'}</h2><ResetTimer cadence={tab} now={now} /></div>
          <div className="trials-grid">{view[tab].map(quest => <QuestCard key={quest.id} quest={quest} resonanceScore={resonanceScore} onClaim={() => claimQuest(quest.id)} />)}</div>
          {view[tab].length === 0 && <p className="trials-empty">No challenges available right now.</p>}
        </section> : <section className="trials-super">
          <small>SUPER WEEKLY CHALLENGE</small><h2>Two Boss Objectives</h2>
          <p>Complete and claim every weekly challenge, then consume the rotation to unlock two high-stakes Eternity&apos;s Wake boss objectives.</p>
          <div className="trials-steps">{steps.map((step, index) => <div key={step.label} className={`trials-step${step.done ? ' is-complete' : ''}`}><i aria-hidden="true">{step.done ? '✓' : index + 1}</i><div><strong>{step.label}</strong><span>{step.text}</span></div></div>)}</div>
          <div className="trials-bosses">{superWeeklies.map(challenge => {
            const boss = BOSS_DEFINITIONS.find(entry => entry.id === challenge.bossId);
            return <article className="trials-boss" key={challenge.bossId}><div className="trials-emblem" aria-hidden="true">{challenge.completed ? '✓' : challenge.active ? '⚔' : '◇'}</div><div><h3>{boss?.name ?? challenge.bossId}</h3><p>{challenge.completed ? 'Completed' : challenge.active ? "Active · Challenge this boss in Eternity's Wake" : 'Locked · Consume this weekly rotation to unlock'}</p></div></article>;
          })}</div>
          <div className="trials-super-action"><strong>{superCompleted ? 'COMPLETED' : consumed ? 'ACTIVE · CHALLENGE THE BOSSES' : superReady ? 'READY TO ACTIVATE' : 'CLAIM ALL WEEKLY REWARDS FIRST'}</strong>
            {superWeeklies.length > 0 && !consumed && <button className="trials-button is-primary" onClick={() => activateSuperWeekly()} disabled={!superReady}>Consume Weekly Challenges</button>}
          </div>
        </section>}
      </main>
      <footer className="trials-footer"><span>Daily rotation · Weekly rotation · Collection Power scales Divine Light rewards</span><span>Base rewards: ~60,000 daily per seven days · 100,000 weekly</span></footer>
    </div>
  </div>;
}
