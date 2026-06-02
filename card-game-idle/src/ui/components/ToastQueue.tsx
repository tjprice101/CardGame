import { useEffect } from 'react';
import { useStore } from '@/state/store';
import type { ToastEntry } from '@/types/game';
import { warmTheme } from '@/ui/theme';
import { useThemeVersion } from '@/ui/useThemeVersion';

const EMPTY_TOASTS: ToastEntry[] = [];

/**
 * Renders the in-memory toast queue. Auto-dismisses each toast after its
 * configured duration (default 3.5s). Mounted once at the App root.
 */
export default function ToastQueue() {
  useThemeVersion();
  const toasts = useStore(s => s.toasts ?? EMPTY_TOASTS);
  const dismissToast = useStore(s => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map(t => {
      const d = t.durationMs ?? 3500;
      return window.setTimeout(() => dismissToast(t.id), d);
    });
    return () => { timers.forEach(id => window.clearTimeout(id)); };
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 9999,
        pointerEvents: 'none',
        maxWidth: 360,
        fontFamily: 'Georgia, serif',
      }}
    >
      {toasts.map(t => {
        const accent = (
          t.kind === 'success' ? warmTheme.success
          : t.kind === 'warning' ? warmTheme.danger
          : t.kind === 'reward' ? warmTheme.accentSoft
          : warmTheme.accent
        );
        return (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              padding: '10px 14px',
              borderRadius: 8,
              background: warmTheme.surfaceStrong,
              border: `1px solid ${accent}`,
              color: warmTheme.text,
              fontSize: 12,
              lineHeight: 1.4,
              boxShadow: `${warmTheme.shadow}, 0 0 0 1px ${accent}33 inset`,
              animation: 'toastSlideIn 0.32s cubic-bezier(.16,.84,.44,1)',
            }}
          >
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
