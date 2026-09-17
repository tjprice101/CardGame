import { useEffect, useMemo, useState } from 'react';
import { useStore, selectTurn } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { getLiveCardFaceBackgroundStyle, getLiveCardShimmerClassName } from '@/ui/cardBackgrounds';
import { getAttackSequenceDuration } from '@/systems/cards/AttackSequence';
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
  const duration = active ? getAttackSequenceDuration(sequence.kind) : 1;
  const progress = active ? 1 - remaining / duration : result ? 1 : 0;
  const washOpacity = active ? Math.min(0.9, progress * 0.86) : result ? (bridge ? 0.94 : 1) : 0;
  const title = sequence.kind === 'ain' ? 'Ain Attack' : sequence.kind === 'soph' ? 'Soph Attack' : 'Bridge the Light';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 940, overflow: 'hidden', pointerEvents: 'auto', userSelect: 'none',
      background: bridge ? '#f8f7f2' : '#000',
      animation: bridge ? 'attackSequenceFadeWhite 900ms ease-out both' : 'attackSequenceFadeBlack 900ms ease-out both',
    }}>
      {sequence.phase !== 'priming' && (
        <div className={bridge ? 'attack-sequence-field attack-sequence-field-inverted' : 'attack-sequence-field'}>
          <div className="attack-sequence-nebula" />
          <div className="attack-sequence-orbit attack-sequence-orbit-a" />
          <div className="attack-sequence-orbit attack-sequence-orbit-b" />
          {AMBIENT_STARS.map(star => (
            <i
              key={star.id}
              className={`shatter-ambient-star shatter-ambient-star-depth-${star.id % 3}`}
              style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s`, animationDuration: `${1.8 + (star.id % 7) * 0.35}s` }}
            />
          ))}
        </div>
      )}

      {bridge && active && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {sequence.stars.slice(1).map((star, index) => {
            const previous = sequence.stars[index];
            const reached = sequence.clickedStarIds.length > index;
            return <line key={star.id} x1={previous.x} y1={previous.y} x2={star.x} y2={star.y} stroke={reached ? '#ff315f' : 'rgba(255,55,100,0.52)'} strokeWidth={reached ? 0.7 : 0.38} vectorEffect="non-scaling-stroke" />;
          })}
        </svg>
      )}

      {sequence.kind === 'soph' && card && (
        <div className={getLiveCardShimmerClassName(card, sequence.cardFinish)} style={{
          position: 'absolute', left: '50%', top: '50%', width: 176, aspectRatio: '148 / 204',
          transform: 'translate(-50%, -50%)', borderRadius: 14, overflow: 'hidden', opacity: 0.78,
          ...getLiveCardFaceBackgroundStyle(card, sequence.cardFinish),
          animation: 'attackSequenceCardFloat 2.4s ease-in-out infinite alternate',
          boxShadow: '0 18px 70px rgba(255,220,130,0.28)',
        }} />
      )}

      {active && sequence.stars.map((star, index) => {
        const clicked = sequence.clickedStarIds.includes(star.id);
        const available = !bridge || index === sequence.clickedStarIds.length;
        return (
          <button
            key={star.id}
            aria-label={`${title} star ${index + 1}`}
            disabled={clicked || !available}
            onClick={() => useStore.getState().registerAttackSequenceStarHit(star.id)}
            className={bridge ? 'attack-sequence-star attack-sequence-star-bridge' : 'attack-sequence-star'}
            style={{ left: `${star.x}%`, top: `${star.y}%`, opacity: clicked ? 0 : available ? 1 : 0.45 }}
          >
            <span className="attack-sequence-star-halo" aria-hidden="true" />
            <span className="attack-sequence-star-rays" aria-hidden="true" />
            <span className="attack-sequence-star-core">✦</span>
          </button>
        );
      })}

      <div className={active ? 'attack-sequence-counter shatter-counter-pulse' : 'attack-sequence-counter'} style={{ color: bridge ? '#16050b' : '#fff9e8', textShadow: bridge ? '0 0 14px rgba(255,40,90,0.38)' : '0 0 18px rgba(255,220,120,0.65)' }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.78 }}>{title}</div>
        {active && <div style={{ fontSize: 34, marginTop: 5, fontWeight: 800 }}>{(remaining / 1_000).toFixed(1)}s</div>}
        {active && <div style={{ fontSize: 14, marginTop: 4, letterSpacing: 1.5 }}>✦ {sequence.clickedStarIds.length} / {sequence.stars.length}</div>}
      </div>

      {result && (
        <>
          <div
            className="shatter-title-text"
            style={{
              position: 'absolute', top: '50%', left: '50%', zIndex: 2,
              fontFamily: uiTypography.display, fontSize: 76, fontWeight: 900,
              color: '#0c0a06', letterSpacing: 4,
              textShadow: '0 0 22px rgba(214,162,94,0.55), 0 0 46px rgba(214,162,94,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            {sequence.kind === 'ain' ? 'Ain Attack!!' : sequence.kind === 'soph' ? 'Soph Attack!!' : 'Bridged!!'}
          </div>
          <div style={{
            position: 'absolute', top: 'calc(50% + 64px)', left: '50%', zIndex: 2,
            transform: 'translateX(-50%)', fontFamily: uiTypography.display,
            fontSize: 20, color: '#4a3418', letterSpacing: 1.5, whiteSpace: 'nowrap',
          }}>
            ×{sequence.multiplier.toFixed(1).replace('.0', '')} · +{sequence.payout.toLocaleString()} Divine Light
          </div>
        </>
      )}

      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', background: bridge ? '#000' : '#fff', opacity: washOpacity, transition: 'opacity 80ms linear' }} />
    </div>
  );
}