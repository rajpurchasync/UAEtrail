import type { MapPinKind, MapPinSource } from '../components/ui/mapPinTypes';

type PinIconKey =
  | 'hiking-activity'
  | 'hiking-venue'
  | 'camping-activity'
  | 'camping-venue'
  | 'event'
  | 'shop'
  | 'agency'
  | 'carpool'
  | 'demand'
  | 'place';

const svgIcon = (body: string, color: string, size: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const ICON_PATHS: Record<PinIconKey, string> = {
  'hiking-activity':
    '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  'hiking-venue':
    '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="M12 11v6"/>',
  'camping-activity':
    '<path d="M3.5 21 14 3l3 7"/><path d="M14 3 7 21"/><path d="M14 3v18"/><path d="M7 21h13.5"/>',
  'camping-venue':
    '<path d="M3.5 21 14 3l3 7"/><path d="M14 3 7 21"/><path d="M14 3v18"/><path d="M7 21h13.5"/>',
  event:
    '<rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/>',
  shop:
    '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  agency:
    '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  carpool:
    '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  demand:
    '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  place:
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
};

export const resolveMapPinIconKey = (
  kind: MapPinKind,
  source: MapPinSource = 'activity'
): PinIconKey => {
  if (source === 'venue') {
    if (kind === 'hiking') return 'hiking-venue';
    if (kind === 'camping') return 'camping-venue';
    if (kind === 'event') return 'event';
    return 'place';
  }
  if (source === 'shop') return 'shop';
  if (source === 'agency') return 'agency';
  if (source === 'demand') return 'demand';
  if (kind === 'carpool') return 'carpool';
  if (kind === 'hiking') return 'hiking-activity';
  if (kind === 'camping') return 'camping-activity';
  if (kind === 'event') return 'event';
  if (kind === 'shop') return 'shop';
  if (kind === 'agency') return 'agency';
  return 'place';
};

/** Inline SVG markup for Leaflet divIcon pins. */
export const resolveMapPinIconSvg = (
  kind: MapPinKind,
  source: MapPinSource = 'activity',
  color: string,
  size: number
): string => {
  const key = resolveMapPinIconKey(kind, source);
  return svgIcon(ICON_PATHS[key], color, size);
};
