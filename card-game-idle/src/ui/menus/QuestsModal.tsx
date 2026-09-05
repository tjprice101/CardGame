import { useMemo } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { refreshQuestRotation, isQuestComplete, type QuestInstance } from '@/systems/progression/quests';
import { uiTypography } from '@/ui/theme';

interface Props { onClose: () => void; }
type Cadence = 'daily' | 'weekly';

const CADENCE_THEME: Record<Cadence, {
  label: string; tag: string; accent: string; accentSoft: string; glow: string;
  chipBg: string; chipBorder: string; fillFrom: string; fillTo: string;
  cardTop: string; cardBottom: string; border: string; borderActive: string; headerTint: string;
}> = {
  daily: {
    label: 'Daily Challenges', tag: 'RESETS EACH DAY', accent: '#f0a24a', accentSoft: '#ffd18a',
    glow: 'rgba(240,162,74,0.32)', chipBg: 'rgba(240,162,74,0.12)', chipBorder: 'rgba(255,209,138,0.55)',
    fillFrom: '#f0a24a', fillTo: '#ffd88f', cardTop: 'rgba(58,32,18,0.90)', cardBottom: 'rgba(30,18,10,0.94)',
    border: 'rgba(240,162,74,0.32)', borderActive: 'rgba(255,209,138,0.75)',
    headerTint: 'radial-gradient(ellipse 55% 40% at 20% 0%, rgba(240,162,74,0.22) 0%, transparent 60%)',
  },
  weekly: {
    label: 'Weekly Challenges', tag: 'RESETS EACH WEEK', accent: '#7cb0f0', accentSoft: '#b0d1ff',
    glow: 'rgba(124,176,240,0.32)', chipBg: 'rgba(124,176,240,0.12)', chipBorder: 'rgba(176,209,255,0.55)',
    fillFrom: '#7cb0f0', fillTo: '#c4dcff', cardTop: 'rgba(24,36,60,0.90)', cardBottom: 'rgba(14,22,40,0.94)',
    border: 'rgba(124,176,240,0.32)', borderActive: 'rgba(176,209,255,0.75)',
    headerTint: 'radial-gradient(ellipse 55% 40% at 80% 0%, rgba(124,176,240,0.22) 0%, transparent 60%)',
  },
};

const KIND_LABEL: Record<string, string> = {
  play_cards: 'Play cards', play_ophanim: 'Play Ophanim', play_seraphim: 'Place Seraphim',
  play_cherubim: 'Place Cherubim', open_packs: 'Open packs', win_boss: 'Defeat bosses',
};

function QuestCard({ quest, cadence, onClaim }: { quest: QuestInstance; cadence: Cadence; onClaim: () => void }) {
  const theme = CADENCE_THEME[cadence];
  const complete = isQuestComplete(quest);
  const progressPct = Math.min(100, Math.round((quest.progress / Math.max(1, quest.goal)) * 100));
  const claimable = complete && !quest.claimed;
  const rewardText = quest.oblivionReward
    ? `+${quest.oblivionReward.toLocaleString()} Oblivion`
    : quest.shardReward ? `+${quest.shardReward} Aberrated Shards` : 'Reward';

  return (
    <div style={{
      position: 'relative', padding: '16px 18px 18px', borderRadius: 14,
      border: `1px solid ${claimable ? theme.borderActive : theme.border}`,
      background: `linear-gradient(155deg, ${theme.cardTop} 0%, ${theme.cardBottom} 100%)`,
      boxShadow: claimable ? `0 0 0 1px ${theme.glow}, 0 12px 26px rgba(0,0,0,0.55)` : '0 8px 20px rgba(0,0,0,0.45)',
      overflow: 'hidden',
    }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 90% -10%, ${theme.glow}, transparent 55%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: theme.accentSoft, fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase' }}>
            {KIND_LABEL[quest.kind] ?? quest.kind.replaceAll('_', ' ')}
          </div>
          <div style={{ color: '#f8f0e2', fontFamily: uiTypography.display, fontSize: 18, marginTop: 3, lineHeight: 1.2 }}>{quest.text}</div>
        </div>
        <div style={{ color: theme.accentSoft, fontFamily: uiTypography.display, fontSize: 20, whiteSpace: 'nowrap', textShadow: `0 0 12px ${theme.glow}` }}>
          {quest.progress}<span style={{ color: 'rgba(240,230,210,0.45)', fontSize: 15 }}>/{quest.goal}</span>
        </div>
      </div>
      <div style={{ position: 'relative', marginTop: 14, height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ width: `${progressPct}%`, height: '100%', background: `linear-gradient(90deg, ${theme.fillFrom}, ${theme.fillTo})`, boxShadow: claimable ? `0 0 12px ${theme.glow}` : 'none', transition: 'width 0.35s ease' }} />
      </div>
      <div style={{ position: 'relative', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, color: theme.accentSoft, background: theme.chipBg, border: `1px solid ${theme.chipBorder}` }}>{rewardText}</span>
        <button onClick={onClaim} disabled={!claimable} style={{
          fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', padding: '7px 16px', borderRadius: 8, cursor: claimable ? 'pointer' : 'default',
          color: quest.claimed ? 'rgba(240,230,210,0.55)' : claimable ? '#12070a' : 'rgba(240,230,210,0.72)',
          background: quest.claimed ? 'rgba(255,255,255,0.06)' : claimable ? `linear-gradient(180deg, ${theme.accentSoft} 0%, ${theme.accent} 100%)` : 'rgba(255,255,255,0.05)',
          border: `1px solid ${quest.claimed ? 'rgba(255,255,255,0.14)' : claimable ? theme.borderActive : 'rgba(255,255,255,0.12)'}`,
          boxShadow: claimable ? `0 6px 16px ${theme.glow}` : 'none',
        }}>{quest.claimed ? 'Claimed' : claimable ? 'Claim Reward' : 'In progress'}</button>
      </div>
    </div>
  );
}

function ChallengeColumn({ cadence, quests, onClaim }: { cadence: Cadence; quests: QuestInstance[]; onClaim: (id: string) => void }) {
  const theme = CADENCE_THEME[cadence];
  const completedCount = quests.filter(q => isQuestComplete(q)).length;
  return (
    <section style={{ position: 'relative', padding: '20px 20px 24px', borderRadius: 18, border: `1px solid ${theme.border}`, background: `${theme.headerTint}, linear-gradient(180deg, rgba(10,12,22,0.65) 0%, rgba(8,10,18,0.55) 100%)` }}>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div><div style={{ color: theme.accentSoft, fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 2.8, textTransform: 'uppercase' }}>{theme.tag}</div><h2 style={{ margin: '4px 0 0', color: '#fff2dc', fontFamily: uiTypography.display, fontSize: 22, letterSpacing: 1, textShadow: `0 0 14px ${theme.glow}` }}>{theme.label}</h2></div>
        <div style={{ color: theme.accentSoft, fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 2 }}>{completedCount}/{quests.length} READY</div>
      </header>
      <div style={{ display: 'grid', gap: 12 }}>{quests.length === 0 ? <div style={{ color: 'rgba(240,230,210,0.55)', fontStyle: 'italic', padding: '18px 4px' }}>No challenges available right now.</div> : quests.map(quest => <QuestCard key={quest.id} quest={quest} cadence={cadence} onClaim={() => onClaim(quest.id)} />)}</div>
    </section>
  );
}

export default function QuestsModal({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const claimQuest = useStore(s => s.claimQuest);
  const view = useMemo(() => refreshQuestRotation({
    daily: progress.quests.daily.map(q => ({ ...q })), weekly: progress.quests.weekly.map(q => ({ ...q })),
    lastDailyRollDay: progress.quests.lastDailyRollDay, lastWeeklyRollWeek: progress.quests.lastWeeklyRollWeek,
  }, Date.now()), [progress.quests]);
  const readyCount = [...view.daily, ...view.weekly].filter(q => isQuestComplete(q) && !q.claimed).length;

  return (
    <div onClick={onClose} role="dialog" aria-modal="true" className="ui-panel-intro" style={{ position: 'absolute', inset: 0, zIndex: 50, overflowY: 'auto', padding: '32px 28px 60px', background: 'radial-gradient(circle at 20% -10%, rgba(240,162,74,0.14), transparent 45%), radial-gradient(circle at 80% -10%, rgba(124,176,240,0.14), transparent 45%), linear-gradient(180deg, #10121e 0%, #0a0c14 100%)', color: '#f8f0de', fontFamily: uiTypography.body }}>
      <div onClick={event => event.stopPropagation()} style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(240,209,138,0.28)', paddingBottom: 20, marginBottom: 24 }}>
          <div>
            <div style={{ color: '#f0a24a', fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 3 }}>✦ DAILY & WEEKLY OBJECTIVES</div>
            <h1 style={{ margin: '8px 0 4px', color: '#fff0d1', fontFamily: uiTypography.display, fontSize: 34, letterSpacing: 1.5 }}>Challenges</h1>
            <div style={{ color: 'rgba(240,230,210,0.72)', fontSize: 13 }}>Complete daily and weekly challenges for Oblivion and Aberrated Shards.</div>
            {readyCount > 0 && <div style={{ display: 'inline-block', marginTop: 12, padding: '5px 12px', borderRadius: 999, fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 1.6, color: '#12070a', background: 'linear-gradient(180deg, #ffd88f 0%, #f0a24a 100%)', border: '1px solid rgba(255,209,138,0.7)', boxShadow: '0 6px 14px rgba(240,162,74,0.35)' }}>{readyCount} REWARD{readyCount === 1 ? '' : 'S'} READY</div>}
          </div>
          <button onClick={onClose} aria-label="Close Challenges" style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(240,209,138,0.4)', background: 'rgba(240,162,74,0.08)', color: '#f8f0de', fontSize: 18, cursor: 'pointer', fontFamily: uiTypography.display }}>✕</button>
        </header>
        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          <ChallengeColumn cadence="daily" quests={view.daily} onClaim={claimQuest} />
          <ChallengeColumn cadence="weekly" quests={view.weekly} onClaim={claimQuest} />
        </div>
      </div>
    </div>
  );
}
