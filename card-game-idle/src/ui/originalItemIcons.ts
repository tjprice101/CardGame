// Bump when restored original item art replaces an older processed file so browsers refetch it.
export const ORIGINAL_ITEM_ICON_VERSION = 'opaque-originals-2026-10-04';

export function originalItemIconUrl(path: string): string {
  return `${import.meta.env.BASE_URL}assets/${path}?v=${ORIGINAL_ITEM_ICON_VERSION}`;
}
