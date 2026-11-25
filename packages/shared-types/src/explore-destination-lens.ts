/** Destination hub rollups — curated destination is a label, not an explore map pin. */

export interface ExploreDestinationLensStatsDTO {
  hostedActivities: number;
  /** Fixed `member_availability` pins in this hub (not legacy seeking activities). */
  availabilityPins: number;
  trailSpots: number;
  campSpots: number;
  /** Amenities (toilet, parking, …) — counted from catalog rows, not Spots lens pins yet. */
  facilities: number;
  shops: number;
}

export const exploreDestinationLensStatsSummary = (stats: ExploreDestinationLensStatsDTO): string => {
  const parts: string[] = [];
  if (stats.hostedActivities > 0) {
    parts.push(`${stats.hostedActivities} outing${stats.hostedActivities === 1 ? '' : 's'}`);
  }
  if (stats.availabilityPins > 0) {
    parts.push(`${stats.availabilityPins} available`);
  }
  const spots = stats.trailSpots + stats.campSpots;
  if (spots > 0) {
    parts.push(`${spots} spot${spots === 1 ? '' : 's'}`);
  }
  if (stats.facilities > 0) {
    parts.push(`${stats.facilities} facilit${stats.facilities === 1 ? 'y' : 'ies'}`);
  }
  if (stats.shops > 0) {
    parts.push(`${stats.shops} shop${stats.shops === 1 ? '' : 's'}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'Explore this destination';
};