/** Shared width math for desktop browse rails (list drawer, Find crew). */

export const EXPLORE_BROWSE_RAIL_MIN_WIDTH = 360;
export const EXPLORE_BROWSE_RAIL_DEFAULT_WIDTH = 450;
export const EXPLORE_BROWSE_RAIL_MAP_SLIVER = 280;

export const maxExploreBrowseRailWidth = (): number =>
  typeof window === 'undefined'
    ? 720
    : Math.max(EXPLORE_BROWSE_RAIL_MIN_WIDTH, window.innerWidth - EXPLORE_BROWSE_RAIL_MAP_SLIVER);

export const clampExploreBrowseRailWidth = (width: number): number =>
  Math.min(Math.max(width, EXPLORE_BROWSE_RAIL_MIN_WIDTH), maxExploreBrowseRailWidth());

/** First-open Find crew width — same default as the explore list drawer. */
export const exploreCrewPanelDefaultWidth = (): number => EXPLORE_BROWSE_RAIL_DEFAULT_WIDTH;
