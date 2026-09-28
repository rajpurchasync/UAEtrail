import { resolveMapPinEmoji, type ExploreCardKind } from '@uaetrail/shared-types';
import type { MapPinKind, MapPinSource } from '../components/ui/mapPinTypes';

/** Inline emoji markup for Leaflet divIcon pins. */
export const resolveMapPinIconHtml = (
  kind: MapPinKind,
  source: MapPinSource = 'activity',
  fontSizePx = 18
): string => {
  const emoji = resolveMapPinEmoji(kind as ExploreCardKind, source);
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
};

/** One map circle — optional count badge and click target id. */
export const buildMapPinFaceHtml = ({
  kind,
  source,
  ringColor,
  size,
  fontSizePx,
  ringWidth,
  selected = false,
  stackCount = 0,
  exploreItemId,
  positionStyle = '',
}: MapPinFaceOptions): string => {
  const selectedClass = selected ? ' uaetrail-map-pin-marker--selected' : '';
  const iconHtml = resolveMapPinIconHtml(kind, source, fontSizePx);
  const countLabel = stackCount > 99 ? '99+' : String(stackCount);
  const badge =
    stackCount > 1
      ? `<span class="uaetrail-map-cluster-badge" aria-hidden="true">${countLabel}</span>`
      : '';
  const clusterClass = stackCount > 1 ? ' uaetrail-map-cluster-marker' : '';
  const dataAttr = exploreItemId ? ` data-explore-item-id="${exploreItemId}"` : '';
  const pos = positionStyle ? ` style="${positionStyle}"` : '';

  return `<span class="uaetrail-map-pin-slot${pos}"${dataAttr}><span class="uaetrail-map-pin-marker${clusterClass}${selectedClass}" style="--pin-ring:${ringColor};width:${size}px;height:${size}px;"><span class="uaetrail-map-pin-face" style="border:${ringWidth}px solid ${ringColor};"><span class="uaetrail-map-pin-icon">${iconHtml}</span></span>${badge}</span></span>`;
};

export type ColocatedPinIconEntry = {
  kind: MapPinKind;
  source: MapPinSource;
  ringColor: string;
  exploreItemId: string;
  stackCount: number;
  selected?: boolean;
};

/** Fan of emoji circles at one lat/lng — avoids Leaflet clustering merging types. */
export const buildMapColocatedPinIconHtml = (
  entries: ColocatedPinIconEntry[]
): { html: string; size: number } => {
  const n = entries.length;
  const faceSize = 38;
  const ringWidth = 2.5;
  const fontSizePx = 17;
  const orbit = n <= 2 ? 24 : 28;
  const canvas = n <= 2 ? 76 : 92;
  const center = canvas / 2;

  const slots = entries
    .map((entry, index) => {
      const angle = (2 * Math.PI * index) / n - Math.PI / 2;
      const x = center + orbit * Math.cos(angle) - faceSize / 2;
      const y = center + orbit * Math.sin(angle) - faceSize / 2;
      const positionStyle = `left:${x}px;top:${y}px;width:${faceSize}px;height:${faceSize}px`;
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

/** Cluster / stack marker: type emoji + count badge. */
export const buildMapClusterIconHtml = (
  kind: MapPinKind,
  source: MapPinSource,
  ringColor: string,
  count: number
): string => {
  const size = 44;
  const iconHtml = resolveMapPinIconHtml(kind, source, 18);
  const countLabel = count > 99 ? '99+' : String(count);
  return `<span class="uaetrail-map-pin-marker uaetrail-map-cluster-marker" style="--pin-ring:${ringColor};width:${size}px;height:${size}px;"><span class="uaetrail-map-pin-face" style="border:2.5px solid ${ringColor};"><span class="uaetrail-map-pin-icon">${iconHtml}</span></span><span class="uaetrail-map-cluster-badge" aria-hidden="true">${countLabel}</span></span>`;
};
