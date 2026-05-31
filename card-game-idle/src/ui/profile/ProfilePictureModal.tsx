import { useState, useMemo } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { AVATARS, isAvatarUnlocked, type AvatarDefinition } from '@/data/profile/avatars';
import { warmTheme } from '@/ui/theme';

interface Props {
  currentAvatarId: string;
  onClose: () => void;
  onApply?: (avatarId: string) => void;
}

const SECTIONS: { label: string; prefix: string }[] = [
  { label: 'Set Sigils', prefix: 'pic-sigil-' },
  { label: 'Set Mastery', prefix: 'pic-master-' },
  { label: 'Classic Achievements', prefix: 'pic-classic-' },
];

export default function ProfilePictureModal({ currentAvatarId, onClose, onApply }: Props) {
  const progress = useStore(selectProgress);
  const setAvatarId = useStore(s => s.setAvatarId);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const avatarsBySection = useMemo(() => {
    return SECTIONS.map(sec => ({
      ...sec,
      avatars: AVATARS.filter(a => a.id.startsWith(sec.prefix)),
    }));
  }, []);

  function handleSelect(avatar: AvatarDefinition) {
    if (!isAvatarUnlocked(avatar.id, progress)) return;
    setAvatarId(avatar.id);
    onApply?.(avatar.id);
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(4,2,1,0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, fontFamily: 'Georgia, serif',
      }}
      onClick={onClose}
    >
      <div
        className="ui-panel-intro"
        style={{
          background: 'linear-gradient(160deg, #0e0603 0%, #080302 60%, #060202 100%)',
          border: '1px solid rgba(200,128,58,0.30)',
          borderRadius: 18,
          padding: '0',
          width: 'min(92vw, 1100px)', height: 'min(96vh, 1000px)', maxHeight: 'none',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(200,128,58,0.07)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="ui-shimmer-band"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 26px 16px',
            borderBottom: '1px solid rgba(200,128,58,0.16)',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{
              fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif',
              fontSize: 18, fontWeight: 300, letterSpacing: 5, textTransform: 'uppercase',
              color: '#daa058', textShadow: '0 2px 22px rgba(218,160,88,0.38)',
            }}>
              Avatar
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <div style={{ height: 1, width: 50, background: 'linear-gradient(90deg, rgba(200,128,58,0.5) 0%, transparent 100%)' }} />
              <span style={{ fontSize: 9, letterSpacing: 3.5, textTransform: 'uppercase', color: 'rgba(218,160,88,0.40)' }}>
                Choose your profile picture
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '1px solid rgba(200,128,58,0.32)',
              background: 'rgba(200,128,58,0.06)',
              color: 'rgba(218,160,88,0.65)',
              fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit', lineHeight: 1, padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Avatar grid ── */}
        <div style={{ flex: 1, minHeight: 0, padding: '14px 24px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {avatarsBySection.map(sec => (
            <div key={sec.prefix}>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: '#c8803a', flexShrink: 0 }} />
                <div style={{
                  fontSize: 9.5, letterSpacing: 3.5, textTransform: 'uppercase',
                  color: 'rgba(218,160,88,0.65)',
                  fontFamily: '"Cinzel", Georgia, serif', fontWeight: 600,
                }}>
                  {sec.label}
                </div>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(200,128,58,0.22) 0%, transparent 80%)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
                {sec.avatars.map(avatar => {
                  const unlocked = isAvatarUnlocked(avatar.id, progress);
                  const selected = avatar.id === currentAvatarId;
                  const isHovered = hoveredId === avatar.id;

                  return (
                    <div
                      key={avatar.id}
                      onClick={() => handleSelect(avatar)}
                      onMouseEnter={() => setHoveredId(avatar.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                        padding: '8px 4px', borderRadius: 10,
                        border: selected
                          ? '1px solid rgba(200,128,58,0.65)'
                          : isHovered && unlocked
                            ? '1px solid rgba(200,128,58,0.30)'
                            : '1px solid rgba(200,128,58,0.10)',
                        background: selected
                          ? 'rgba(200,128,58,0.10)'
                          : isHovered && unlocked
                            ? 'rgba(200,128,58,0.05)'
                            : 'rgba(0,0,0,0.12)',
                        cursor: unlocked ? 'pointer' : 'default',
                        position: 'relative',
                        transition: 'border-color 0.15s, background 0.15s',
                        borderLeft: selected ? '2px solid rgba(200,128,58,0.80)' : undefined,
                      }}
                    >
                      {/* Outer ring */}
                      <div style={{
                        width: selected ? 64 : 62, height: selected ? 64 : 62,
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: selected
                          ? '2px solid rgba(200,128,58,0.60)'
                          : isHovered && unlocked
                            ? '2px solid rgba(200,128,58,0.30)'
                            : '2px solid rgba(200,128,58,0.10)',
                        boxShadow: selected
                          ? '0 0 22px rgba(200,128,58,0.22)'
                          : isHovered && unlocked
                            ? '0 0 12px rgba(200,128,58,0.12)'
                            : 'none',
                        filter: unlocked ? 'none' : 'grayscale(0.65) opacity(0.42)',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        flexShrink: 0,
                      }}>
                        {/* Inner ring */}
                        <div style={{
                          width: selected ? 50 : 48, height: selected ? 50 : 48,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: selected
                            ? '1.5px solid rgba(218,160,88,0.80)'
                            : '1.5px solid rgba(200,128,58,0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'linear-gradient(160deg, rgba(30,15,4,0.98), rgba(10,5,1,1))',
                        }}>
                          {avatar.imageUrl
                            ? <img src={avatar.imageUrl} alt={avatar.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                            : <span style={{ fontSize: 22, color: '#c8803a' }}>{avatar.glyph}</span>
                          }
                        </div>
                      </div>

                      {/* Lock overlay */}
                      {!unlocked && (
                        <div style={{
                          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                          width: 62, height: 62,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, color: 'rgba(200,128,58,0.40)', pointerEvents: 'none',
                        }}>
                          ⊘
                        </div>
                      )}

                      {/* Name */}
                      <div style={{
                        fontSize: 9.5, textAlign: 'center', lineHeight: 1.3,
                        color: selected ? '#daa058' : unlocked ? 'rgba(218,160,88,0.65)' : 'rgba(200,128,58,0.25)',
                        maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {avatar.name}
                      </div>

                      {/* Locked tooltip */}
                      {!unlocked && isHovered && (
                        <div style={{
                          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(8,4,1,0.97)',
                          border: '1px solid rgba(200,128,58,0.30)',
                          borderRadius: 8, padding: '8px 10px',
                          fontSize: 10.5, color: 'rgba(240,223,192,0.88)', lineHeight: 1.5,
                          whiteSpace: 'normal', width: 180, zIndex: 10,
                          pointerEvents: 'none',
                          boxShadow: '0 6px 22px rgba(0,0,0,0.6)',
                        }}>
                          <span style={{ color: '#daa058', fontWeight: 600 }}>Unlock: </span>
                          {avatar.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '10px 26px',
          borderTop: '1px solid rgba(200,128,58,0.12)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(200,128,58,0.18) 50%, transparent 100%)' }} />
          <div style={{ fontSize: 9.5, color: 'rgba(218,160,88,0.35)', letterSpacing: 1 }}>
            Hover locked avatars to see unlock conditions
          </div>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(200,128,58,0.18) 50%, transparent 100%)' }} />
        </div>
      </div>
    </div>
  );
}

void warmTheme;
