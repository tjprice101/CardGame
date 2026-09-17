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
  const washOpacity = active ? Math.min(0.86, progress * 0.8) : result ? 0.92 : 0;
  const title = sequence.kind === 'ain' ? 'Ain Attack' : sequence.kind === 'soph' ? 'Soph Attack' : 'Bridge the Light';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 940, overflow: 'hidden', pointerEvents: 'auto', userSelect: 'none',
      background: bridge ? '#f8f7f2' : '#000',
      animation: bridge ? 'attackSequenceFadeWhite 900ms ease-out both' : 'attackSequenceFadeBlack 900ms ease-out both',
    }}>
      {sequence.phase !== 'priming' && (
        <div className={bridge ? 'attack-sequence-field attack-sequence-field-inverted' : 'attack-sequence-field'}>
          {AMBIENT_STARS.map(star => <i key={star.id} style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s` }} />)}
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
          >✦</button>
        );
      })}

      <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', color: bridge ? '#16050b' : '#fff9e8', fontFamily: uiTypography.display, textShadow: bridge ? '0 0 14px rgba(255,40,90,0.38)' : '0 0 18px rgba(255,220,120,0.65)' }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>{title}</div>
        {active && <div style={{ fontSize: 30, marginTop: 5 }}>{(remaining / 1_000).toFixed(1)}s</div>}
        {active && <div style={{ fontSize: 13, marginTop: 3 }}>{sequence.clickedStarIds.length} / {sequence.stars.length} stars</div>}
      </div>

      {result && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: bridge ? '#18030a' : '#fff', fontFamily: uiTypography.display, textAlign: 'center' }}>
          <div><div style={{ fontSize: 48, letterSpacing: 3 }}>×{sequence.multiplier.toFixed(1).replace('.0', '')}</div><div style={{ marginTop: 8, fontSize: 18 }}>+{sequence.payout.toLocaleString()} Divine Light</div></div>
        </div>
      )}

      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: bridge ? '#000' : '#fff', opacity: washOpacity, transition: 'opacity 80ms linear' }} />
    </div>
  );
}