/** First-paint tile budget. Explore overview does not need retina satellite tiles. */
export type MapTileLoadOptions = {
  detectRetina: boolean;
  keepBuffer: number;
  updateWhenIdle: boolean;
  /** Label overlay waits until the base layer has painted. */
  deferLabels: boolean;
};

export const mapTileLoadOptions = (exploreMode: boolean): MapTileLoadOptions =>
  exploreMode
    ? { detectRetina: false, keepBuffer: 1, updateWhenIdle: true, deferLabels: true }
    : { detectRetina: true, keepBuffer: 3, updateWhenIdle: false, deferLabels: false };
