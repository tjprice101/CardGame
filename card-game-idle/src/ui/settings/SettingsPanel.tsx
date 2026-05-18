import { useState } from 'react';
import { useStore, selectSettings } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { FONT_SIZE_OPTIONS, LANGUAGE_OPTIONS, t } from '@/ui/preferences';

interface Props {
  onClose: () => void;
  onSave: () => void;
  onWipe: () => void;
}

export default function SettingsPanel({ onClose, onSave, onWipe }: Props) {
  const settings = useStore(selectSettings);
  const updateSettings = useStore(s => s.updateSettings);
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
        maxHeight: '88vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24, borderBottom: `1px solid ${warmTheme.border}`, paddingBottom: 14,
        }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: warmTheme.accentDeep, letterSpacing: 2 }}>
            {t('settingsTitle')}
          </div>
          <button className="menu-tactile-btn"
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: warmTheme.textMuted,
              fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
            }}
          >X</button>
        </div>

        {/* Save Data section */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
            color: warmTheme.textMuted, marginBottom: 12,
          }}>
            {t('gameplaySettings')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 12, color: warmTheme.text, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span>{t('musicVolume')}</span>
              <span style={{ color: warmTheme.textMuted }}>{Math.round(settings.musicVolume * 100)}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(settings.musicVolume * 100)}
              onChange={(e) => updateSettings({ musicVolume: Number(e.target.value) / 100 })}
            />

            <label style={{ fontSize: 12, color: warmTheme.text, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span>{t('sfxVolume')}</span>
              <span style={{ color: warmTheme.textMuted }}>{Math.round(settings.sfxVolume * 100)}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(settings.sfxVolume * 100)}
              onChange={(e) => updateSettings({ sfxVolume: Number(e.target.value) / 100 })}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: warmTheme.text }}>
              <input
                type="checkbox"
                checked={settings.musicVolume > 0}
                onChange={(e) => updateSettings({ musicVolume: e.target.checked ? Math.max(settings.musicVolume, 0.45) : 0 })}
              />
              {t('musicEnabled')}
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: warmTheme.text }}>
              <input
                type="checkbox"
                checked={settings.particlesEnabled}
                onChange={(e) => updateSettings({ particlesEnabled: e.target.checked })}
              />
              {t('particlesEnabled')}
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: warmTheme.text }}>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
              />
              {t('reducedMotion')}
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: warmTheme.text }}>
              <span>{t('fontSizePreset')}</span>
              <select
                value={settings.fontSizePreset}
                onChange={(e) => updateSettings({ fontSizePreset: e.target.value as typeof settings.fontSizePreset })}
                style={{
                  border: `1px solid ${warmTheme.borderStrong}`,
                  borderRadius: 8,
                  background: warmTheme.surface,
                  color: warmTheme.text,
                  fontFamily: 'Georgia, serif',
                  padding: '6px 8px',
                }}
              >
                {FONT_SIZE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            {/* Card Art Display Mode */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: warmTheme.text }}>Card Art Display</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(
                  [
                    { value: 'both',        label: 'Both (Default)',  desc: 'Name + Effects',   showTop: true,  showBottom: true  },
                    { value: 'top-only',    label: 'Name Only',       desc: 'Name only',         showTop: true,  showBottom: false },
                    { value: 'bottom-only', label: 'Effects Only',    desc: 'Effects only',      showTop: false, showBottom: true  },
                    { value: 'art-only',    label: 'Full Art',        desc: 'Art with outline',  showTop: false, showBottom: false },
                  ] as const
                ).map((opt) => {
                  const isActive = settings.cardArtDisplay === opt.value;
                  return (
                    <button className="menu-tactile-btn"
                      key={opt.value}
                      onClick={() => updateSettings({ cardArtDisplay: opt.value })}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        padding: '8px 6px', borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${isActive ? warmTheme.borderStrong : warmTheme.border}`,
                        background: isActive ? 'rgba(240,189,120,0.12)' : warmTheme.surface,
                        fontFamily: 'Georgia, serif',
                      }}
                    >
                      {/* Mini card preview */}
                      <div style={{
                        width: 52, height: 72, borderRadius: 6, overflow: 'hidden', position: 'relative', flexShrink: 0,
                        background: 'linear-gradient(160deg, #2a1e38 0%, #1a2434 50%, #1e2a1e 100%)',
                        boxShadow: opt.value === 'art-only' ? '0 0 0 1.5px rgba(255,255,255,0.7)' : `0 0 0 1px ${warmTheme.border}`,
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      }}>
                        {opt.showTop && (
                          <div style={{
                            background: 'rgba(240,228,210,0.93)', padding: '3px 4px', flexShrink: 0,
                          }}>
                            <div style={{ fontSize: 5, color: '#555', letterSpacing: 0.5 }}>OPHANIM</div>
                            <div style={{ fontSize: 6, fontWeight: 'bold', color: '#1a0e06', lineHeight: 1.2 }}>Oblivion Shard</div>
                          </div>
                        )}
                        <div style={{ flex: 1 }} />
                        {opt.showBottom && (
                          <div style={{
                            background: 'rgba(234,220,200,0.92)', padding: '3px 4px', flexShrink: 0,
                          }}>
                            <div style={{ fontSize: 5, color: '#2a1a0e', lineHeight: 1.3 }}>Draw 2 cards. +800 Oblivion.</div>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 9, color: isActive ? warmTheme.accentDeep : warmTheme.textMuted, textAlign: 'center', letterSpacing: 0.5 }}>
                        {opt.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: warmTheme.text }}>
              <span>{t('language')}</span>
              <select
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value as typeof settings.language })}
                style={{
                  border: `1px solid ${warmTheme.borderStrong}`,
                  borderRadius: 8,
                  background: warmTheme.surface,
                  color: warmTheme.text,
                  fontFamily: 'Georgia, serif',
                  padding: '6px 8px',
                }}
              >
                {LANGUAGE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <div style={{ fontSize: 10, color: warmTheme.textMuted, lineHeight: 1.4 }}>
              {t('applyImmediately')}
            </div>
          </div>
        </div>

        {/* Save Data section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
            color: warmTheme.textMuted, marginBottom: 12,
          }}>
            {t('saveData')}
          </div>

          <button className="menu-tactile-btn"
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
            {saved ? 'Saved!' : t('saveNow')}
          </button>

          {!confirmDelete ? (
            <button className="menu-tactile-btn"
              onClick={() => setConfirmDelete(true)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                border: '1px solid rgba(184,92,79,0.4)',
                background: 'rgba(184,92,79,0.12)',
                color: warmTheme.danger,
                fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 1,
              }}
            >
              {t('deleteSaveData')}
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
                <button className="menu-tactile-btn"
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
                <button className="menu-tactile-btn"
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 5,
                    border: `1px solid ${warmTheme.border}`,
                    background: warmTheme.surface,
                    color: warmTheme.textMuted, fontSize: 12, cursor: 'pointer',
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  {t('close')}
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="menu-tactile-btn"
          onClick={onClose}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 10,
            border: `1px solid ${warmTheme.border}`,
            background: warmTheme.surface,
            color: warmTheme.textMuted, fontSize: 12, cursor: 'pointer',
            fontFamily: 'Georgia, serif',
          }}
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}
