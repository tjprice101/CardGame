const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function formatNumber(n: number): string {
  if (n < 1000) return Math.floor(n).toString();
  const tier = Math.floor(Math.log10(n) / 3);
  const capped = Math.min(tier, SUFFIXES.length - 1);
  const scaled = n / Math.pow(1000, capped);
  return `${scaled.toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2)}${SUFFIXES[capped]}`;
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
