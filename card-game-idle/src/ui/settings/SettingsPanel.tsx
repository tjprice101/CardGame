import { useRef, useState } from 'react';
import { useStore, selectSettings } from '@/state/store';
import { warmTheme } from '@/ui/theme';
import { FONT_SIZE_OPTIONS, LANGUAGE_OPTIONS, t } from '@/ui/preferences';
import ControlsSection from '@/ui/settings/ControlsSection';

interface Props {
  onClose: () => void;
  onSave: () => void;
  onWipe: () => void;
  onExport?: () => string | null;
  onImport?: (text: string) => boolean;
}

export default function SettingsPanel({ onClose, onSave, onWipe, onExport, onImport }: Props) {
  const settings = useStore(selectSettings);
  const saveTampered = useStore(s => s.saveTampered ?? false);
  const updateSettings = useStore(s => s.updateSettings);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [importStatus, setImportStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleSave() {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleWipe() {
    onWipe();
    setConfirmDelete(false);
  }

  function handleExport() {
    if (!onExport) return;
    const payload = onExport();
    if (!payload) {
      setImportStatus({ kind: 'err', msg: 'Nothing to export yet.' });
      return;
    }
    const blob = new Blob([payload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `pantheon-${stamp}.pansave`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setImportStatus({ kind: 'ok', msg: 'Save exported.' });
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file || !onImport) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const ok = onImport(text);
      setImportStatus(ok
        ? { kind: 'ok', msg: 'Save imported. Reloading state…' }
        : { kind: 'err', msg: 'Not a valid Pantheon save file.' });
    };
    reader.onerror = () => {
      setImportStatus({ kind: 'err', msg: 'Could not read file.' });
    };
    reader.readAsText(file);
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(circle at 50% 14%, rgba(201, 170, 112, 0.2) 0%, rgba(201, 170, 112, 0) 36%), radial-gradient(circle at 10% 86%, rgba(104, 134, 174, 0.2) 0%, rgba(104, 134, 174, 0) 40%), repeating-linear-gradient(35deg, rgba(222, 196, 148, 0.06) 0px, rgba(222, 196, 148, 0.06) 1px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0) 20px), linear-gradient(180deg, rgba(16, 18, 23, 0.965) 0%, rgba(19, 24, 31, 0.965) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, pointerEvents: 'auto', fontFamily: 'Georgia, serif',
      ['--ui-accent' as any]: '230, 196, 132',
      ['--ui-accent-soft' as any]: '250, 224, 184',
    } as React.CSSProperties}>
      <div className="ui-panel-intro" style={{
        background: warmTheme.surfaceStrong,
        border: `1px solid ${warmTheme.borderStrong}`,
        borderRadius: 16,
        padding: '28px 32px',
        width: 340,
        boxShadow: warmTheme.shadow,
        maxHeight: '88vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        {/* Header */}
        <div className="ui-shimmer-band" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24, borderBottom: `1px solid ${warmTheme.border}`, paddingBottom: 14,
          position: 'relative',
        }}>
          <div className="ui-title-glow" style={{ fontSize: 18, fontWeight: 'bold', color: warmTheme.accentDeep, letterSpacing: 2 }}>
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

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: warmTheme.text }}>
              <input
                type="checkbox"
                checked={!!settings.compactMode}
                onChange={(e) => updateSettings({ compactMode: e.target.checked })}
              />
              Compact UI mode
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: warmTheme.text }}>
              <input
                type="checkbox"
                checked={settings.highlightRulesText !== false}
                onChange={(e) => updateSettings({ highlightRulesText: e.target.checked })}
              />
              Highlight keywords in card rules
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

        <ControlsSection />

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

          {/* Export / Import (portable save file for moving between machines) */}
          {(onExport || onImport) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {onExport && (
                <button className="menu-tactile-btn"
                  onClick={handleExport}
                  title="Download a .pansave file you can carry to another install"
                  style={{
                    padding: '10px 0', borderRadius: 10,
                    border: `1px solid ${warmTheme.borderStrong}`,
                    background: warmTheme.button,
                    color: warmTheme.accentDeep, fontSize: 12, cursor: 'pointer',
                    fontFamily: 'Georgia, serif', letterSpacing: 1,
                  }}
                >
                  Export Save
                </button>
              )}
              {onImport && (
                <button className="menu-tactile-btn"
                  onClick={handleImportClick}
                  title="Load a .pansave or legacy .hrsave file from another install"
                  style={{
                    padding: '10px 0', borderRadius: 10,
                    border: `1px solid ${warmTheme.borderStrong}`,
                    background: warmTheme.button,
                    color: warmTheme.accentDeep, fontSize: 12, cursor: 'pointer',
                    fontFamily: 'Georgia, serif', letterSpacing: 1,
                  }}
                >
                  Import Save
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pansave,.hrsave,.json,.txt,text/plain"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {importStatus && (
            <div style={{
              marginBottom: 10, padding: '8px 10px', borderRadius: 8,
              fontSize: 11, lineHeight: 1.4,
              border: `1px solid ${importStatus.kind === 'ok' ? 'rgba(79,138,71,0.4)' : 'rgba(184,92,79,0.4)'}`,
              background: importStatus.kind === 'ok' ? 'rgba(79,138,71,0.1)' : 'rgba(184,92,79,0.1)',
              color: importStatus.kind === 'ok' ? warmTheme.success : warmTheme.danger,
            }}>
              {importStatus.msg}
            </div>
          )}

          {saveTampered && (
            <div style={{
              marginBottom: 10, padding: '8px 10px', borderRadius: 8,
              border: '1px solid rgba(184,92,79,0.45)',
              background: 'rgba(184,92,79,0.12)',
              color: warmTheme.danger, fontSize: 11, lineHeight: 1.45,
            }}>
              ⚠ This save's integrity check failed. The file may have been edited
              outside the game. Your progress was still loaded — saving again
              will re-sign the file with the current state.
            </div>
          )}

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
