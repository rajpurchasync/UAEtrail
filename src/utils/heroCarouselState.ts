export const stepCarouselIndex = (current: number, total: number, delta: 1 | -1): number => {
  if (total <= 0) return 0;
  return (current + delta + total) % total;
};

export type AutoplayGate = {
  reducedMotion: boolean;
  userPaused: boolean;
  hovered: boolean;
  focused: boolean;
  touching: boolean;
};

export const shouldCarouselAutoplay = (gate: AutoplayGate): boolean =>
  !gate.reducedMotion &&
  !gate.userPaused &&
  !gate.hovered &&
  !gate.focused &&
  !gate.touching;
