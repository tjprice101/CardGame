import { useRef, useState } from 'react';
import { useStore, selectSettings } from '@/state/store';
import { subMenuWarm } from '@/ui/theme';
import { FONT_SIZE_OPTIONS, LANGUAGE_OPTIONS, t } from '@/ui/preferences';
import ControlsSection from '@/ui/settings/ControlsSection';
import type { SettingsState } from '@/types/game';

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

  // Buffered draft 窶・nothing reaches the store until "Save Settings" is clicked.
  const [draft, setDraft] = useState<Partial<SettingsState>>(() => ({ ...settings }));
  const patchDraft = (patch: Partial<SettingsState>) => setDraft(prev => ({ ...prev, ...patch }));

  const hasChanges = (Object.keys(draft) as (keyof SettingsState)[]).some(
    k => (draft as any)[k] !== (settings as any)[k],
  );

  const [settingsSaved, setSettingsSaved] = useState(false);
  const [gameSaved, setGameSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(0); // 0=none 1=first 2=second
  const [importStatus, setImportStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleSaveSettings() {
    updateSettings(draft);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  function handleDiscardSettings() {
    setDraft({ ...settings });
  }

  function handleSaveGame() {
    onSave();
    setGameSaved(true);
    setTimeout(() => setGameSaved(false), 2000);
  }

  function handleWipe() {
    onWipe();
    setConfirmDelete(0);
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
        ? { kind: 'ok', msg: 'Save imported. Reloading state窶ｦ' }
        : { kind: 'err', msg: 'Not a valid Pantheon save file.' });
    };
    reader.onerror = () => {
      setImportStatus({ kind: 'err', msg: 'Could not read file.' });
    };
    reader.readAsText(file);
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at 50% 0%, rgba(180,130,60,0.18) 0%, transparent 50%), linear-gradient(180deg, rgba(14,16,20,0.96) 0%, rgba(18,22,28,0.96) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, pointerEvents: 'auto', fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, rgba(255,252,244,0.99) 0%, rgba(250,244,232,0.99) 100%)',
        border: `1px solid ${subMenuWarm.borderStrong}`,
        borderRadius: 18,
        width: 480,
        boxShadow: `${subMenuWarm.shadow}, inset 0 1px 0 rgba(255,240,200,0.6)`,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Top accent band */}
        <div style={{
          height: 4, flexShrink: 0,
          background: `linear-gradient(90deg, ${subMenuWarm.accentDeep}, ${subMenuWarm.accent}, ${subMenuWarm.accentDeep})`,
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 28px 14px', borderBottom: `1px solid ${subMenuWarm.border}`,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: subMenuWarm.accentDeep, letterSpacing: 2 }}>
            {t('settingsTitle')}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `1px solid ${subMenuWarm.border}`,
              background: subMenuWarm.surfaceMuted,
              color: subMenuWarm.textMuted, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '22px 28px' }}>

          {/* ── Gameplay Settings ── */}
          <SectionHeader icon="♪" label={t('gameplaySettings')} />

          {/* Volume sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
            <VolumeSlider
              label={t('musicVolume')}
              value={Math.round((draft.musicVolume ?? settings.musicVolume) * 100)}
              onChange={v => patchDraft({ musicVolume: v / 100 })}
            />
            <VolumeSlider
              label={t('sfxVolume')}
              value={Math.round((draft.sfxVolume ?? settings.sfxVolume) * 100)}
              onChange={v => patchDraft({ sfxVolume: v / 100 })}
            />
          </div>

          {/* Checkboxes in 2-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 18 }}>
            <CheckRow
              label={t('musicEnabled')}
              checked={(draft.musicVolume ?? settings.musicVolume) > 0}
              onChange={on => patchDraft({ musicVolume: on ? Math.max(draft.musicVolume ?? settings.musicVolume, 0.45) : 0 })}
            />
            <CheckRow
              label={t('particlesEnabled')}
              checked={draft.particlesEnabled ?? settings.particlesEnabled}
              onChange={on => patchDraft({ particlesEnabled: on })}
            />
            <CheckRow
              label={t('reducedMotion')}
              checked={draft.reducedMotion ?? settings.reducedMotion}
              onChange={on => patchDraft({ reducedMotion: on })}
            />
            <CheckRow
              label="Compact UI mode"
              checked={!!(draft.compactMode ?? settings.compactMode)}
              onChange={on => patchDraft({ compactMode: on })}
            />
            <CheckRow
              label="Highlight keywords"
              checked={(draft.highlightRulesText ?? settings.highlightRulesText) !== false}
              onChange={on => patchDraft({ highlightRulesText: on })}
            />
          </div>

          {/* Selects row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <SelectRow
              label={t('fontSizePreset')}
              value={draft.fontSizePreset ?? settings.fontSizePreset}
              options={FONT_SIZE_OPTIONS}
              onChange={v => patchDraft({ fontSizePreset: v as typeof settings.fontSizePreset })}
            />
            <SelectRow
              label={t('language')}
              value={draft.language ?? settings.language}
              options={LANGUAGE_OPTIONS}
              onChange={v => patchDraft({ language: v as typeof settings.language })}
            />
          </div>

          {/* Card Art Display */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: subMenuWarm.textMuted, marginBottom: 10, letterSpacing: 0.5 }}>Card Art Display</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {(
                [
                  { value: 'both',        label: 'Both',        showTop: true,  showBottom: true  },
                  { value: 'top-only',    label: 'Name Only',   showTop: true,  showBottom: false },
                  { value: 'bottom-only', label: 'Effects',     showTop: false, showBottom: true  },
                  { value: 'art-only',    label: 'Full Art',    showTop: false, showBottom: false },
                ] as const
              ).map(opt => {
                const isActive = (draft.cardArtDisplay ?? settings.cardArtDisplay) === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => patchDraft({ cardArtDisplay: opt.value })}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                      border: `1px solid ${isActive ? subMenuWarm.borderStrong : subMenuWarm.border}`,
                      background: isActive ? 'rgba(200,128,58,0.10)' : 'rgba(0,0,0,0.03)',
                      fontFamily: 'Georgia, serif',
                    }}
                  >
                    <div style={{
                      width: 44, height: 60, borderRadius: 5, overflow: 'hidden',
                      background: 'linear-gradient(160deg, #2a1e38 0%, #1a2434 50%, #1e2a1e 100%)',
                      boxShadow: `0 0 0 ${isActive ? '1.5px ' + subMenuWarm.accent : '1px rgba(0,0,0,0.2)'}`,
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    }}>
                      {opt.showTop && (
                        <div style={{ background: 'rgba(240,228,210,0.93)', padding: '2px 3px' }}>
                          <div style={{ fontSize: 4, color: '#555' }}>OPHANIM</div>
                          <div style={{ fontSize: 5, fontWeight: 'bold', color: '#1a0e06' }}>Oblivion Shard</div>
                        </div>
                      )}
                      <div style={{ flex: 1 }} />
                      {opt.showBottom && (
                        <div style={{ background: 'rgba(234,220,200,0.92)', padding: '2px 3px' }}>
                          <div style={{ fontSize: 4, color: '#2a1a0e' }}>Draw 2 cards. +800 Oblivion.</div>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 8, color: isActive ? subMenuWarm.accentDeep : subMenuWarm.textMuted, textAlign: 'center', letterSpacing: 0.5, fontWeight: isActive ? 700 : 400 }}>
                      {opt.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Save Settings ── */}
          <SectionDivider />
          <SectionHeader icon="✎" label="Preferences" />

          {hasChanges && (
            <div style={{
              marginBottom: 10, padding: '8px 12px', borderRadius: 8,
              fontSize: 11, color: subMenuWarm.accent,
              border: `1px solid rgba(200,128,58,0.35)`,
              background: 'rgba(200,128,58,0.07)',
            }}>
              Unsaved changes — click <strong>Save Settings</strong> to apply.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button
              onClick={handleSaveSettings}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                border: `1px solid ${settingsSaved ? 'rgba(79,138,71,0.45)' : hasChanges ? subMenuWarm.borderStrong : subMenuWarm.border}`,
                background: settingsSaved ? 'rgba(79,138,71,0.12)' : hasChanges ? subMenuWarm.button : 'rgba(0,0,0,0.06)',
                color: settingsSaved ? subMenuWarm.success : hasChanges ? '#fff' : subMenuWarm.textMuted,
                fontSize: 13, cursor: hasChanges ? 'pointer' : 'default',
                fontFamily: 'Georgia, serif', letterSpacing: 1, transition: 'all 0.2s',
              }}
            >
              {settingsSaved ? '✓ Saved' : 'Save Settings'}
            </button>
            {hasChanges && (
              <button
                onClick={handleDiscardSettings}
                style={{
                  padding: '10px 16px', borderRadius: 10,
                  border: `1px solid ${subMenuWarm.border}`,
                  background: 'transparent',
                  color: subMenuWarm.textMuted, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                }}
              >
                Discard
              </button>
            )}
          </div>

          {/* ── Save Data ── */}
          <SectionDivider />
          <SectionHeader icon="💾" label="Save Data" />

          {saveTampered && (
            <div style={{
              marginBottom: 10, padding: '8px 12px', borderRadius: 8,
              fontSize: 11, color: subMenuWarm.danger,
              border: `1px solid rgba(184,92,79,0.35)`,
              background: 'rgba(184,92,79,0.07)',
            }}>
              Save integrity check failed — data may have been modified.
            </div>
          )}

          {importStatus && (
            <div style={{
              marginBottom: 10, padding: '8px 12px', borderRadius: 8,
              fontSize: 11,
              color: importStatus.kind === 'ok' ? subMenuWarm.success : subMenuWarm.danger,
              border: `1px solid ${importStatus.kind === 'ok' ? 'rgba(79,138,71,0.35)' : 'rgba(184,92,79,0.35)'}`,
              background: importStatus.kind === 'ok' ? 'rgba(79,138,71,0.07)' : 'rgba(184,92,79,0.07)',
            }}>
              {importStatus.msg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <button
              onClick={handleSaveGame}
              style={{
                padding: '9px 0', borderRadius: 10,
                border: `1px solid ${gameSaved ? 'rgba(79,138,71,0.45)' : subMenuWarm.borderStrong}`,
                background: gameSaved ? 'rgba(79,138,71,0.12)' : subMenuWarm.button,
                color: gameSaved ? subMenuWarm.success : '#fff',
                fontSize: 12, cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              {gameSaved ? '✓ Saved' : 'Save Game'}
            </button>
            <button
              onClick={handleExport}
              style={{
                padding: '9px 0', borderRadius: 10,
                border: `1px solid ${subMenuWarm.border}`,
                background: 'rgba(0,0,0,0.04)',
                color: subMenuWarm.text, fontSize: 12, cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              Export Save
            </button>
            <button
              onClick={handleImportClick}
              style={{
                padding: '9px 0', borderRadius: 10,
                border: `1px solid ${subMenuWarm.border}`,
                background: 'rgba(0,0,0,0.04)',
                color: subMenuWarm.text, fontSize: 12, cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              Import Save
            </button>
            <button
              onClick={() => {
                if (confirmDelete === 0) { setConfirmDelete(1); return; }
                if (confirmDelete === 1) { setConfirmDelete(2); return; }
                handleWipe();
              }}
              style={{
                padding: '9px 0', borderRadius: 10,
                border: `1px solid ${confirmDelete > 0 ? 'rgba(184,92,79,0.5)' : subMenuWarm.border}`,
                background: confirmDelete > 0 ? 'rgba(184,92,79,0.10)' : 'rgba(0,0,0,0.04)',
                color: confirmDelete > 0 ? subMenuWarm.danger : subMenuWarm.textMuted,
                fontSize: 12, cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              {confirmDelete === 0 ? 'Delete Save' : confirmDelete === 1 ? 'Are you sure?' : 'Click to Confirm'}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".pansave,.json,.txt" style={{ display: 'none' }} onChange={handleImportFile} />

          {/* ── Controls ── */}
          <SectionDivider />
          <ControlsSection />
        </div>

        {/* Footer close button */}
        <div style={{ padding: '12px 28px', borderTop: `1px solid ${subMenuWarm.border}`, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '9px 0', borderRadius: 10,
              border: `1px solid ${subMenuWarm.border}`,
              background: 'rgba(0,0,0,0.04)',
              color: subMenuWarm.textMuted, fontSize: 12, cursor: 'pointer',
              fontFamily: 'Georgia, serif',
            }}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
    }}>
      <span style={{
        fontSize: 11, color: subMenuWarm.accentSoft,
        background: 'rgba(200,128,58,0.1)', padding: '2px 6px',
        borderRadius: 5, border: `1px solid rgba(200,128,58,0.18)`,
      }}>{icon}</span>
      <span style={{
        fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
        fontWeight: 700, color: subMenuWarm.accentDeep,
      }}>{label}</span>
    </div>
  );
}

function SectionDivider() {
  return <div style={{ borderTop: `1px solid ${subMenuWarm.border}`, margin: '16px 0 18px' }} />;
}

function VolumeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: subMenuWarm.text }}>{label}</span>
        <span style={{
          fontSize: 11, color: subMenuWarm.accentSoft, fontWeight: 600,
          background: 'rgba(200,128,58,0.08)', padding: '1px 7px',
          borderRadius: 5, border: `1px solid rgba(200,128,58,0.18)`,
        }}>{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: subMenuWarm.accent }}
      />
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: subMenuWarm.text,
      cursor: 'pointer', padding: '4px 0',
    }}>
      <input
        type="checkbox" checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: subMenuWarm.accent, width: 14, height: 14 }}
      />
      {label}
    </label>
  );
}

function SelectRow({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: subMenuWarm.text }}>
      <span style={{ fontSize: 11, color: subMenuWarm.textMuted }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          border: `1px solid ${subMenuWarm.borderStrong}`,
          borderRadius: 8,
          background: 'rgba(255,252,244,0.9)',
          color: subMenuWarm.text,
          fontFamily: 'Georgia, serif',
          padding: '6px 8px',
          fontSize: 12,
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
