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
        const isReward = t.kind === 'reward';
        const isEnigmaToast = isReward && /enigma/i.test(t.message);
        const isEnigmaStepToast = isEnigmaToast && /^Enigma Step Complete:/i.test(t.message);
        return (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className={isEnigmaToast ? 'enigma-acquisition-toast' : undefined}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              padding: isEnigmaStepToast ? '13px 18px' : '10px 14px',
              borderRadius: 8,
              background: isEnigmaToast
                ? 'linear-gradient(135deg, rgba(98, 69, 12, 0.96) 0%, rgba(180, 141, 42, 0.94) 45%, rgba(252, 239, 174, 0.98) 100%)'
                : warmTheme.surfaceStrong,
              border: isEnigmaToast ? '1px solid rgba(255, 238, 171, 0.9)' : `1px solid ${accent}`,
              color: isEnigmaToast ? '#1a1003' : warmTheme.text,
              fontSize: isEnigmaStepToast ? 13 : 12,
              fontWeight: isEnigmaStepToast ? 700 : 500,
              lineHeight: 1.4,
              boxShadow: isEnigmaToast
                ? '0 18px 32px rgba(0,0,0,0.38), 0 0 0 1px rgba(255, 241, 190, 0.45) inset, 0 0 24px rgba(255, 219, 111, 0.28)'
                : `${warmTheme.shadow}, 0 0 0 1px ${accent}33 inset`,
              animation: isEnigmaToast ? 'toastSlideIn 0.32s cubic-bezier(.16,.84,.44,1), enigmaToastShimmer 3.8s ease-in-out infinite' : 'toastSlideIn 0.32s cubic-bezier(.16,.84,.44,1)',
            }}
          >
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
