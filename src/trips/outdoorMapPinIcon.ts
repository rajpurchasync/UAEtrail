import L from 'leaflet';
import type { OutdoorPinStyle } from './outdoorMapPinStyle';
import { OUTDOOR_PIN_STYLES } from './outdoorMapPinStyle';

/** Classic map-pin silhouette (filled), personal-map palette. */
export const outdoorMapPinDivIcon = (style: OutdoorPinStyle): L.DivIcon => {
  const { fill, stroke } = OUTDOOR_PIN_STYLES[style];
  const html = `
    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.25));">
      <path d="M16 0C9.373 0 4 5.373 4 12c0 8.5 12 26 12 26s12-17.5 12-26C28 5.373 22.627 0 16 0z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <circle cx="16" cy="12" r="5" fill="#fff" opacity="0.95"/>
    </svg>
  `;
  return L.divIcon({
    className: 'uaetrail-outdoor-pin',
    html,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
};

export const outdoorMapPendingPinIcon = (): L.DivIcon => {
  const html = `
    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 6px rgba(0,0,0,.3));">
      <path d="M16 0C9.373 0 4 5.373 4 12c0 8.5 12 26 12 26s12-17.5 12-26C28 5.373 22.627 0 16 0z" fill="#6366f1" stroke="#4f46e5" stroke-width="1.5"/>
      <circle cx="16" cy="12" r="5" fill="#fff" opacity="0.95"/>
    </svg>
  `;
  return L.divIcon({
    className: 'uaetrail-outdoor-pin',
    html,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
};
