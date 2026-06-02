import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '@/state/store';
import { BOSS_DEFINITIONS } from '@/data/bosses/bossDefinitions';
import { warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';

interface Props { onClose: () => void }

const CATEGORY_ORDER = ['Neutrality', 'Light', 'Fire', 'Wind', 'Ice', 'Lightning', 'Nature', 'Water', 'Dark'] as const;

function formatSeconds(s: number): string {
  if (!Number.isFinite(s) || s <= 0) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec.toString().padStart(2, '0')}s` : `${sec}s`;
}

function formatDate(ts?: number): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleDateString();
  } catch {
    return '—';
  }
}

export default function BossCodex({ onClose }: Props) {
  useThemeVersion();
  const clears = useStore(s => s.progress.bossClearCounts);
  const codex = useStore(s => s.progress.bossCodex ?? {});
  const [activeTab, setActiveTab] = useState<string>('All');

  const categories = useMemo(() => {
    const found = new Set<string>();
    for (const b of BOSS_DEFINITIONS) found.add(b.category);
    const ordered = CATEGORY_ORDER.filter(c => found.has(c));
    const remaining = [...found].filter(c => !ordered.includes(c as any));
    return ['All', ...ordered, ...remaining];
  }, []);

  const visible = activeTab === 'All'
    ? BOSS_DEFINITIONS
    : BOSS_DEFINITIONS.filter(b => b.category === activeTab);

  const totalBosses = BOSS_DEFINITIONS.length;
  const totalCleared = BOSS_DEFINITIONS.filter(b => (clears[b.id] ?? 0) > 0).length;
  const totalClears = Object.values(clears).reduce((a, b) => a + b, 0);

  return (
    <div className="ui-panel-intro" style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(circle at 18% 10%, rgba(255, 107, 107, 0.14) 0%, rgba(255, 107, 107, 0) 38%), linear-gradient(180deg, #0c0a10 0%, #14101a 100%)',
      zIndex: 70,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Georgia, serif', color: '#ead9c0',
      ['--ui-accent' as any]: '255, 107, 107',
    }}>
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid rgba(255,107,107,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        background: 'rgba(9, 6, 12, 0.4)',
      }}>
        <div>
          <div className="ui-title-glow" style={{ fontSize: 20, fontWeight: 'bold', color: '#ff6b6b', letterSpacing: 2 }}>
            BOSS CODEX
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,200,200,0.65)', marginTop: 3 }}>
            {totalCleared} / {totalBosses} bosses defeated · {totalClears} total clears
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255, 237, 213, 0.94)', border: `1px solid ${warmTheme.border}`,
          color: '#5f3a17', borderRadius: 10, padding: '6px 16px',
          fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif',
        }}>Close</button>
      </div>

      <div style={{
        display: 'flex', gap: 6, padding: '10px 24px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,107,107,0.18)',
        background: 'rgba(9, 6, 12, 0.28)',
        flexWrap: 'wrap',
      }}>
        {categories.map(cat => {
          const active = cat === activeTab;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              style={{
                padding: '5px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                fontFamily: 'Georgia, serif', letterSpacing: 1,
                background: active ? 'rgba(255,107,107,0.18)' : 'rgba(255, 236, 209, 0.9)',
                border: active ? '1px solid #ff6b6b' : `1px solid ${warmTheme.border}`,
                color: active ? '#ffb0b0' : '#5f3a17',
              }}
            >{cat}</button>
          );
        })}
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 24px',
        display: 'grid', gap: 10,
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        alignContent: 'flex-start',
      }}>
        {visible.map(boss => {
          const clearCount = clears[boss.id] ?? 0;
          const entry = codex[boss.id];
          const isCleared = clearCount > 0;
          const cardStyle: CSSProperties = {
            padding: 12,
            borderRadius: 8,
            background: isCleared
              ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.10), rgba(40, 18, 24, 0.55))'
              : 'rgba(20, 14, 22, 0.55)',
            border: isCleared
              ? '1px solid rgba(255, 140, 140, 0.45)'
              : '1px solid rgba(140, 100, 100, 0.18)',
            display: 'flex', flexDirection: 'column', gap: 6,
            opacity: isCleared ? 1 : 0.78,
          };
          return (
            <div key={boss.id} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'space-between' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isCleared ? '#ffd0d0' : '#caa', letterSpacing: 0.6 }}>
                  {isCleared ? boss.name : '???'}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,200,200,0.6)', letterSpacing: 1 }}>
                  {boss.category}
                </div>
              </div>
              {isCleared ? (
                <>
                  <div style={{ fontSize: 11, color: 'rgba(234, 217, 192, 0.78)', lineHeight: 1.45 }}>
                    {boss.description ?? ''}
                  </div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
                    marginTop: 6, fontSize: 11,
                  }}>
                    <Stat label="Clears" value={clearCount.toString()} />
                    <Stat label="Best Time" value={formatSeconds(entry?.fastestClearSeconds ?? 0)} />
                    <Stat label="Best Damage" value={(entry?.highestFightDamage ?? 0).toLocaleString()} />
                    <Stat label="First Clear" value={formatDate(entry?.firstClearAt)} />
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 11, color: 'rgba(180, 150, 150, 0.65)', fontStyle: 'italic' }}>
                  Defeat this boss to reveal its codex entry.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: 'rgba(255,200,200,0.55)', fontSize: 9, letterSpacing: 1 }}>{label.toUpperCase()}</div>
      <div style={{ color: '#f0d4a8', fontWeight: 600 }}>{value}</div>
    </div>
  );
}
