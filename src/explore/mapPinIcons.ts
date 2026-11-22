import {
  resolveMapPinEmoji,
  type ExploreActivityMode,
  type DiscoveryCardKind,
  type PlaceKind,
} from '@uaetrail/shared-types';
import type { MapPinKind, MapPinSource } from '../components/ui/mapPinTypes';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { buildVenueMapBadgeHtml, resolveVenueMapGlyphSvg } from './venueMapGlyphs';
import { exploreMapPinRingColor } from '../config/exploreTheme';
import { type MapPinActivityCaption, resolveMapPinVenueTripLabel } from './exploreMapPinCaption';

export const isCatalogVenueMapPin = (kind: MapPinKind, source: MapPinSource): boolean =>
  isGeographyMapSource(source) && (kind === 'hiking' || kind === 'camping');

const venueStackCountBadgeHtml = (stackCount: number): string => {
  if (stackCount <= 1) return '';
  const countLabel = stackCount > 99 ? '99+' : String(stackCount);
  return `<span class="uaetrail-map-cluster-badge" aria-hidden="true">${countLabel}</span>`;
};

/** Short place name beside the icon (regional zoom). */
export const VENUE_MAP_LABEL_MIN_ZOOM = 10;
/** Full name without truncation. */
export const VENUE_MAP_FULL_LABEL_MIN_ZOOM = 12;

export const venueMapLabelForZoom = (
  label: string,
  mapZoom: number,
  selected = false
): { show: boolean; text: string } => {
  const trimmed = label.trim();
  if (!trimmed) return { show: false, text: '' };
  if (mapZoom < VENUE_MAP_LABEL_MIN_ZOOM && !selected) {
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

const buildVenueMapCoverBadgeHtml = (kind: MapPinKind, coverImage: string): string => {
  const cover = escapeMapPinHtml(coverImage.trim());
  return `<span class="uaetrail-map-venue-pin-badge uaetrail-map-venue-pin-badge--cover ${kindClassForBadge(kind)}"><img class="uaetrail-map-venue-cover-img" src="${cover}" alt="" loading="lazy" decoding="async" /></span>`;
};

const kindClassForBadge = (kind: MapPinKind): string => {
  if (kind === 'camping') return 'uaetrail-map-venue-pin-badge--camping';
  if (kind === 'hiking') return 'uaetrail-map-venue-pin-badge--hiking';
  return 'uaetrail-map-venue-pin-badge--default';
};

/** Map chip: circular cover (or glyph) + kind · venue caption. */
export const buildVenueMapPinHtml = (options: {
  kind: MapPinKind;
  label?: string;
  mapZoom: number;
  selected?: boolean;
  stackCount?: number;
  hostedTripCount?: number;
  coverImage?: string | null;
  caption?: MapPinActivityCaption | null;
  source?: MapPinSource;
  ringColor?: string;
}): VenueMapPinLayout => {
  const selectedClass = options.selected ? ' uaetrail-map-venue-pin--selected' : '';
  const stackCount = options.stackCount ?? 1;
  const clusterClass = stackCount > 1 ? ' uaetrail-map-venue-chip--cluster' : '';
  const badgeSize = 36;
  const glyphSize = 22;
  const cover = options.coverImage?.trim();
  const resolvedBadgeHtml = cover
    ? buildVenueMapCoverBadgeHtml(options.kind, cover)
    : `<span class="uaetrail-map-venue-pin-badge uaetrail-map-venue-pin-badge--circle ${kindClassForBadge(options.kind)}">${resolveVenueMapGlyphSvg(options.kind, glyphSize)}</span>`;

  const tripCount = Math.max(0, options.hostedTripCount ?? 0);
  const tripDotHtml =
    tripCount > 0
      ? `<span class="uaetrail-map-venue-trip-dot" aria-hidden="true" title="Trip scheduled"></span>`
      : '';
  const tripLabel = resolveMapPinVenueTripLabel(tripCount, options.mapZoom);
  const tripLabelHtml = tripLabel
    ? `<span class="uaetrail-map-venue-trip-label">${escapeMapPinHtml(tripLabel)}</span>`
    : '';
  const badgeWrapHtml = `<span class="uaetrail-map-venue-pin-badge-wrap">${resolvedBadgeHtml}${tripDotHtml}</span>`;

  const caption = options.caption;
  const showCaption = Boolean(caption?.primary?.trim());
  const captionAccent =
    options.ringColor ??
    exploreMapPinRingColor(options.kind, options.source === 'facility' ? 'venue' : 'venue');
  const captionHtml = showCaption && caption ? buildMapPinCaptionHtml(caption, captionAccent) : '';
  const tripChipClass = tripCount > 0 ? ' uaetrail-map-venue-chip--has-trip' : '';
  const countBadge = venueStackCountBadgeHtml(stackCount);
  const widgetClass = showCaption
    ? 'uaetrail-map-pin-widget uaetrail-map-pin-widget--captioned'
    : 'uaetrail-map-pin-widget';
  const chipBody = `<span class="uaetrail-map-venue-chip${tripChipClass}${clusterClass}${selectedClass}">${badgeWrapHtml}${tripLabelHtml}${countBadge}</span>`;
  const html = `<span class="${widgetClass}">${captionHtml}${chipBody}</span>`;

  const captionBand = showCaption ? (caption?.where ? 30 : 20) : 0;
  const width = showCaption && caption ? mapPinCaptionWidth(caption, badgeSize) : badgeSize;
  const height = badgeSize + captionBand;
  const iconAnchor: [number, number] = [width / 2, height];

  void options.label;
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
  /** Neutral map dot — no emoji inside the circle (trip pins). */
  hidePinIcon?: boolean;
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
  hidePinIcon = false,
}: MapPinFaceOptions): string => {
  const selectedClass = selected ? ' uaetrail-map-pin-marker--selected' : '';
  const iconHtml = hidePinIcon
    ? ''
    : resolveMapPinIconHtml(kind, source, fontSizePx, placeKind, activityMode === 'seeking');
  const faceClass = hidePinIcon ? ' uaetrail-map-pin-face--dot' : '';
  const dataAttr = exploreItemId ? ` data-explore-item-id="${exploreItemId}"` : '';
  const countBadge = venueStackCountBadgeHtml(stackCount);

  void _ringWidth;
  const markerDataAttr = exploreItemId ? ` data-explore-item-id="${exploreItemId}"` : '';
  const iconInner = iconHtml ? `<span class="uaetrail-map-pin-icon">${iconHtml}</span>` : '';
  const markerHtml = `<span class="uaetrail-map-pin-marker${selectedClass}"${markerDataAttr} style="--pin-ring:${ringColor};width:${size}px;height:${size}px;"><span class="uaetrail-map-pin-face${faceClass}">${iconInner}</span>${countBadge}</span>`;

  if (positionStyle) {
    return `<span class="uaetrail-map-pin-slot" style="${positionStyle}"${dataAttr}>${markerHtml}</span>`;
  }

  if (exploreItemId) {
    return `<span${dataAttr}>${markerHtml}</span>`;
  }

  return markerHtml;
};

const mapPinCaptionWidth = (caption: MapPinActivityCaption, markerSize: number): number => {
  const longest = Math.max(caption.primary.length, caption.where?.length ?? 0);
  return Math.max(markerSize, Math.min(140, longest * 6.4 + 22));
};

const buildMapPinCaptionHtml = (caption: MapPinActivityCaption, accentColor?: string): string => {
  const tripStack = caption.where ? ' uaetrail-map-pin-caption-stack--trip' : '';
  const typedStack = accentColor ? ' uaetrail-map-pin-caption-wrap--typed' : '';
  const accentAttr = accentColor
    ? ` style="--pin-caption-bg:${escapeMapPinHtml(accentColor)}"`
    : '';
  const typeHtml = `<span class="uaetrail-map-pin-caption-line uaetrail-map-pin-caption-line--type">${escapeMapPinHtml(caption.primary)}</span>`;
  const whereHtml = caption.where
    ? `<span class="uaetrail-map-pin-caption-line uaetrail-map-pin-caption-line--where">${escapeMapPinHtml(caption.where)}</span>`
    : '';
  const stackHtml = `<span class="uaetrail-map-pin-caption-stack${tripStack}${accentColor ? ' uaetrail-map-pin-caption-stack--typed' : ''}">${typeHtml}${whereHtml}</span>`;
  const tailHtml = accentColor
    ? `<span class="uaetrail-map-pin-caption-tail" aria-hidden="true"></span>`
    : '';
  return `<span class="uaetrail-map-pin-caption-wrap${typedStack}${tripStack}"${accentAttr}>${stackHtml}${tailHtml}</span>`;
};

export type ActivityMapPinLayout = {
  html: string;
  width: number;
  height: number;
  anchorX: number;
};

/** Trip pin — colored label; optional circle only when the label is hidden (low zoom). */
export const buildActivityMapPinLayout = (
  options: MapPinFaceOptions & { caption?: MapPinActivityCaption | null; labelOnly?: boolean }
): ActivityMapPinLayout => {
  const { caption = null, size, labelOnly = false, ...faceOptions } = options;
  const showCaption = Boolean(caption?.primary?.trim());
  const useLabelOnly = labelOnly && showCaption;
  const markerHtml = useLabelOnly ? '' : buildMapPinFaceHtml({ ...faceOptions, size });
  const captionHtml =
    showCaption && caption ? buildMapPinCaptionHtml(caption, faceOptions.ringColor) : '';
  const widgetClass = [
    'uaetrail-map-pin-widget',
    showCaption ? 'uaetrail-map-pin-widget--captioned' : '',
    useLabelOnly ? 'uaetrail-map-pin-widget--label-only' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const dataAttr = faceOptions.exploreItemId
    ? ` data-explore-item-id="${faceOptions.exploreItemId}"`
    : '';
  const html = `<span class="${widgetClass}"${dataAttr}>${captionHtml}${markerHtml}</span>`;
  const tailBand = useLabelOnly && showCaption && faceOptions.ringColor ? 8 : 0;
  const captionBand = showCaption ? (caption?.where ? 38 : 24) + tailBand : 0;
  const width = showCaption ? mapPinCaptionWidth(caption!, size) : size;
  const height = useLabelOnly ? Math.max(captionBand, 20) : size + captionBand;
  return { html, width, height, anchorX: width / 2 };
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
  _iconHeight: number,
  bodyHeight: number = _iconHeight
): string | null => {
  if (entries.length === 0) return null;
  const { orbit, n } = colocatedPinCanvasMetrics(entries.length);
  const cx = iconWidth / 2;
  const cy = bodyHeight / 2;
  const dx = pointerX - cx;
  const dy = pointerY - cy;
  let bestId = entries[0]!.exploreItemId;
  let bestDist = Infinity;
  for (let index = 0; index < n; index += 1) {
    const angle = (2 * Math.PI * index) / n - Math.PI / 2;
    const sx = orbit * Math.cos(angle);
    const sy = orbit * Math.sin(angle);
    const dist = (dx - sx) ** 2 + (dy - sy) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestId = entries[index]!.exploreItemId;
    }
  }
  return bestId;
};

/** Single map pin when several types or items share one spot — mini icons + total count. */
const collidedPinIconLayout = (
  slotCount: number
): { emojiPx: number; venueGlyphPx: number; boxPx: number } => {
  if (slotCount >= 4) return { emojiPx: 9, venueGlyphPx: 9, boxPx: 11 };
  if (slotCount === 3) return { emojiPx: 10, venueGlyphPx: 10, boxPx: 12 };
  if (slotCount === 2) return { emojiPx: 12, venueGlyphPx: 11, boxPx: 14 };
  return { emojiPx: 15, venueGlyphPx: 13, boxPx: 17 };
};

export const buildMapCollidedPinIconHtml = (
  entries: ColocatedPinIconEntry[],
  totalCount: number
): { html: string; size: number } => {
  const size = 48;
  if (entries.length === 0) {
    return { html: '', size };
  }
  const dominant = entries.reduce(
    (best, entry) => ((entry.stackCount ?? 1) > (best.stackCount ?? 1) ? entry : best),
    entries[0]!
  );
  const visible = entries.slice(0, 3);
  const hasOverflow = entries.length > 3;
  const slotCount = visible.length + (hasOverflow ? 1 : 0);
  const layout = collidedPinIconLayout(slotCount);
  const glyphBoxStyle = `width:${layout.boxPx}px;height:${layout.boxPx}px;max-width:${layout.boxPx}px;max-height:${layout.boxPx}px;`;

  const glyphs = visible
    .map((entry) => {
      if (isCatalogVenueMapPin(entry.kind, entry.source)) {
        return `<span class="uaetrail-map-collided-glyph uaetrail-map-collided-glyph--venue" style="${glyphBoxStyle}">${buildVenueMapBadgeHtml(entry.kind, layout.venueGlyphPx)}</span>`;
      }
      const icon = resolveMapPinIconHtml(
        entry.kind,
        entry.source,
        layout.emojiPx,
        undefined,
        entry.activityMode === 'seeking'
      );
      return `<span class="uaetrail-map-collided-glyph" style="${glyphBoxStyle}">${icon}</span>`;
    })
    .join('');
  const overflow = hasOverflow
    ? `<span class="uaetrail-map-collided-glyph uaetrail-map-collided-more font-emoji" style="${glyphBoxStyle}" aria-hidden="true">…</span>`
    : '';
  const countBadge = venueStackCountBadgeHtml(totalCount);
  const dataAttr = dominant.exploreItemId ? ` data-explore-item-id="${dominant.exploreItemId}"` : '';
  const emphasized = entries.some((entry) => entry.selected);
  const markerSelectedClass = emphasized ? ' uaetrail-map-pin-marker--selected' : '';
  const html = `<span class="uaetrail-map-pin-collided"${dataAttr}><span class="uaetrail-map-pin-marker${markerSelectedClass}" style="--pin-ring:${dominant.ringColor};width:${size}px;height:${size}px;"><span class="uaetrail-map-pin-face uaetrail-map-pin-face--collided"><span class="uaetrail-map-pin-collided-icons uaetrail-map-pin-collided-icons--${slotCount}">${glyphs}${overflow}</span></span>${countBadge}</span></span>`;
  return { html, size };
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
        hidePinIcon: true,
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
  count: number,
  exploreItemId?: string,
  selected = false
): string =>
  buildMapPinFaceHtml({
    kind,
    source,
    ringColor,
    size: 48,
    fontSizePx: 18,
    ringWidth: 2.5,
    stackCount: count,
    exploreItemId,
    selected,
    hidePinIcon: !isCatalogVenueMapPin(kind, source),
  });

const clusterIconRootFromPointerTarget = (target: EventTarget | null | undefined): HTMLElement | null => {
  const el = target as HTMLElement | null;
  if (!el) return null;
  return (
    el.closest('.uaetrail-map-pin-multi') ??
    el.closest('.uaetrail-map-cluster-wrap') ??
    el.closest('.leaflet-marker-icon')
  );
};

/** Resolve which explore item a cluster icon click should open (fan or single bubble). */
export const resolveClusterClickExploreItemId = (
  entries: Array<{ exploreItemId: string }>,
  originalEvent?: MouseEvent | null
): string | null => {
  if (entries.length === 0) return null;
  const target = (originalEvent?.target as HTMLElement | null)?.closest?.('[data-explore-item-id]');
  const fromTarget = target?.getAttribute('data-explore-item-id');
  if (fromTarget) return fromTarget;
  if (entries.length === 1) return entries[0]!.exploreItemId;
  if (!originalEvent) return entries[0]!.exploreItemId;
  const iconRoot = clusterIconRootFromPointerTarget(originalEvent.target);
  if (iconRoot?.querySelector('.uaetrail-map-pin-collided')) {
    return entries[0]!.exploreItemId;
  }
  if (!iconRoot) return entries[0]!.exploreItemId;
  const rect = iconRoot.getBoundingClientRect();
  const x = originalEvent.clientX - rect.left;
  const y = originalEvent.clientY - rect.top;
  const bodyHeight = colocatedPinCanvasMetrics(entries.length).canvas;
  return resolveColocatedExploreItemIdFromPointer(entries, x, y, rect.width, rect.height, bodyHeight);
};
