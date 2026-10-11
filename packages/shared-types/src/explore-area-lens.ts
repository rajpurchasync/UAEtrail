/** Explore **Locations** lens — one map pin per curated area (not per catalog place). */

export interface ExploreAreaLensStatsDTO {
  hostedActivities: number;
  seekingPosts: number;
  trailSpots: number;
  campSpots: number;
  shops: number;
}

export const exploreAreaLensStatsSummary = (stats: ExploreAreaLensStatsDTO): string => {
  const parts: string[] = [];
  if (stats.hostedActivities > 0) {
    parts.push(`${stats.hostedActivities} outing${stats.hostedActivities === 1 ? '' : 's'}`);
  }
  if (stats.seekingPosts > 0) {
    parts.push(`${stats.seekingPosts} looking`);
  }
  const spots = stats.trailSpots + stats.campSpots;
  if (spots > 0) {
    parts.push(`${spots} spot${spots === 1 ? '' : 's'}`);
  }
  if (stats.shops > 0) {
    parts.push(`${stats.shops} shop${stats.shops === 1 ? '' : 's'}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'Explore this area';
};
