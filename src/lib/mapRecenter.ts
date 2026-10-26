/** Pan / fly the map to a point (Explore locate, initial framing, etc.). */
export type MapRecenterTarget = {
  lat: number;
  lng: number;
  zoom?: number;
  /** Fly to `zoom` (default explore locate zoom) — for “locate me”. */
  zoomIn?: boolean;
  flyDuration?: number;
  /** Bumps effect when repeating the same coordinates (e.g. locate again). */
  nonce?: number;
};
