/**
 * Map catalog exposure — member-contributed peek vs Pro business full profile.
 * Applies to gear shops (`venue:…`) and operator/agency tenants (`agency:…`).
 */

export type CatalogProfileExposure = 'peek' | 'full';

export const isPeekOnlyCatalogProfile = (
  exposure: CatalogProfileExposure | null | undefined
): boolean => exposure === 'peek';

/** Deep link that opens explore list + map peek (no standalone profile page). */
export const exploreMapPeekPath = (
  mapItemId: string,
  panel: 'shops' | 'venues' = 'shops'
): string =>
  `/explore?list=1&pin=${encodeURIComponent(mapItemId)}&panel=${panel}`;
