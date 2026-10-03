import { useEffect, useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import {
  formatQuestCountdown,
  getNextDailyResetAt,
  getNextWeeklyResetAt,
  getCollectionPowerMultiplier,
  getScaledQuestDivineLight,
  refreshQuestRotation,
  isQuestComplete,
  isSuperWeeklyReady,
  type QuestInstance,
} from '@/systems/progression/quests';
import { computeGlobalResonanceScore } from '@/systems/progression/cardMastery';
import { uiTypography, warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';

interface Props { onClose: () => void; }
type Cadence = 'daily' | 'weekly';

function getCadenceTheme(cadence: Cadence) {
  const accent = cadence === 'daily' ? warmTheme.accent : warmTheme.accentSoft;
  const accentSoft = cadence === 'daily' ? warmTheme.accentSoft : warmTheme.textSoft;
  const accentGlow = `color-mix(in srgb, ${accent} 34%, transparent)`;
  const border = `color-mix(in srgb, ${accent} 34%, transparent)`;
  const borderActive = `color-mix(in srgb, ${accentSoft} 75%, transparent)`;
  const chipBg = `color-mix(in srgb, ${accent} 13%, transparent)`;
  const chipBorder = `color-mix(in srgb, ${accentSoft} 55%, transparent)`;
  const headerPosition = cadence === 'daily' ? '20%' : '80%';
  return {
    label: cadence === 'daily' ? 'Daily Challenges' : 'Weekly Challenges',
    tag: cadence === 'daily' ? 'RESETS EACH DAY' : 'RESETS EACH WEEK',
    accent,
    accentSoft,
    glow: accentGlow,
    chipBg,
    chipBorder,
    fillFrom: accent,
    fillTo: accentSoft,
    cardTop: warmTheme.surfaceStrong,
    cardBottom: warmTheme.surfaceMuted,
    border,
    borderActive,
    headerTint: `radial-gradient(ellipse 55% 40% at ${headerPosition} 0%, ${chipBg} 0%, transparent 60%)`,
  };
}

const KIND_LABEL: Record<string, string> = {
  play_cards: 'Play cards', play_light: 'Play Light', play_dark: 'Play Dark',
  summon_ain_soph_aur: 'Summon Ain Soph Aur', flip_soph: 'Flip Soph',
  activate_ain_attack: 'Ain Attack', activate_soph_attack: 'Soph Attack',
  activate_dark: 'Dark activation', bridge_ain_soph_aur: 'Bridge attack',
  spend_light_stacks: 'Spend Light Stacks', earn_divine_light_in_turn: 'Earn Divine Light',
  open_packs: 'Open packs', win_boss: 'Defeat bosses',
};

function QuestCard({ quest, cadence, resonanceScore, onClaim }: { quest: QuestInstance; cadence: Cadence; resonanceScore: number; onClaim: () => void }) {
  const theme = getCadenceTheme(cadence);
  const complete = isQuestComplete(quest);
  const progressPct = Math.min(100, Math.round((quest.progress / Math.max(1, quest.goal)) * 100));
  const claimable = complete && !quest.claimed;
  const rewardParts = [] as string[];
  if (quest.divineLightReward) {
    rewardParts.push(`+${getScaledQuestDivineLight(quest.divineLightReward, resonanceScore).toLocaleString()} Divine Light`);
  }
  if (quest.shardReward) rewardParts.push(`+${quest.shardReward} Aberrated Shards`);
  const rewardText = rewardParts.join(' · ') || 'Reward';
  const collectionPower = getCollectionPowerMultiplier(resonanceScore);

  return (
    <div style={{
      position: 'relative', minHeight: 154, padding: '16px 18px 18px', borderRadius: 14,
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
          <div style={{ color: warmTheme.text, fontFamily: uiTypography.display, fontSize: 18, marginTop: 3, lineHeight: 1.2 }}>{quest.text}</div>
        </div>
        <div style={{ color: theme.accentSoft, fontFamily: uiTypography.display, fontSize: 20, whiteSpace: 'nowrap', textShadow: `0 0 12px ${theme.glow}` }}>
          {quest.progress}<span style={{ color: warmTheme.textFaint, fontSize: 15 }}>/{quest.goal}</span>
        </div>
      </div>
      <div style={{ position: 'relative', marginTop: 14, height: 8, borderRadius: 999, background: warmTheme.surfaceMuted, border: `1px solid ${warmTheme.border}`, overflow: 'hidden' }}>
        <div style={{ width: `${progressPct}%`, height: '100%', background: `linear-gradient(90deg, ${theme.fillFrom}, ${theme.fillTo})`, boxShadow: claimable ? `0 0 12px ${theme.glow}` : 'none', transition: 'width 0.35s ease' }} />
      </div>
      <div style={{ position: 'relative', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, color: theme.accentSoft, background: theme.chipBg, border: `1px solid ${theme.chipBorder}` }}>
          {quest.divineLightReward
            ? `${rewardText} (${quest.divineLightReward.toLocaleString()} base Divine Light × ${collectionPower.toFixed(2)} Collection Power)`
            : rewardText}
        </span>
        <button onClick={onClaim} disabled={!claimable} style={{
          fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', padding: '7px 16px', borderRadius: 8, cursor: claimable ? 'pointer' : 'default',
          color: quest.claimed ? warmTheme.textMuted : claimable ? warmTheme.accentDeep : warmTheme.textSoft,
          background: quest.claimed ? 'rgba(255,255,255,0.06)' : claimable ? `linear-gradient(180deg, ${theme.accentSoft} 0%, ${theme.accent} 100%)` : 'rgba(255,255,255,0.05)',
          border: `1px solid ${quest.claimed ? 'rgba(255,255,255,0.14)' : claimable ? theme.borderActive : 'rgba(255,255,255,0.12)'}`,
          boxShadow: claimable ? `0 6px 16px ${theme.glow}` : 'none',
        }}><span className="ui-button-title ui-button-title-on-light">{quest.claimed ? 'Claimed' : claimable ? 'Claim Reward' : 'In progress'}</span></button>
      </div>
    </div>
  );
}

function ChallengeColumn({ cadence, quests, resonanceScore, onClaim }: { cadence: Cadence; quests: QuestInstance[]; resonanceScore: number; onClaim: (id: string) => void }) {
  const theme = getCadenceTheme(cadence);
  const completedCount = quests.filter(q => isQuestComplete(q)).length;
  return (
    <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: 'min(720px, calc(100vh - 190px))', padding: '20px 14px 18px 20px', borderRadius: 18, border: `1px solid ${theme.border}`, background: warmTheme.surface, boxShadow: warmTheme.glow }}>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div><div style={{ color: theme.accentSoft, fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 2.8, textTransform: 'uppercase' }}>{theme.tag}</div><h2 style={{ margin: '4px 0 0', color: warmTheme.text, fontFamily: uiTypography.display, fontSize: 22, letterSpacing: 1 }}>{theme.label}</h2></div>
            <div style={{ color: theme.accentSoft, fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 2 }}>{completedCount}/{quests.length} READY</div>
      </header>
      <div className="ornate-scroll" style={{ flex: 1, display: 'grid', gap: 12, minHeight: 0, overflowY: 'auto', paddingRight: 6, paddingBottom: 4 }}>{quests.length === 0 ? <div style={{ color: warmTheme.textMuted, fontStyle: 'italic', padding: '18px 4px' }}>No challenges available right now.</div> : quests.map(quest => <QuestCard key={quest.id} quest={quest} cadence={cadence} resonanceScore={resonanceScore} onClaim={() => onClaim(quest.id)} />)}</div>
    </section>
  );
}

function ResetTimer({ cadence, now }: { cadence: Cadence; now: number }) {
  const theme = getCadenceTheme(cadence);
  const resetAt = cadence === 'daily' ? getNextDailyResetAt(now) : getNextWeeklyResetAt(now);
  return <div style={{ marginTop: 5, color: warmTheme.textMuted, fontSize: 10, letterSpacing: 1.1, fontFamily: uiTypography.display }}>
    NEXT RESET <span style={{ color: theme.accentSoft }}>{formatQuestCountdown(resetAt - now)}</span>
  </div>;
}

export default function QuestsModal({ onClose }: Props) {
  useThemeVersion();
  const [now, setNow] = useState(() => Date.now());
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
  const readyCount = [...view.daily, ...view.weekly].filter(q => isQuestComplete(q) && !q.claimed).length;
  const superWeeklies = view.superWeeklies ?? (view.superWeekly ? [view.superWeekly] : []);
  const superReady = isSuperWeeklyReady(view);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div onClick={onClose} role="dialog" aria-modal="true" className="ui-panel-intro" style={{ position: 'absolute', inset: 0, zIndex: 50, overflowY: 'auto', padding: '32px 28px 60px', background: `radial-gradient(circle at 20% -10%, color-mix(in srgb, ${warmTheme.accent} 14%, transparent), transparent 45%), radial-gradient(circle at 80% -10%, color-mix(in srgb, ${warmTheme.accentSoft} 14%, transparent), transparent 45%), ${warmTheme.appBackground}`, color: warmTheme.text, fontFamily: uiTypography.body }}>
      <div onClick={event => event.stopPropagation()} style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header className="ui-artwork-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', border: `1px solid ${warmTheme.borderStrong}`, borderRadius: 16, padding: '22px 24px', marginBottom: 24, backgroundImage: 'linear-gradient(90deg, rgba(8,9,15,0.96), rgba(12,14,24,0.80), rgba(10,12,20,0.35)), url("' + import.meta.env.BASE_URL + 'assets/menu-banners/challenges.png")', backgroundPosition: 'right center', backgroundSize: 'cover', boxShadow: `0 10px 30px rgba(0,0,0,0.30), inset 0 -1px 0 color-mix(in srgb, ${warmTheme.accentSoft} 18%, transparent)` }}>
          <div data-ui-artwork-copy>
            <div style={{ color: warmTheme.accent, fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 3 }}>✦ DAILY & WEEKLY OBJECTIVES</div>
            <h1 style={{ margin: '8px 0 4px', color: warmTheme.text, fontFamily: uiTypography.display, fontSize: 34, letterSpacing: 1.5 }}>Challenges</h1>
            <div style={{ color: warmTheme.textMuted, fontSize: 13 }}>Complete daily and weekly challenges for Divine Light and Aberrated Shards. Base rewards target approximately 60,000 Divine Light from daily challenges across seven days and 100,000 from weekly challenges.</div>
            {readyCount > 0 && <div data-ui-special-text style={{ display: 'inline-block', marginTop: 12, padding: '5px 12px', borderRadius: 999, fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 1.6, color: warmTheme.text, background: warmTheme.surfaceStrong, border: `1px solid ${warmTheme.borderStrong}`, boxShadow: `0 6px 14px color-mix(in srgb, ${warmTheme.accent} 35%, transparent)` }}>{readyCount} REWARD{readyCount === 1 ? '' : 'S'} READY</div>}
          </div>
          <button onClick={onClose} aria-label="Close Challenges" style={{ width: 42, height: 42, borderRadius: '50%', border: `1px solid ${warmTheme.borderStrong}`, background: `color-mix(in srgb, ${warmTheme.accent} 8%, transparent)`, color: warmTheme.text, fontSize: 18, cursor: 'pointer', fontFamily: uiTypography.display }}>✕</button>
        </header>
        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          <div>
            <ResetTimer cadence="daily" now={now} />
            <ChallengeColumn cadence="daily" quests={view.daily} resonanceScore={resonanceScore} onClaim={claimQuest} />
          </div>
          <div>
            <ResetTimer cadence="weekly" now={now} />
            <ChallengeColumn cadence="weekly" quests={view.weekly} resonanceScore={resonanceScore} onClaim={claimQuest} />
          </div>
        </div>
        {superWeeklies.length > 0 && (
          <section style={{ marginTop: 24, padding: 20, borderRadius: 18, border: `1px solid ${warmTheme.borderStrong}`, background: `radial-gradient(circle at 85% 0%, color-mix(in srgb, ${warmTheme.accentSoft} 22%, transparent), transparent 48%), linear-gradient(145deg, ${warmTheme.surfaceStrong}, ${warmTheme.surfaceMuted})`, boxShadow: `0 0 26px color-mix(in srgb, ${warmTheme.accentSoft} 16%, transparent)` }}>
            <div style={{ color: warmTheme.accentSoft, fontFamily: uiTypography.display, fontSize: 10, letterSpacing: 2.8, textTransform: 'uppercase' }}>SUPER WEEKLY CHALLENGE</div>
            <h2 style={{ margin: '6px 0 5px', color: warmTheme.text, fontFamily: uiTypography.display, fontSize: 24 }}>Two Boss Objectives</h2>
            <div style={{ color: warmTheme.textMuted, fontSize: 13, lineHeight: 1.5 }}>Complete and claim every weekly challenge, then consume the rotation to unlock two high-stakes Eternity&apos;s Wake boss objectives.</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>{superWeeklies.map(challenge => {
              const boss = BOSS_DEFINITIONS.find(entry => entry.id === challenge.bossId);
              return <div key={challenge.bossId} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${warmTheme.border}`, background: warmTheme.surfaceMuted, color: warmTheme.textSoft, fontFamily: uiTypography.display, fontSize: 12 }}>{boss?.name ?? challenge.bossId} <span style={{ color: warmTheme.textMuted, marginLeft: 8 }}>{challenge.completed ? 'Completed' : challenge.active ? 'Active' : 'Locked'}</span></div>;
            })}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 16, flexWrap: 'wrap' }}>
              <span style={{ color: superWeeklies.every(challenge => challenge.completed) ? warmTheme.success : warmTheme.accent, fontFamily: uiTypography.display, fontSize: 11, letterSpacing: 1.2 }}>{superWeeklies.every(challenge => challenge.completed) ? 'COMPLETED' : superWeeklies.some(challenge => challenge.active) ? 'ACTIVE · CHALLENGE THE BOSSES' : superReady ? 'READY TO ACTIVATE' : 'CLAIM ALL WEEKLY REWARDS FIRST'}</span>
              {!superWeeklies.some(challenge => challenge.active || challenge.completed) && <button onClick={() => activateSuperWeekly()} disabled={!superReady} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${warmTheme.borderStrong}`, background: superReady ? warmTheme.button : warmTheme.surfaceMuted, color: superReady ? warmTheme.accentDeep : warmTheme.textMuted, cursor: superReady ? 'pointer' : 'not-allowed', fontFamily: uiTypography.display, letterSpacing: 1.1, textTransform: 'uppercase' }}>Consume Weekly Challenges</button>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
