import type { MapPinKind } from '../components/ui/mapPinTypes';

const kindClass = (kind: MapPinKind): string => {
  if (kind === 'camping') return 'uaetrail-map-venue-pin-badge--camping';
  if (kind === 'hiking') return 'uaetrail-map-venue-pin-badge--hiking';
  return 'uaetrail-map-venue-pin-badge--default';
};

/** Muted map glyphs — stroke reads on satellite and light tiles. */
export const resolveVenueMapGlyphSvg = (kind: MapPinKind, sizePx = 22): string => {
  if (kind === 'camping') {
    return `<svg class="uaetrail-venue-glyph" width="${sizePx}" height="${sizePx}" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <path fill="currentColor" d="M4 19h16v1.5H4V19z"/>
  <path fill="currentColor" fill-opacity="0.9" d="M12 5.5 4 18h16L12 5.5z"/>
  <path fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" d="M12 5.5 4 18h16L12 5.5z"/>
  <path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" d="M12 5.5 4 18h16L12 5.5z M12 5.5v12.5"/>
</svg>`;
  }

  if (kind === 'hiking') {
    return `<svg class="uaetrail-venue-glyph" width="${sizePx}" height="${sizePx}" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <path fill="currentColor" fill-opacity="0.92" d="M2.5 19.5 8.2 9.8 11.5 14.2 15.8 7.5 21.5 19.5z"/>
  <path fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" d="M2.5 19.5 8.2 9.8 11.5 14.2 15.8 7.5 21.5 19.5"/>
  <path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" d="M2.5 19.5 8.2 9.8 11.5 14.2 15.8 7.5 21.5 19.5"/>
  <circle cx="15.8" cy="7.5" r="1.35" fill="#fff"/>
  <circle cx="15.8" cy="7.5" r="0.85" fill="currentColor"/>
</svg>`;
  }

  return `<svg class="uaetrail-venue-glyph" width="${sizePx}" height="${sizePx}" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="4.5" fill="currentColor"/>
</svg>`;
};

export const buildVenueMapBadgeHtml = (kind: MapPinKind, glyphSizePx = 22): string => {
  const glyph = resolveVenueMapGlyphSvg(kind, glyphSizePx);
  return `<span class="uaetrail-map-venue-pin-badge ${kindClass(kind)}">${glyph}</span>`;
};
