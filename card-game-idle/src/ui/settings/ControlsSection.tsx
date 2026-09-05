import { useState } from 'react';
import { warmTheme } from '@/ui/theme';
import { useStore, selectSettings } from '@/state/store';
import { DEFAULT_CONTROL_BINDINGS, type KeybindActionId } from '@/types/game';

const C = {
  text: `var(--profile-text, ${warmTheme.text})`,
  textMuted: `var(--profile-text-muted, ${warmTheme.textMuted})`,
  textSoft: `var(--profile-text-soft, ${warmTheme.textSoft})`,
  border: `var(--profile-border, ${warmTheme.border})`,
  borderStrong: `var(--profile-border-strong, ${warmTheme.borderStrong})`,
  accent: `var(--profile-accent, ${warmTheme.accent})`,
  accentDeep: `var(--profile-accent-deep, ${warmTheme.accentDeep})`,
  surface: `var(--profile-surface, ${warmTheme.surface})`,
  surfaceMuted: `var(--profile-surface-muted, ${warmTheme.surfaceMuted})`,
  button: `var(--profile-button, ${warmTheme.button})`,
  buttonText: `var(--profile-button-text, ${warmTheme.text})`,
} as const;

/**
 * Settings section that lets the player rebind the handful of in-game
 * keyboard shortcuts. Captures KeyboardEvent.code values so the binding is
 * layout-independent. Designed to be slotted between the Gameplay and Save
 * Data sections of `SettingsPanel`.
 */
export default function ControlsSection() {
  const settings = useStore(selectSettings);
  const updateSettings = useStore(s => s.updateSettings);
  const [capturing, setCapturing] = useState<KeybindActionId | null>(null);

  const bindings: Record<KeybindActionId, string> = {
    ...DEFAULT_CONTROL_BINDINGS,
    ...(settings.controls ?? {}),
  };

  const actions: Array<{ id: KeybindActionId; label: string; hint: string }> = [
    { id: 'swapExtraDeck', label: 'Swap Hand <-> Extra Deck', hint: 'View your Extra Deck in the hand slot.' },
    { id: 'openTutorial',  label: 'Open Tutorial',          hint: 'Show the in-game tutorial overlay.' },
    { id: 'closeOverlay',  label: 'Close Overlay',          hint: 'Dismiss the topmost modal.' },
    { id: 'toggleRadioUi', label: 'Toggle Radio UI',        hint: 'Show or hide on-screen radio controls/toasts.' },
    { id: 'togglePartyUi', label: 'Toggle Party UI',        hint: 'Show or hide the Card-bound Co-op overlay.' },
    { id: 'activateSetAbility1', label: 'Set Ability — Slot 1', hint: 'Activate your Base set ability (Composed Draw).' },
    { id: 'activateSetAbility2', label: 'Set Ability — Slot 2', hint: 'Activate your Eternal set ability (Vigil\'s Ledger).' },
    { id: 'activateSetAbility3', label: 'Set Ability — Slot 3', hint: 'Activate your third set ability.' },
  ];

  function beginCapture(id: KeybindActionId) {
    setCapturing(id);
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Tab') return; // let focus management run
      e.preventDefault();
      e.stopPropagation();
      // Allow Escape to cancel rebinding (but still permit binding to Escape via second press)
      if (e.code === 'Escape' && capturing !== 'closeOverlay') {
        cleanup();
        setCapturing(null);
        return;
      }
      updateSettings({
        controls: { ...bindings, [id]: e.code },
      });
      cleanup();
      setCapturing(null);
    }
    function cleanup() {
      window.removeEventListener('keydown', onKey, true);
    }
    window.addEventListener('keydown', onKey, true);
  }

  function resetDefaults() {
    updateSettings({ controls: { ...DEFAULT_CONTROL_BINDINGS } });
  }

  return (
    <div>
      <div style={{
        fontSize: 9,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: C.textMuted,
        marginBottom: 12,
      }}>
        Controls
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map(action => {
          const isCapturing = capturing === action.id;
          return (
            <div key={action.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, padding: '8px 10px', borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.surface,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>
                  {action.label}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                  {action.hint}
                </div>
              </div>
              <button
                className="menu-tactile-btn"
                onClick={() => beginCapture(action.id)}
                style={{
                  minWidth: 96,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: `1px solid ${isCapturing ? C.accent : C.borderStrong}`,
                  background: isCapturing ? C.surfaceMuted : C.button,
                  color: isCapturing ? C.accentDeep : C.buttonText,
                  fontFamily: 'Georgia, serif',
                  fontSize: 11,
                  letterSpacing: 1,
                  cursor: 'pointer',
                }}
              >
                {isCapturing ? 'Press a key...' : bindings[action.id]}
              </button>
            </div>
          );
        })}
      </div>
      <button
        className="menu-tactile-btn"
        onClick={resetDefaults}
        style={{
          marginTop: 10,
          padding: '6px 10px',
          borderRadius: 6,
          border: `1px solid ${C.border}`,
          background: 'transparent',
          color: C.textSoft,
          fontFamily: 'Georgia, serif',
          fontSize: 11,
          letterSpacing: 0.6,
          cursor: 'pointer',
        }}
      >
        Reset to defaults
      </button>
    </div>
  );
}
