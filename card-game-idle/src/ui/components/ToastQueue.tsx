import { useEffect } from 'react';
import { useStore } from '@/state/store';
import type { ToastEntry } from '@/types/game';

const EMPTY_TOASTS: ToastEntry[] = [];

const KIND_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  info:    { bg: 'rgba(28, 22, 16, 0.92)', border: 'rgba(218, 167, 109, 0.55)', text: '#f1c486' },
  success: { bg: 'rgba(20, 30, 18, 0.92)', border: 'rgba(120, 200, 110, 0.6)',  text: '#b9e7a0' },
  warning: { bg: 'rgba(40, 20, 12, 0.92)', border: 'rgba(255, 140, 100, 0.6)',  text: '#ffc89a' },
  reward:  { bg: 'rgba(34, 24, 12, 0.94)', border: 'rgba(255, 196, 100, 0.8)',  text: '#ffe2a0' },
};

/**
 * Renders the in-memory toast queue. Auto-dismisses each toast after its
 * configured duration (default 3.5s). Mounted once at the App root.
 */
export default function ToastQueue() {
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
        const palette = KIND_COLORS[t.kind ?? 'info'] ?? KIND_COLORS.info;
        return (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              padding: '10px 14px',
              borderRadius: 8,
              background: palette.bg,
              border: `1px solid ${palette.border}`,
              color: palette.text,
              fontSize: 12,
              lineHeight: 1.4,
              boxShadow: '0 6px 22px rgba(0,0,0,0.45)',
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
