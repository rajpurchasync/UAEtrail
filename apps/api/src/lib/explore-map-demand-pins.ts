/**
 * Legacy `demand:` map pins were removed in M1 — seeking uses `activity:` rows only.
 * Flag documents intent for ops; map build does not branch on this today.
 */
export const isExploreMapDemandPinsEnabled = (): boolean =>
  process.env.EXPLORE_MAP_DEMAND_PINS === '1';
