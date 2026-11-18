export type MapPeekPinAnchor = {
  x: number;
  y: number;
};

export type MapPeekBubbleLayout = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  originX: number;
  originY: number;
  placement: 'above' | 'below' | 'center';
};

const DEFAULT_PADDING_X = 12;
const PREFERRED_WIDTH = 380;
const PIN_GAP = 14;
/** Leaflet pin tip sits on the lat/lng; the badge sits above it. */
export const MAP_PEEK_PIN_VISUAL_LIFT = 22;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Scale the peek card so its natural height fits the overlay without an inner scrollbar. */
export const mapPeekFitScale = (naturalHeight: number, availableHeight: number): number => {
  if (!(naturalHeight > 0) || !(availableHeight > 0)) return 1;
  return Math.min(1, availableHeight / naturalHeight);
};

/** Bubble next to a map pin — sized to content, capped by remaining viewport (no inner scroll). */
export const layoutMapPeekBubble = (input: {
  overlayWidth: number;
  overlayHeight: number;
  cardHeight: number;
  pin?: MapPeekPinAnchor | null;
  paddingX?: number;
  topInset?: number;
  bottomInset?: number;
}): MapPeekBubbleLayout => {
  const paddingX = input.paddingX ?? DEFAULT_PADDING_X;
  const topInset = Math.max(0, input.topInset ?? DEFAULT_PADDING_X);
  const bottomInset = Math.max(0, input.bottomInset ?? DEFAULT_PADDING_X);
  const overlayWidth = Math.max(0, input.overlayWidth);
  const overlayHeight = Math.max(0, input.overlayHeight);
  const width = Math.min(PREFERRED_WIDTH, Math.max(0, overlayWidth - paddingX * 2));
  const maxHeight = Math.max(0, overlayHeight - topInset - bottomInset);
  const cardHeight = Math.min(Math.max(input.cardHeight, 120), maxHeight || input.cardHeight);

  if (overlayWidth <= 0 || overlayHeight <= 0) {
    return { left: 0, top: 0, width, maxHeight, originX: width / 2, originY: cardHeight, placement: 'center' };
  }

  const minTop = topInset;
  const maxTop = Math.max(minTop, overlayHeight - cardHeight - bottomInset);

  if (input.pin == null) {
    const left = (overlayWidth - width) / 2;
    const top = clamp((overlayHeight - cardHeight) / 2, minTop, maxTop);
    return {
      left,
      top,
      width,
      maxHeight,
      originX: width / 2,
      originY: cardHeight,
      placement: 'center',
    };
  }

  const pinX = input.pin.x;
  const pinY = input.pin.y - MAP_PEEK_PIN_VISUAL_LIFT;
  let left = pinX - width / 2;
  left = clamp(left, paddingX, Math.max(paddingX, overlayWidth - width - paddingX));

  const aboveTop = pinY - PIN_GAP - cardHeight;
  const belowTop = pinY + PIN_GAP;
  let top: number;
  let placement: MapPeekBubbleLayout['placement'];

  if (aboveTop >= minTop) {
    top = aboveTop;
    placement = 'above';
  } else if (belowTop + cardHeight <= overlayHeight - bottomInset) {
    top = belowTop;
    placement = 'below';
  } else {
    top = clamp(aboveTop, minTop, maxTop);
    placement = 'center';
  }
  top = clamp(top, minTop, maxTop);

  return {
    left,
    top,
    width,
    maxHeight,
    originX: clamp(pinX - left, 16, Math.max(16, width - 16)),
    originY: clamp(pinY - top, 8, Math.max(8, cardHeight - 8)),
    placement,
  };
};

/** Mobile map peek — docked above bottom nav / FAB stack. */
export const layoutMapPeekBottomSheet = (input: {
  overlayWidth: number;
  overlayHeight: number;
  cardHeight: number;
  paddingX?: number;
  bottomInset?: number;
  topInset?: number;
}): MapPeekBubbleLayout => {
  const paddingX = input.paddingX ?? DEFAULT_PADDING_X;
  const topInset = Math.max(0, input.topInset ?? DEFAULT_PADDING_X);
  const bottomInset = Math.max(0, input.bottomInset ?? DEFAULT_PADDING_X);
  const overlayWidth = Math.max(0, input.overlayWidth);
  const overlayHeight = Math.max(0, input.overlayHeight);
  const width = Math.max(0, overlayWidth - paddingX * 2);
  const maxHeight = Math.max(0, overlayHeight - topInset - bottomInset);
  const cardHeight = Math.min(Math.max(input.cardHeight, 120), maxHeight || input.cardHeight);
  const left = paddingX;
  const top = Math.max(topInset, overlayHeight - cardHeight - bottomInset);

  return {
    left,
    top,
    width,
    maxHeight,
    originX: width / 2,
    originY: cardHeight,
    placement: 'below',
  };
};
