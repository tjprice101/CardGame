import { useState } from 'react';
import { warmTheme } from '@/ui/theme';

interface Props {
  onClose: () => void;
  onSave: () => void;
  onWipe: () => void;
}

export default function SettingsPanel({ onClose, onSave, onWipe }: Props) {
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSave() {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleWipe() {
    onWipe();
    setConfirmDelete(false);
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(circle at 50% 14%, rgba(201, 170, 112, 0.2) 0%, rgba(201, 170, 112, 0) 36%), radial-gradient(circle at 10% 86%, rgba(104, 134, 174, 0.2) 0%, rgba(104, 134, 174, 0) 40%), repeating-linear-gradient(35deg, rgba(222, 196, 148, 0.06) 0px, rgba(222, 196, 148, 0.06) 1px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0) 20px), linear-gradient(180deg, rgba(16, 18, 23, 0.965) 0%, rgba(19, 24, 31, 0.965) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, pointerEvents: 'auto', fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        background: warmTheme.surfaceStrong,
        border: `1px solid ${warmTheme.borderStrong}`,
        borderRadius: 16,
        padding: '28px 32px',
        width: 340,
        boxShadow: warmTheme.shadow,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24, borderBottom: `1px solid ${warmTheme.border}`, paddingBottom: 14,
        }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: warmTheme.accentDeep, letterSpacing: 2 }}>
            Settings
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: warmTheme.textMuted,
              fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
            }}
          >✕</button>
        </div>

        {/* Save Data section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
            color: warmTheme.textMuted, marginBottom: 12,
          }}>
            Save Data
          </div>

          <button
            onClick={handleSave}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 10,
              border: `1px solid ${saved ? 'rgba(79,138,71,0.35)' : warmTheme.borderStrong}`,
              background: saved ? 'rgba(79,138,71,0.12)' : warmTheme.button,
              color: saved ? warmTheme.success : warmTheme.accentDeep,
              fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif',
              letterSpacing: 1, marginBottom: 10, transition: 'background 0.2s, color 0.2s',
            }}
          >
            {saved ? '✓ Saved!' : 'Save Now'}
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                border: '1px solid rgba(184,92,79,0.4)',
                background: 'rgba(184,92,79,0.12)',
                color: warmTheme.danger,
                fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 1,
              }}
            >
              Delete Save Data
            </button>
          ) : (
            <div style={{
              border: '1px solid rgba(184,92,79,0.5)', borderRadius: 10,
              padding: '12px 14px', background: 'rgba(184,92,79,0.1)',
            }}>
              <div style={{ fontSize: 11, color: warmTheme.danger, marginBottom: 10, lineHeight: 1.5 }}>
                This will permanently erase all progress. Are you sure?
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleWipe}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 5,
                    border: '1px solid rgba(184,92,79,0.7)',
                    background: 'rgba(184,92,79,0.18)',
                    color: warmTheme.danger, fontSize: 12, cursor: 'pointer',
                    fontFamily: 'Georgia, serif', letterSpacing: 1,
                  }}
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 5,
                    border: `1px solid ${warmTheme.border}`,
                    background: warmTheme.surface,
                    color: warmTheme.textMuted, fontSize: 12, cursor: 'pointer',
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 10,
            border: `1px solid ${warmTheme.border}`,
            background: warmTheme.surface,
            color: warmTheme.textMuted, fontSize: 12, cursor: 'pointer',
            fontFamily: 'Georgia, serif',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
