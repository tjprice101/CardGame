import { useStore, selectBossFight } from '@/state/store';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { CardRegistry } from '@/cards/CardRegistry';
import CardEngineCallout from '@/ui/components/CardEngineCallout';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import { warmTheme } from '@/ui/theme';

const RARITY_COLORS: Record<string, string> = {
  Common: '#999', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12', Eternal: '#ff6b6b', Infinite: '#e8e8f0',
};

export default function BossResultModal() {
  const bossFight = useStore(selectBossFight);
  const dismissBossResult = useStore(s => s.dismissBossResult);

  if (bossFight.mode !== 'victory' && bossFight.mode !== 'defeat') return null;

  const boss = BOSS_DEFINITIONS.find(b => b.id === bossFight.activeBossId);
  const isVictory = bossFight.mode === 'victory';
  const rewardDef = boss ? CardRegistry.get(boss.rewardCardId) : undefined;

  const accentColor = isVictory ? '#ffd700' : '#ff6b6b';

  return (
    <div style={{
      position: 'absolute', inset: 0, background: warmTheme.backdrop, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        background: warmTheme.surfaceStrong, border: `2px solid ${accentColor}`,
        borderRadius: 18, padding: '36px 48px', maxWidth: 480, width: '90%',
        display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center',
        textAlign: 'center',
        boxShadow: warmTheme.shadow,
      }}>
        {/* Result title */}
        <div style={{ fontSize: 28, fontWeight: 'bold', color: accentColor, letterSpacing: 3 }}>
          {isVictory ? 'VICTORY' : 'DEFEATED'}
        </div>

        {boss && (
          <div style={{ fontSize: 14, color: warmTheme.textSoft }}>
            {isVictory ? `${boss.name} has been vanquished.` : `${boss.name} endured.`}
          </div>
        )}

        {/* Stats */}
        <div style={{
          background: warmTheme.surface, border: `1px solid ${warmTheme.border}`,
          borderRadius: 12, padding: '12px 20px', width: '100%',
        }}>
          <div style={{ fontSize: 12, color: warmTheme.textMuted, marginBottom: 6 }}>FIGHT SUMMARY</div>
          <div style={{ fontSize: 14, color: warmTheme.textSoft }}>
            Total damage dealt: <span style={{ color: accentColor }}>{bossFight.damageDealtThisFight.toLocaleString()}</span>
          </div>
        </div>

        {/* Reward card (victory only) */}
        {isVictory && rewardDef && (
          <div style={{
            background: warmTheme.surface, border: `1px solid ${warmTheme.borderStrong}`,
            borderRadius: 12, padding: '16px 24px', width: '100%',
          }}>
            <div style={{ fontSize: 10, color: warmTheme.textMuted, letterSpacing: 2, marginBottom: 8 }}>CARD AWARDED</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: warmTheme.accentDeep }}>{rewardDef.name}</div>
            <div style={{ fontSize: 11, color: RARITY_COLORS[rewardDef.rarity], marginTop: 4 }}>
              {rewardDef.rarity} · {rewardDef.type}
            </div>
              <div style={{ marginTop: 10 }}>
                <CardEngineCallout card={rewardDef} variant="compact" />
              </div>
              <div style={{ marginTop: 8 }}>
                <CardRulesDigest
                  card={rewardDef}
                  variant="preview"
                  maxSections={3}
                  maxLinesPerSection={10}
                  lineClamp={3}
                  labelColor={warmTheme.textMuted}
                  textColor={warmTheme.textSoft}
                  sectionBackground="transparent"
                  sectionBorder="transparent"
                />
            </div>
          </div>
        )}

        {/* Cooldown note */}
        <div style={{ fontSize: 11, color: warmTheme.textMuted }}>
          This boss is on cooldown for 60 seconds.
        </div>

        {/* Dismiss button */}
        <button
          onClick={dismissBossResult}
          style={{
            background: `rgba(${isVictory ? '255,215,0' : '255,107,107'},0.15)`,
            border: `1px solid ${accentColor}`,
            color: accentColor, padding: '10px 32px', borderRadius: 8,
            cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 15, letterSpacing: 1,
          }}
        >
          {isVictory ? 'Collect' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
