import type { GeoKind } from '@uaetrail/shared-types';
import { geoKindLabel } from './geoKindLabel';

const GEO_HEADER_EMOJI: Record<GeoKind, string> = {
  country: '🌍',
  state: '🗺️',
  area: '🗺️',
  venue: '📍',
};

/** Root geo tree (`/geo`) — not a catalog country node. */
export const GEO_TREE_HEADER_CHROME = { emoji: '🗺️', label: 'Places' } as const;

/** Center chrome on public geo hub pages (`/geo/*`). */
export const resolveGeoConsumerDetailHeaderChrome = (
  kind: GeoKind | null | undefined
): { emoji: string; label: string } => {
  const resolved = kind ?? 'area';
  return {
    emoji: GEO_HEADER_EMOJI[resolved] ?? '🗺️',
    label: geoKindLabel(resolved),
  };
};
