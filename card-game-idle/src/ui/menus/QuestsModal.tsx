import { useMemo } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { refreshQuestRotation, isQuestComplete, type QuestInstance } from '@/systems/progression/quests';

interface Props { onClose: () => void; }

function QuestCard({ quest, onClaim }: { quest: QuestInstance; onClaim: () => void }) {
  const complete = isQuestComplete(quest);
  return <div style={{ padding: 16, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{quest.text}</strong><span>{quest.progress}/{quest.goal}</span></div>
    <div style={{ marginTop: 6, opacity: 0.75 }}>{quest.kind.replaceAll('_', ' ')}</div>
    <button onClick={onClaim} disabled={!complete || quest.claimed} style={{ marginTop: 12 }}>{quest.claimed ? 'Claimed' : complete ? 'Claim' : 'In progress'}</button>
  </div>;
}

export default function QuestsModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const claimQuest = useStore(s => s.claimQuest);
  const view = useMemo(() => refreshQuestRotation({
    daily: progress.quests.daily.map(q => ({ ...q })),
    weekly: progress.quests.weekly.map(q => ({ ...q })),
    lastDailyRollDay: progress.quests.lastDailyRollDay,
    lastWeeklyRollWeek: progress.quests.lastWeeklyRollWeek,
  }, Date.now()), [progress.quests]);
  return <div onClick={onClose} role="dialog" aria-modal="true" style={{ position: 'absolute', inset: 0, zIndex: 50, overflowY: 'auto', padding: 28, background: 'rgba(12,16,28,0.98)', color: '#f4f0e8', fontFamily: 'Georgia, serif' }}>
    <div onClick={event => event.stopPropagation()} style={{ maxWidth: 1000, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 16, marginBottom: 18 }}>
        <div><div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.65 }}>DAILY & WEEKLY OBJECTIVES</div><h1 style={{ margin: '6px 0', fontSize: 32 }}>Challenges</h1><div style={{ opacity: 0.72 }}>Complete daily and weekly challenges for rewards.</div></div>
        <button onClick={onClose} aria-label="Close Challenges">Close</button>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        <section><h2>Daily Challenges</h2><div style={{ display: 'grid', gap: 10 }}>{view.daily.map(quest => <QuestCard key={quest.id} quest={quest} onClaim={() => claimQuest(quest.id)} />)}</div></section>
        <section><h2>Weekly Challenges</h2><div style={{ display: 'grid', gap: 10 }}>{view.weekly.map(quest => <QuestCard key={quest.id} quest={quest} onClaim={() => claimQuest(quest.id)} />)}</div></section>
      </div>
    </div>
  </div>;
}
