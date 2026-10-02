import type { CSSProperties } from 'react';
import { uiTypography } from '@/ui/theme';

interface Props {
  count: number;
  totalOwned?: number;
  style?: CSSProperties;
}

export default function TranscendentShardRewardBanner({ count, totalOwned, style }: Props) {
  if (count <= 0) return null;

  const shardImgUrl = `${import.meta.env.BASE_URL}assets/forge/shards-of-transcendence.png`;

  return (
    <div
      className="transcendent-shard-reward-card"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: '16px 20px',
        margin: '10px 0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        zIndex: 2,
        ...style,
      }}
    >
      {/* Icon with radiant red/pink/white aura */}
      <div
        style={{
          position: 'relative',
          width: 84,
          height: 84,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 47, 146, 0.6) 0%, rgba(224, 16, 46, 0.4) 50%, transparent 75%)',
            filter: 'blur(8px)',
            animation: 'transcendentFoilGlint 4s linear infinite',
          }}
        />
        <img
          src={shardImgUrl}
          alt="Shard of Transcendence"
          className="transcendentPulseShard"
          style={{
            width: 80,
            height: 80,
            objectFit: 'contain',
            position: 'relative',
            zIndex: 1,
            animation: 'transcendentPulseShard 2.4s ease-in-out infinite',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        {/* Glowing badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #e60039 0%, #ff2f92 50%, #ffffff 100%)',
              color: '#000000',
              fontWeight: 800,
              fontSize: 9,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              boxShadow: '0 0 12px rgba(255, 47, 146, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
            }}
          >
            ✦ ULTRA RARE DROP (1%) ✦
          </span>
          <span style={{ fontSize: 9.5, letterSpacing: 0.8, color: '#ffb3dc', textTransform: 'uppercase' }}>
            Forge of Transcendence
          </span>
        </div>

        {/* Big Shimmering Headline */}
        <div
          style={{
            marginTop: 4,
            fontFamily: uiTypography.display,
            fontSize: 'clamp(18px, 3vw, 24px)',
            fontWeight: 'bold',
            letterSpacing: 1.2,
            background: 'linear-gradient(90deg, #ffffff 0%, #ffc2df 25%, #ff3b88 55%, #ffffff 75%, #e60039 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'transcendentShimmerSweep 3.5s linear infinite',
            textShadow: '0 0 20px rgba(255, 47, 146, 0.4)',
            lineHeight: 1.15,
          }}
        >
          +{count} {count === 1 ? 'Shard of Transcendence' : 'Shards of Transcendence'}!
        </div>

        {/* Flavor / Subtitle */}
        <div style={{ marginTop: 3, fontSize: 11, color: 'rgba(255, 235, 245, 0.85)', lineHeight: 1.35 }}>
          The Forge answers — an extraordinary 1% drop crystallized from the outer silence.
        </div>

        {typeof totalOwned === 'number' && (
          <div style={{ marginTop: 4, fontSize: 10, color: '#ff9ec9', letterSpacing: 0.5, fontWeight: 600 }}>
            Total Owned: {totalOwned.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
