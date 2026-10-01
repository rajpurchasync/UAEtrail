import type { OutdoorPinStyle } from '../../trips/outdoorMapPinStyle';
import { OUTDOOR_PIN_STYLES } from '../../trips/outdoorMapPinStyle';

/** Same teardrop pin as the map — scaled for list rows. */
export const OutdoorMapListPinIcon = ({ style }: { style: OutdoorPinStyle }) => {
  const { fill, stroke } = OUTDOOR_PIN_STYLES[style];
  return (
    <svg
      width="22"
      height="28"
      viewBox="0 0 32 40"
      className="shrink-0 drop-shadow-sm"
      aria-hidden
    >
      <path
        d="M16 0C9.373 0 4 5.373 4 12c0 8.5 12 26 12 26s12-17.5 12-26C28 5.373 22.627 0 16 0z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      <circle cx="16" cy="12" r="4.5" fill="#fff" opacity="0.95" />
    </svg>
  );
};
