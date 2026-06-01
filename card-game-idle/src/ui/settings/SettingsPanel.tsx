import { useEffect, useMemo, useState } from 'react';
import { useStore, selectSettings, selectProfile, selectProgress } from '@/state/store';
import { type UiPalette } from '@/ui/theme';
import { DEFAULT_UI_THEME_ID, getEffectiveThemePalette, isThemeOscillating } from '@/data/profile/uiThemes';
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

export default function SettingsPanel({ onClose }: Props) {
  const settings = useStore(selectSettings);
  const profile = useStore(selectProfile);
  const progress = useStore(selectProgress);
  const updateSettings = useStore(s => s.updateSettings);
  const [themeNowMs, setThemeNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const themeId = profile.uiThemeId || DEFAULT_UI_THEME_ID;
    if (!isThemeOscillating(themeId)) return;
    const id = setInterval(() => setThemeNowMs(Date.now()), 180);
    return () => clearInterval(id);
  }, [profile.uiThemeId]);

  const theme = useMemo<UiPalette>(() => {
    return getEffectiveThemePalette(
      profile.uiThemeId || DEFAULT_UI_THEME_ID,
      profile.customUiTheme,
      progress,
      themeNowMs,
    );
  }, [profile.uiThemeId, profile.customUiTheme, progress, themeNowMs]);

  const [draft, setDraft] = useState<Partial<SettingsState>>(() => ({ ...settings }));
  const patchDraft = (patch: Partial<SettingsState>) => setDraft(prev => ({ ...prev, ...patch }));

  const hasChanges = (Object.keys(draft) as (keyof SettingsState)[]).some(
    k => (draft as any)[k] !== (settings as any)[k],
  );

  const [settingsSaved, setSettingsSaved] = useState(false);

  function handleSaveSettings() {
    updateSettings(draft);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  function handleDiscardSettings() {
    setDraft({ ...settings });
  }

  const toolbarPrimaryButton: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: 10,
    border: `1px solid ${theme.borderStrong}`,
    background: theme.button,
    color: theme.text,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  const toolbarGhostButton: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 10,
    border: `1px solid ${theme.border}`,
    background: theme.surfaceMuted,
    color: theme.text,
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  const toolbarCloseButton: React.CSSProperties = {
    ...toolbarGhostButton,
    background: 'rgba(184,92,79,0.15)',
    border: '1px solid rgba(184,92,79,0.45)',
    color: '#ffd5cf',
  };

  const actionPrimaryButton: React.CSSProperties = {
    padding: '9px 14px',
    borderRadius: 10,
    border: `1px solid ${theme.borderStrong}`,
    background: theme.button,
    color: theme.text,
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 700,
  };

  const actionGhostButton: React.CSSProperties = {
    padding: '9px 14px',
    borderRadius: 10,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.text,
    fontSize: 12,
    cursor: 'pointer',
  };

  return (
    <div
      className="ui-panel-intro"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        pointerEvents: 'auto',
        overflow: 'hidden',
        fontFamily: 'Georgia, "Iowan Old Style", "Cambria", serif',
        background: theme.appBackground,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)', pointerEvents: 'none' }} />

      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <header style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '18px clamp(18px, 2.8vw, 40px) 14px',
          borderBottom: `1px solid ${theme.borderStrong}`,
          background: theme.surface,
          boxShadow: theme.shadow,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: `1px solid ${theme.borderStrong}`,
              background: theme.surfaceMuted,
              boxShadow: theme.glow,
              flexShrink: 0,
            }} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 'clamp(19px, 2.2vw, 30px)',
                lineHeight: 1.1,
                letterSpacing: 3,
                color: theme.text,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {t('settingsTitle')}
              </div>
              <div style={{
                fontSize: 10,
                letterSpacing: 1.2,
                color: theme.textMuted,
                marginTop: 4,
              }}>
                Full control over gameplay and interface preferences.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {hasChanges && (
              <button onClick={handleDiscardSettings} style={toolbarGhostButton}>Discard</button>
            )}
            <button onClick={handleSaveSettings} style={{
              ...toolbarPrimaryButton,
              opacity: hasChanges ? 1 : 0.62,
            }}>
              {settingsSaved ? 'Saved' : 'Save Settings'}
            </button>
            <button onClick={onClose} style={toolbarCloseButton}>{t('close')}</button>
          </div>
        </header>

        {(hasChanges || settingsSaved) && (
          <div style={{
            flexShrink: 0,
            padding: '10px clamp(18px, 2.8vw, 40px)',
            borderBottom: `1px solid ${theme.border}`,
            background: theme.surfaceMuted,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            {hasChanges && <StatusPill kind="warn" palette={theme}>Unsaved changes are pending</StatusPill>}
            {settingsSaved && <StatusPill kind="ok" palette={theme}>Settings updated</StatusPill>}
          </div>
        )}

        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'clamp(16px, 2vw, 26px) clamp(14px, 2.6vw, 34px) clamp(20px, 2.8vw, 34px)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 14,
            alignItems: 'start',
          }}>
            <PanelCard title={t('gameplaySettings')} subtitle="Audio and gameplay comfort" palette={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <VolumeSlider
                  label={t('musicVolume')}
                  value={Math.round((draft.musicVolume ?? settings.musicVolume) * 100)}
                  onChange={v => patchDraft({ musicVolume: v / 100 })}
                  palette={theme}
                />
                <VolumeSlider
                  label={t('sfxVolume')}
                  value={Math.round((draft.sfxVolume ?? settings.sfxVolume) * 100)}
                  onChange={v => patchDraft({ sfxVolume: v / 100 })}
                  palette={theme}
                />
              </div>

              <div style={{
                marginTop: 14,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '8px 14px',
              }}>
                <CheckRow
                  label={t('musicEnabled')}
                  checked={(draft.musicVolume ?? settings.musicVolume) > 0}
                  onChange={on => patchDraft({ musicVolume: on ? Math.max(draft.musicVolume ?? settings.musicVolume, 0.45) : 0 })}
                  palette={theme}
                />
                <CheckRow
                  label={t('particlesEnabled')}
                  checked={draft.particlesEnabled ?? settings.particlesEnabled}
                  onChange={on => patchDraft({ particlesEnabled: on })}
                  palette={theme}
                />
                <CheckRow
                  label={t('reducedMotion')}
                  checked={draft.reducedMotion ?? settings.reducedMotion}
                  onChange={on => patchDraft({ reducedMotion: on })}
                  palette={theme}
                />
                <CheckRow
                  label="Compact UI mode"
                  checked={!!(draft.compactMode ?? settings.compactMode)}
                  onChange={on => patchDraft({ compactMode: on })}
                  palette={theme}
                />
                <CheckRow
                  label="Highlight keywords"
                  checked={(draft.highlightRulesText ?? settings.highlightRulesText) !== false}
                  onChange={on => patchDraft({ highlightRulesText: on })}
                  palette={theme}
                />
              </div>
            </PanelCard>

            <PanelCard title="Preferences" subtitle="Language and text scale" palette={theme}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: 12,
              }}>
                <SelectRow
                  label={t('fontSizePreset')}
                  value={draft.fontSizePreset ?? settings.fontSizePreset}
                  options={FONT_SIZE_OPTIONS}
                  onChange={v => patchDraft({ fontSizePreset: v as typeof settings.fontSizePreset })}
                  palette={theme}
                />
                <SelectRow
                  label={t('language')}
                  value={draft.language ?? settings.language}
                  options={LANGUAGE_OPTIONS}
                  onChange={v => patchDraft({ language: v as typeof settings.language })}
                  palette={theme}
                />
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={handleSaveSettings} style={actionPrimaryButton}>
                  {settingsSaved ? 'Saved' : 'Save Settings'}
                </button>
                {hasChanges && (
                  <button onClick={handleDiscardSettings} style={actionGhostButton}>Discard</button>
                )}
              </div>
            </PanelCard>

            <PanelCard title="Card Art Display" subtitle="Choose how card details render" palette={theme}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 10,
              }}>
                {(
                  [
                    { value: 'both',        label: 'Both',      showTop: true,  showBottom: true },
                    { value: 'top-only',    label: 'Name',      showTop: true,  showBottom: false },
                    { value: 'bottom-only', label: 'Effects',   showTop: false, showBottom: true },
                    { value: 'art-only',    label: 'Full Art',  showTop: false, showBottom: false },
                  ] as const
                ).map(opt => {
                  const isActive = (draft.cardArtDisplay ?? settings.cardArtDisplay) === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => patchDraft({ cardArtDisplay: opt.value })}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 8px',
                        borderRadius: 11,
                        cursor: 'pointer',
                        border: `1px solid ${isActive ? theme.borderStrong : theme.border}`,
                        background: isActive ? theme.surfaceMuted : theme.surface,
                        boxShadow: isActive ? theme.glow : 'none',
                      }}
                    >
                      <div style={{
                        width: 48,
                        height: 66,
                        borderRadius: 7,
                        overflow: 'hidden',
                        background: 'linear-gradient(160deg, #302747 0%, #1f2f49 50%, #28402e 100%)',
                        boxShadow: `0 0 0 ${isActive ? `1.5px ${theme.accent}` : '1px rgba(0,0,0,0.28)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
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
                      <div style={{
                        fontSize: 10,
                        letterSpacing: 0.6,
                        color: isActive ? theme.text : theme.textMuted,
                        fontWeight: isActive ? 700 : 500,
                      }}>
                        {opt.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </PanelCard>

            <PanelCard title="Controls" subtitle="Keyboard bindings" wide palette={theme}>
              <ControlsSection />
            </PanelCard>
          </div>
        </main>
      </div>
    </div>
  );
}

function PanelCard({
  title,
  subtitle,
  wide,
  palette,
  children,
}: {
  title: string;
  subtitle?: string;
  wide?: boolean;
  palette: UiPalette;
  children: React.ReactNode;
}) {
  return (
    <section style={{
      border: `1px solid ${palette.borderStrong}`,
      borderRadius: 14,
      background: palette.surfaceStrong,
      boxShadow: `${palette.shadow}, inset 0 1px 0 ${palette.surfaceMuted}`,
      padding: '14px 14px 16px',
      gridColumn: wide ? '1 / -1' : 'auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 10,
        paddingBottom: 10,
        marginBottom: 12,
        borderBottom: `1px solid ${palette.border}`,
      }}>
        <div style={{
          fontSize: 11,
          letterSpacing: 2.2,
          textTransform: 'uppercase',
          fontWeight: 700,
          color: palette.text,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 10, color: palette.textMuted, textAlign: 'right' }}>{subtitle}</div>
        )}
      </div>
      {children}
    </section>
  );
}

function StatusPill({ kind, palette, children }: { kind: 'ok' | 'warn' | 'err'; palette: UiPalette; children: React.ReactNode }) {
  const color = kind === 'ok'
    ? palette.success
    : kind === 'err'
      ? palette.danger
      : palette.accent;
  const bg = kind === 'ok'
    ? 'rgba(79,138,71,0.12)'
    : kind === 'err'
      ? 'rgba(184,92,79,0.12)'
      : 'rgba(200,128,58,0.12)';
  return (
    <div style={{
      padding: '6px 10px',
      borderRadius: 999,
      border: `1px solid ${color}66`,
      background: bg,
      color,
      fontSize: 11,
      lineHeight: 1.2,
      maxWidth: '100%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      {children}
    </div>
  );
}

function VolumeSlider({ label, value, onChange, palette }: { label: string; value: number; onChange: (v: number) => void; palette: UiPalette }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: palette.text }}>{label}</span>
        <span style={{
          fontSize: 11, color: palette.textSoft, fontWeight: 600,
          background: palette.surfaceMuted, padding: '1px 7px',
          borderRadius: 5, border: `1px solid ${palette.border}`,
        }}>{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: palette.accent }}
      />
    </div>
  );
}

function CheckRow({ label, checked, onChange, palette }: { label: string; checked: boolean; onChange: (v: boolean) => void; palette: UiPalette }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: palette.text,
      cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
      border: `1px solid ${palette.border}`,
      background: palette.surface,
    }}>
      <input
        type="checkbox" checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: palette.accent, width: 14, height: 14 }}
      />
      {label}
    </label>
  );
}

function SelectRow({ label, value, options, onChange, palette }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  palette: UiPalette;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: palette.text }}>
      <span style={{ fontSize: 11, color: palette.textMuted }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          border: `1px solid ${palette.borderStrong}`,
          borderRadius: 8,
          background: palette.surface,
          color: palette.text,
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
