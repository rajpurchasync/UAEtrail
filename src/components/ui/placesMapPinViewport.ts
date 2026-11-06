/** Extra pixels around a pin that still count as a tap. */
export const MAP_PIN_HIT_PADDING_PX = 14;

/** Stem + dot below the pin body — Leaflet anchor sits on the geographic point. */
export const MAP_PIN_GEO_ANCHOR_STEM_PX = 6;
export const MAP_PIN_GEO_ANCHOR_DOT_PX = 7;

export type MapPinGeoAnchorLayout = {
  html: string;
  width: number;
  height: number;
  iconAnchor: [number, number];
  bodyHeight: number;
};

/** Pin body floats above a fixed ground dot (quote stem) tied to lat/lng. */
export const wrapMapPinWithGeoAnchor = (
  bodyHtml: string,
  bodyWidth: number,
  bodyHeight: number,
  anchorX?: number
): MapPinGeoAnchorLayout => {
  const ax = anchorX ?? bodyWidth / 2;
  const stem = MAP_PIN_GEO_ANCHOR_STEM_PX;
  const dot = MAP_PIN_GEO_ANCHOR_DOT_PX;
  const totalHeight = bodyHeight + stem + dot;
  const html = `<span class="uaetrail-map-pin-geo-anchor" style="width:${bodyWidth}px;height:${totalHeight}px"><span class="uaetrail-map-pin-geo-anchor__body">${bodyHtml}</span><span class="uaetrail-map-pin-geo-anchor__quote" style="left:${ax}px" aria-hidden="true"></span><span class="uaetrail-map-pin-geo-anchor__dot" style="left:${ax}px" aria-hidden="true"></span></span>`;
  return {
    html,
    width: bodyWidth,
    height: totalHeight,
    iconAnchor: [ax, totalHeight],
    bodyHeight,
  };
};

export const mapPinLeafletIconMetrics = (
  layout: MapPinGeoAnchorLayout,
  options?: { hitPaddingPx?: number }
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } => {
  const pad = options?.hitPaddingPx ?? MAP_PIN_HIT_PADDING_PX;
  if (pad <= 0) {
    return {
      html: layout.html,
      iconSize: [layout.width, layout.height],
      iconAnchor: layout.iconAnchor,
    };
  }
  const hit = mapPinHitIconMetrics(layout.width, layout.height, layout.iconAnchor, pad);
  return {
    html: wrapMapPinHitHtml(layout.html, pad),
    iconSize: hit.iconSize,
    iconAnchor: hit.iconAnchor,
  };
};

export const mapPinHitIconMetrics = (
  width: number,
  height: number,
  iconAnchor: [number, number],
  paddingPx: number = MAP_PIN_HIT_PADDING_PX
): { iconSize: [number, number]; iconAnchor: [number, number] } => ({
  iconSize: [width + paddingPx * 2, height + paddingPx * 2],
  iconAnchor: [iconAnchor[0] + paddingPx, iconAnchor[1] + paddingPx],
});

export const wrapMapPinHitHtml = (inner: string, paddingPx: number = MAP_PIN_HIT_PADDING_PX): string =>
  `<span class="uaetrail-map-pin-hit" style="--map-pin-hit-pad:${paddingPx}px">${inner}</span>`;

const HORIZONTAL_MARGIN = 48;

/** Keep the current zoom; pan only if the pin (and room for its popup) would sit off-screen. */
export const panDeltaToShowPinWithPopup = (
  pin: { x: number; y: number },
  size: { x: number; y: number },
  options?: { topInset?: number; bottomInset?: number; cardReserve?: number }
): { x: number; y: number } | null => {
  if (size.x <= 0 || size.y <= 0) return null;

  const topInset = options?.topInset ?? 72;
  const bottomInset = options?.bottomInset ?? 96;
  const cardReserve = options?.cardReserve ?? Math.min(320, size.y * 0.42);

  const minX = HORIZONTAL_MARGIN;
  const maxX = Math.max(minX, size.x - HORIZONTAL_MARGIN);
  const minY = topInset + 20;
  const maxY = Math.max(minY, size.y - bottomInset - 28);
  const preferredMinY = Math.min(maxY, topInset + cardReserve);

  let targetX = pin.x;
  let targetY = pin.y;
  if (pin.x < minX) targetX = minX;
  else if (pin.x > maxX) targetX = maxX;
  if (pin.y > maxY) targetY = maxY;
  else if (pin.y < preferredMinY) targetY = preferredMinY;

  const dx = pin.x - targetX;
  const dy = pin.y - targetY;
  if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return null;
  return { x: dx, y: dy };
};

/** Pan only — keep the current zoom while fitting spiderfied / ring pins in view. */
export const panMapToLatLngBoundsAtCurrentZoom = (
  map: L.Map,
  bounds: L.LatLngBounds,
  paddingPx = 80
): void => {
  if (!bounds.isValid()) return;
  map.fitBounds(bounds, {
    padding: [paddingPx, paddingPx],
    maxZoom: map.getZoom(),
    animate: true,
  });
};
