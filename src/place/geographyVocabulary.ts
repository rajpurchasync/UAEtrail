/**
 * Geography vocabulary for discovery + detail UI.
 * Authoritative product copy: `docs/DOMAIN_CANONICALS.md` §12.1 · §12.1.1.
 *
 * Use these terms consistently in modules, props, and user-facing labels.
 */

/** Catalog entity — one `locations` row (trail, camp, amenity/facility, shop-as-place). */
export type GeographyPlaceEntity = 'place';

/**
 * Explore map wire only — `ExploreCardSource: 'venue'`.
 * A **Place** pin on the Spots lens (`id` prefix `venue:`). Not a second product entity.
 */
export type MapVenueWireSource = 'venue';

/** Curated hub (`areas` collection). Map row `source: 'area'`, `id: area:{slug}`. */
export type GeographyAreaHubWireSource = 'area';

/**
 * Amenity / infrastructure **Places** (toilet, parking, gas, …).
 * Rolled up as `areaLensStats.facilities` on the **Area** map pin — still Places, not Areas.
 */
export type GeographyFacilityPlaceKinds = 'amenity';

/** Browse list category key — means “catalog Places in this region”, not `venue` the entity. */
export const BROWSE_LIST_CATEGORY_PLACES = 'venues' as const;

/** UI label for the Spots map lens (catalog Place pins). */
export const MAP_LENS_SPOTS_LABEL = 'Spots' as const;
