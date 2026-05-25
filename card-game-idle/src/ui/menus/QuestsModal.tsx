import { useMemo } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import {
  refreshQuestRotation,
  isQuestComplete,
  type QuestInstance,
} from '@/systems/progression/quests';
import { getUtcDayIndex } from '@/systems/progression/dailyLogin';

interface Props {
  onClose: () => void;
}

/**
 * Daily + Weekly quest board. Quests rotate on UTC day/week boundaries.
 * Display read-models always run through `refreshQuestRotation` so the
 * UI never shows stale templates even if the user hasn't played a card
 * since rollover.
 */
export default function QuestsModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const claimQuest = useStore(s => s.claimQuest);

  const view = useMemo(() => {
    const today = getUtcDayIndex(Date.now());
    // Pure copy — does not mutate store.
    const snapshot = {
      daily: progress.quests.daily.map(q => ({ ...q })),
      weekly: progress.quests.weekly.map(q => ({ ...q })),
      lastDailyRollDay: progress.quests.lastDailyRollDay,
      lastWeeklyRollWeek: progress.quests.lastWeeklyRollWeek,
    };
    return refreshQuestRotation(snapshot, today);
  }, [progress.quests]);

  return (
    <Backdrop onClose={onClose}>
      <Panel>
        <Header title="Quests" onClose={onClose} />
        <SectionLabel>Daily</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {view.daily.map(q => (
            <QuestRow key={q.id} quest={q} onClaim={() => claimQuest(q.id)} />
          ))}
          {view.daily.length === 0 && <Empty>No daily quests.</Empty>}
        </div>
        <SectionLabel>Weekly</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {view.weekly.map(q => (
            <QuestRow key={q.id} quest={q} onClaim={() => claimQuest(q.id)} />
          ))}
          {view.weekly.length === 0 && <Empty>No weekly quests.</Empty>}
        </div>
      </Panel>
    </Backdrop>
  );
}

function QuestRow({ quest, onClaim }: { quest: QuestInstance; onClaim: () => void }) {
  const complete = isQuestComplete(quest);
  const pct = Math.min(100, Math.round((quest.progress / Math.max(1, quest.goal)) * 100));
  return (
    <div style={{
      padding: '10px 12px',
      background: quest.claimed ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.04)',
      border: `1px solid ${warmTheme.border}`,
      borderRadius: 10,
      opacity: quest.claimed ? 0.55 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', color: warmTheme.text }}>{quest.text}</div>
        <div style={{ fontSize: 11, color: warmTheme.accent, fontWeight: 'bold' }}>
          +{quest.shardReward} shards
        </div>
      </div>
      <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.12)', overflow: 'hidden', marginBottom: 6 }}>
        <div style={{
          position: 'absolute', inset: 0, width: `${pct}%`,
          background: complete ? warmTheme.accent : warmTheme.accentSoft,
          transition: 'width 200ms ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: warmTheme.textMuted }}>
          {Math.min(quest.progress, quest.goal).toLocaleString()} / {quest.goal.toLocaleString()}
        </div>
        <button
          onClick={onClaim}
          disabled={!complete || quest.claimed}
          style={{
            background: complete && !quest.claimed ? warmTheme.accent : 'rgba(0,0,0,0.06)',
            color: complete && !quest.claimed ? '#fff' : warmTheme.textMuted,
            border: `1px solid ${warmTheme.border}`,
            borderRadius: 6,
            padding: '3px 10px',
            fontFamily: 'Georgia, serif',
            fontSize: 11,
            cursor: complete && !quest.claimed ? 'pointer' : 'not-allowed',
          }}
        >
          {quest.claimed ? 'Claimed' : complete ? 'Claim' : 'In Progress'}
        </button>
      </div>
    </div>
  );
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(circle at 50% 14%, rgba(201, 170, 112, 0.2) 0%, rgba(201, 170, 112, 0) 36%), linear-gradient(180deg, rgba(16, 18, 23, 0.965) 0%, rgba(19, 24, 31, 0.965) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, pointerEvents: 'auto', fontFamily: 'Georgia, serif',
    }}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="ui-panel-intro" style={{
      background: warmTheme.surfaceStrong,
      border: `1px solid ${warmTheme.borderStrong}`,
      borderRadius: 16,
      padding: '20px 24px',
      width: 440,
      maxHeight: '88vh',
      overflowY: 'auto',
      boxShadow: warmTheme.shadow,
      position: 'relative',
      ['--ui-accent' as any]: '230, 196, 132',
      ['--ui-accent-soft' as any]: '250, 224, 184',
    } as React.CSSProperties}>{children}</div>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="ui-shimmer-band" style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 14, borderBottom: `1px solid ${warmTheme.border}`, paddingBottom: 10,
      position: 'relative',
    }}>
      <div className="ui-title-glow" style={{ fontSize: 18, fontWeight: 'bold', color: warmTheme.accentDeep, letterSpacing: 2 }}>{title}</div>
      <button onClick={onClose} style={{
        background: 'transparent', border: 'none', color: warmTheme.textMuted,
        fontSize: 18, cursor: 'pointer', padding: '0 4px',
      }}>X</button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
      color: warmTheme.textMuted, marginBottom: 6, fontWeight: 'bold',
    }}>{children}</div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: warmTheme.textMuted, fontStyle: 'italic', padding: '8px 0' }}>{children}</div>;
}
