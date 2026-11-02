import {
  resolveMapPinEmoji,
  type ExploreActivityMode,
  type DiscoveryCardKind,
  type PlaceKind,
} from '@uaetrail/shared-types';
import type { MapPinKind, MapPinSource } from '../components/ui/mapPinTypes';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { buildVenueMapBadgeHtml } from './venueMapGlyphs';

export const isCatalogVenueMapPin = (kind: MapPinKind, source: MapPinSource): boolean =>
  isGeographyMapSource(source) && (kind === 'hiking' || kind === 'camping');

const venueStackCountBadgeHtml = (stackCount: number): string => {
  if (stackCount <= 1) return '';
  const countLabel = stackCount > 99 ? '99+' : String(stackCount);
  return `<span class="uaetrail-map-cluster-badge" aria-hidden="true">${countLabel}</span>`;
};

/** Short place name beside the icon (regional zoom). */
export const VENUE_MAP_LABEL_MIN_ZOOM = 9;
/** Full name without truncation. */
export const VENUE_MAP_FULL_LABEL_MIN_ZOOM = 11;

export const venueMapLabelForZoom = (
  label: string,
  mapZoom: number
): { show: boolean; text: string } => {
  const trimmed = label.trim();
  if (!trimmed || mapZoom < VENUE_MAP_LABEL_MIN_ZOOM) {
    return { show: false, text: '' };
  }
  if (mapZoom >= VENUE_MAP_FULL_LABEL_MIN_ZOOM) {
    return { show: true, text: trimmed };
  }
  const short = trimmed.length > 22 ? `${trimmed.slice(0, 20)}…` : trimmed;
  return { show: true, text: short };
};

const escapeMapPinHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export type VenueMapPinLayout = {
  html: string;
  width: number;
  height: number;
  iconAnchor: [number, number];
};

/** Map chip: square badge + optional name (reads on satellite tiles). */
export const buildVenueMapPinHtml = (options: {
  kind: MapPinKind;
  label?: string;
  mapZoom: number;
  selected?: boolean;
  stackCount?: number;
}): VenueMapPinLayout => {
  const selectedClass = options.selected ? ' uaetrail-map-venue-pin--selected' : '';
  const stackCount = options.stackCount ?? 1;
  const clusterClass = stackCount > 1 ? ' uaetrail-map-venue-chip--cluster' : '';
  const badgeSize = options.mapZoom < VENUE_MAP_LABEL_MIN_ZOOM ? 40 : 36;
  const glyphSize = options.mapZoom < VENUE_MAP_LABEL_MIN_ZOOM ? 24 : 22;
  const badgeHtml = buildVenueMapBadgeHtml(options.kind, glyphSize);
  const { show, text } = venueMapLabelForZoom(options.label ?? '', options.mapZoom);
  const labelHtml = show
    ? `<span class="uaetrail-map-venue-pin-label">${escapeMapPinHtml(text)}</span>`
    : '';

  const chipClass = show ? ' uaetrail-map-venue-chip--labeled' : '';
  const countBadge = venueStackCountBadgeHtml(stackCount);
  const html = `<span class="uaetrail-map-venue-chip${chipClass}${clusterClass}${selectedClass}">${badgeHtml}${labelHtml}${countBadge}</span>`;

  const width = show ? Math.min(200, badgeSize + text.length * 6.2 + 14) : badgeSize;
  const height = badgeSize;
  const iconAnchor: [number, number] = [badgeSize / 2, badgeSize];

  return { html, width: Math.max(width, badgeSize), height, iconAnchor };
};

/** Inline emoji markup for Leaflet divIcon pins. */
export const resolveMapPinIconHtml = (
  kind: MapPinKind,
  source: MapPinSource = 'activity',
  fontSizePx = 18,
  placeKind?: PlaceKind,
  seeking?: boolean
): string => {
  const emoji = resolveMapPinEmoji(kind as DiscoveryCardKind, source, undefined, placeKind, seeking);
  return `<span class="uaetrail-map-pin-emoji font-emoji" style="font-size:${fontSizePx}px" aria-hidden="true">${emoji}</span>`;
};

/** @deprecated Use resolveMapPinIconHtml — kept for callers migrating off SVG. */
export const resolveMapPinIconSvg = (
  kind: MapPinKind,
  source: MapPinSource = 'activity',
  _color: string,
  fontSizePx: number
): string => resolveMapPinIconHtml(kind, source, fontSizePx);

export type MapPinFaceOptions = {
  kind: MapPinKind;
  source: MapPinSource;
  ringColor: string;
  size: number;
  fontSizePx: number;
  ringWidth: number;
  selected?: boolean;
  stackCount?: number;
  exploreItemId?: string;
  positionStyle?: string;
  /** Time-bound activity pins — corner badge (hosted vs seeking). */
  activityMode?: ExploreActivityMode | null;
  placeKind?: PlaceKind;
};

/** One map circle — optional count badge and click target id. */
export const buildMapPinFaceHtml = ({
  kind,
  source,
  ringColor,
  size,
  fontSizePx,
  ringWidth: _ringWidth,
  selected = false,
  stackCount = 0,
  exploreItemId,
  positionStyle = '',
  activityMode = null,
  placeKind,
}: MapPinFaceOptions): string => {
  const selectedClass = selected ? ' uaetrail-map-pin-marker--selected' : '';
  const iconHtml = resolveMapPinIconHtml(
    kind,
    source,
    fontSizePx,
    placeKind,
    activityMode === 'seeking'
  );
  const dataAttr = exploreItemId ? ` data-explore-item-id="${exploreItemId}"` : '';
  const countBadge = venueStackCountBadgeHtml(stackCount);

  void _ringWidth;
  const markerDataAttr = exploreItemId ? ` data-explore-item-id="${exploreItemId}"` : '';
  const markerHtml = `<span class="uaetrail-map-pin-marker${selectedClass}"${markerDataAttr} style="--pin-ring:${ringColor};width:${size}px;height:${size}px;"><span class="uaetrail-map-pin-face"><span class="uaetrail-map-pin-icon">${iconHtml}</span></span>${countBadge}</span>`;

  if (positionStyle) {
    return `<span class="uaetrail-map-pin-slot" style="${positionStyle}"${dataAttr}>${markerHtml}</span>`;
  }

  if (exploreItemId) {
    return `<span${dataAttr}>${markerHtml}</span>`;
  }

  return markerHtml;
};

export type ColocatedPinIconEntry = {
  kind: MapPinKind;
  source: MapPinSource;
  ringColor: string;
  exploreItemId: string;
  stackCount: number;
  selected?: boolean;
  activityMode?: ExploreActivityMode | null;
};

const buildVenueColocatedChipSlotHtml = (options: {
  kind: MapPinKind;
  size: number;
  selected?: boolean;
  stackCount?: number;
  exploreItemId?: string;
  positionStyle: string;
}): string => {
  const glyphSize = Math.round(options.size * 0.58);
  const badgeHtml = buildVenueMapBadgeHtml(options.kind, glyphSize);
  const selectedClass = options.selected ? ' uaetrail-map-venue-pin--selected' : '';
  const countBadge = venueStackCountBadgeHtml(options.stackCount ?? 1);
  const dataAttr = options.exploreItemId ? ` data-explore-item-id="${options.exploreItemId}"` : '';
  const chip = `<span class="uaetrail-map-venue-chip uaetrail-map-venue-chip--colocated${selectedClass}">${badgeHtml}${countBadge}</span>`;
  return `<span class="uaetrail-map-pin-slot uaetrail-map-venue-pin-wrap" style="${options.positionStyle}"${dataAttr}>${chip}</span>`;
};

export const colocatedPinCanvasMetrics = (entryCount: number) => {
  const n = Math.max(1, entryCount);
  const faceSize = 32;
  const orbit = n <= 2 ? 26 : 30;
  const canvas = n <= 2 ? 76 : 88;
  const center = canvas / 2;
  return { n, faceSize, orbit, canvas, center };
};

/** Pick the fan slot nearest the pointer (cluster / colocated marker clicks). */
export const resolveColocatedExploreItemIdFromPointer = (
  entries: Array<{ exploreItemId: string }>,
  pointerX: number,
  pointerY: number,
  iconWidth: number,
  iconHeight: number
): string | null => {
  if (entries.length === 0) return null;
  const { orbit, n } = colocatedPinCanvasMetrics(entries.length);
  const cx = pointerX - iconWidth / 2;
  const cy = pointerY - iconHeight / 2;
  let bestId = entries[0]!.exploreItemId;
  let bestDist = Infinity;
  for (let index = 0; index < n; index += 1) {
    const angle = (2 * Math.PI * index) / n - Math.PI / 2;
    const sx = orbit * Math.cos(angle);
    const sy = orbit * Math.sin(angle);
    const dist = (cx - sx) ** 2 + (cy - sy) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestId = entries[index]!.exploreItemId;
    }
  }
  return bestId;
};

/** Fan at one lat/lng — venue catalog chips; activities/shops use emoji circles. */
export const buildMapColocatedPinIconHtml = (
  entries: ColocatedPinIconEntry[]
): { html: string; size: number } => {
  const { n, faceSize, orbit, canvas, center } = colocatedPinCanvasMetrics(entries.length);
  const ringWidth = 2.5;
  const fontSizePx = 17;

  const slots = entries
    .map((entry, index) => {
      const angle = (2 * Math.PI * index) / n - Math.PI / 2;
      const x = center + orbit * Math.cos(angle) - faceSize / 2;
      const y = center + orbit * Math.sin(angle) - faceSize / 2;
      const positionStyle = `left:${x}px;top:${y}px;width:${faceSize}px;height:${faceSize}px`;

      if (isCatalogVenueMapPin(entry.kind, entry.source)) {
        return buildVenueColocatedChipSlotHtml({
          kind: entry.kind,
          size: faceSize,
          selected: entry.selected,
          stackCount: entry.stackCount,
          exploreItemId: entry.exploreItemId,
          positionStyle,
        });
      }

      return buildMapPinFaceHtml({
        kind: entry.kind,
        source: entry.source,
        ringColor: entry.ringColor,
        size: faceSize,
        fontSizePx,
        ringWidth,
        selected: entry.selected,
        stackCount: entry.stackCount,
        exploreItemId: entry.exploreItemId,
        positionStyle,
        activityMode: entry.activityMode ?? null,
      });
    })
    .join('');

  return {
    html: `<span class="uaetrail-map-pin-multi" style="width:${canvas}px;height:${canvas}px">${slots}</span>`,
    size: canvas,
  };
};

export const resolveDominantMapPinKind = (kinds: MapPinKind[]): MapPinKind => {
  if (kinds.length === 0) return 'event';
  const counts = new Map<MapPinKind, number>();
  for (const kind of kinds) {
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  let dominant: MapPinKind = kinds[0]!;
  let max = 0;
  for (const [kind, count] of counts) {
    if (count > max) {
      dominant = kind;
      max = count;
    }
  }
  return dominant;
};

export const resolveDominantMapPinSource = (
  pins: Array<{ activityType: MapPinKind; source?: MapPinSource; id: string }>,
  resolveSource: (pin: { id: string; source?: MapPinSource }) => MapPinSource
): MapPinSource => {
  if (pins.length === 0) return 'activity';
  const counts = new Map<MapPinSource, number>();
  for (const pin of pins) {
    const source = resolveSource(pin);
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }
  let dominant: MapPinSource = resolveSource(pins[0]!);
  let max = 0;
  for (const [source, count] of counts) {
    if (count > max) {
      dominant = source;
      max = count;
    }
  }
  return dominant;
};

/** Clustered activity marker — same emoji face plus a count when several sit together. */
export const buildMapClusterIconHtml = (
  kind: MapPinKind,
  source: MapPinSource,
  ringColor: string,
  count: number
): string =>
  buildMapPinFaceHtml({
    kind,
    source,
    ringColor,
    size: 48,
    fontSizePx: 18,
    ringWidth: 2.5,
    stackCount: count,
  });
