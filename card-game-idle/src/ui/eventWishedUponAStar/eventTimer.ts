export const WUAS_EVENT_ENDS_LABEL = 'June 28, 2026 at 8:00 PM EST';
export const WUAS_EVENT_ENDS_AT_MS = new Date('2026-06-28T20:00:00-05:00').getTime();

export interface EventCountdownParts {
  ended: boolean;
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getWuasEventCountdown(nowMs: number = Date.now()): EventCountdownParts {
  const totalMs = Math.max(0, WUAS_EVENT_ENDS_AT_MS - nowMs);
  const ended = totalMs <= 0;
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { ended, totalMs, days, hours, minutes, seconds };
}

export function formatCountdown(parts: EventCountdownParts): string {
  if (parts.ended) return 'Event has ended';
  const hh = String(parts.hours).padStart(2, '0');
  const mm = String(parts.minutes).padStart(2, '0');
  const ss = String(parts.seconds).padStart(2, '0');
  return `${parts.days}d ${hh}:${mm}:${ss}`;
}
