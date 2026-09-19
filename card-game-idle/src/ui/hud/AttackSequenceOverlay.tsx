import { useEffect, useMemo, useState } from 'react';
import { useStore, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { getLiveCardFaceBackgroundStyle, getLiveCardShimmerClassName } from '@/ui/cardBackgrounds';
import { uiTypography } from '@/ui/theme';

const AMBIENT_STARS = Array.from({ length: 90 }, (_, index) => ({
  id: index,
  x: (index * 47.17) % 100,
  y: (index * 73.31) % 100,
  size: 1 + (index % 4) * 0.55,
  delay: -((index % 17) * 0.19),
}));

export default function AttackSequenceOverlay() {
  const turn = useStore(selectTurn);
  const sequence = turn.attackSequence;
  const [, refresh] = useState(0);

  useEffect(() => {
    if (!sequence) return;
    const timer = window.setInterval(() => {
      useStore.getState().tickAttackSequence(Date.now());
      refresh(value => value + 1);
    }, 50);
    return () => window.clearInterval(timer);
  }, [sequence?.kind, sequence?.phase, sequence?.cardInstanceId]);

  const card = useMemo(() => sequence ? CardRegistry.get(sequence.cardDefinitionId) : undefined, [sequence?.cardDefinitionId]);
  if (!sequence) return null;

  const bridge = sequence.kind === 'bridge';
  const active = sequence.phase === 'active';
  const result = sequence.phase === 'result';
  const remaining = Math.max(0, sequence.phaseEndsAt - Date.now());
  const washOpacity = result ? 1 : 0;
  const title = sequence.kind === 'ain' ? 'Ain Attack' : sequence.kind === 'soph' ? 'Soph Attack' : 'Bridge the Light';
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!active) return;
    const rect = event.currentTarget.getBoundingClientRect();
    useStore.getState().registerAttackSequencePointer(
      (event.clientX - rect.left) / rect.width,
      (event.clientY - rect.top) / rect.height,
      Date.now(),
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 940, overflow: 'hidden', pointerEvents: 'auto', userSelect: 'none',
      background: bridge ? '#f8f7f2' : '#000',
      animation: bridge ? undefined : 'attackSequenceFadeBlack 900ms ease-out both',
    }} onPointerMove={handlePointerMove} className={`attack-sequence-overlay attack-sequence-overlay-${sequence.kind}`}>
      {sequence.phase !== 'priming' && (
        <div className={`attack-sequence-field attack-sequence-field-${sequence.kind}${bridge ? ' attack-sequence-field-inverted' : ''}`}>
          <div className="attack-sequence-nebula" />
          <div className="attack-sequence-orbit attack-sequence-orbit-a" />
          <div className="attack-sequence-orbit attack-sequence-orbit-b" />
          <div className="attack-sequence-signature" aria-hidden="true">✦</div>
          <div className="attack-sequence-energy-bands" aria-hidden="true" />
          {AMBIENT_STARS.map(star => (
            <i
              key={star.id}
              className={`shatter-ambient-star shatter-ambient-star-depth-${star.id % 3}`}
              style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s`, animationDuration: `${1.8 + (star.id % 7) * 0.35}s` }}
            />
          ))}
        </div>
      )}

      {sequence.kind === 'soph' && card && (
        <div className={`attack-sequence-soph-card ${getLiveCardShimmerClassName(card, sequence.cardFinish) ?? ''}`} style={{
          position: 'absolute', left: '50%', top: '50%', width: 176, aspectRatio: '148 / 204',
          transform: 'translate(-50%, -50%)', borderRadius: 14, overflow: 'hidden', opacity: 0.78,
          ...getLiveCardFaceBackgroundStyle(card, sequence.cardFinish),
          animation: 'attackSequenceCardFloat 2.4s ease-in-out infinite alternate',
          boxShadow: '0 18px 70px rgba(255,220,130,0.28)',
        }} />
      )}

      {active && sequence.stars.map((star, index) => (
        <i
          key={star.id}
          aria-hidden="true"
          className={bridge ? 'attack-sequence-star-guide attack-sequence-star-guide-bridge' : 'attack-sequence-star-guide'}
          style={{ left: `${star.x}%`, top: `${star.y}%`, opacity: 0.28 + index * 0.06 }}
        >{bridge ? index + 1 : '·'}</i>
      ))}
      {active && <div className={`attack-sequence-orbit-target${bridge ? ' attack-sequence-orbit-target-bridge' : ''}`} aria-hidden="true"><span>✦</span></div>}

      <div className={active ? 'attack-sequence-counter shatter-counter-pulse' : 'attack-sequence-counter'} style={{ color: bridge ? '#16050b' : '#fff9e8', textShadow: bridge ? '0 0 14px rgba(255,40,90,0.38)' : '0 0 18px rgba(255,220,120,0.65)' }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.78 }}>{title}</div>
        {active && <div style={{ fontSize: 34, marginTop: 5, fontWeight: 800 }}>{(remaining / 1_000).toFixed(1)}s</div>}
        {active && <div style={{ fontSize: 14, marginTop: 4, letterSpacing: 1.5 }}>◌ {(sequence.orbitScore ?? 0).toFixed(1)} orbit power</div>}
        {active && <div style={{ marginTop: 8, fontSize: 10, letterSpacing: 1.2, opacity: 0.7 }}>Trace a smooth, steady circle around the core to continuously raise payout.</div>}
      </div>

      {result && (
        <>
          <div
            className="shatter-title-text"
            style={{
              position: 'absolute', top: '50%', left: '50%', zIndex: 2,
              fontFamily: uiTypography.display, fontSize: 76, fontWeight: 900,
              color: bridge ? '#54132e' : '#0c0a06', letterSpacing: 4,
              textShadow: bridge ? '0 0 22px rgba(210,54,112,0.52), 0 0 46px rgba(255,112,170,0.28)' : '0 0 22px rgba(214,162,94,0.55), 0 0 46px rgba(214,162,94,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            {sequence.kind === 'ain' ? 'Ain Attack!!' : sequence.kind === 'soph' ? 'Soph Attack!!' : 'Bridged!!'}
          </div>
          <div style={{
            position: 'absolute', top: 'calc(50% + 64px)', left: '50%', zIndex: 2,
            transform: 'translateX(-50%)', fontFamily: uiTypography.display,
            fontSize: 20, color: bridge ? '#8d3157' : '#4a3418', letterSpacing: 1.5, whiteSpace: 'nowrap',
          }}>
            ×{sequence.multiplier.toFixed(1).replace('.0', '')} · +{sequence.payout.toLocaleString()} Divine Light
          </div>
        </>
      )}

      <div aria-hidden className={result ? `attack-sequence-result-wash${bridge ? ' attack-sequence-result-wash-bridge' : ''}` : ''} style={{ opacity: washOpacity, background: bridge ? '#f8f7f2' : '#fff' }} />
    </div>
  );
}