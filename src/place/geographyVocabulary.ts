/**
 * Geography vocabulary for discovery + detail UI.
 * Authoritative product copy: `docs/DOMAIN_CANONICALS.md` §12.1 · §12.1.1.
 *
 * **Two ladders (do not mix):**
 * - **AdminGeo** — country → state → area (city) → optional venue (`geoRef`, `/geo/n/:id`).
 * - **Product catalog** — **Destination** (curated hub, not a pin) → **Place (site)** / **Facility** (map pins).
 *
 * Use these terms consistently in modules, props, and user-facing labels.
 */

/** Catalog entity — trail, camp, outdoor spot (`locations` / HTTP `/places`). */
export type GeographyPlaceEntity = 'place';

/** Amenity entity — toilet, parking, gas (`facilities` / HTTP `/facilities`). Map pin `source: facility`. */
export type GeographyFacilityEntity = 'facility';

/** Explore map wire — Place pin on Spots (`BWL_EXPLORE_MAP_SOURCE.PLACE`). */
export type MapPlaceWireSource = 'place';

/** Explore map wire — Facility amenity pin with coords for navigation. */
export type MapFacilityWireSource = 'facility';

/** @deprecated Read compat — normalize via `isPlaceMapSource`. */
export type MapVenueWireSource = 'venue';

/** @deprecated Brief COH-02 name — use `place`. */
export type MapCatalogPlaceWireSource = 'catalog_place';

/** Admin-curated outdoor **Destination** (`destinations` collection; wire `destinationId`). Not a map pin. */
export type GeographyDestinationName = 'destination';

/**
 * Amenity kinds on Facility rows (toilet, parking, gas, …).
 * Counted as `destinationLensStats.facilities` on the destination hub page.
 */
export type GeographyFacilityPlaceKinds = 'amenity';

/** Browse list category key — catalog Places in this region. */
export const BROWSE_LIST_CATEGORY_PLACES = 'venues' as const;

/** UI label for the Spots map lens (Place pins; facilities stay on the map pending display split). */
export const MAP_LENS_SPOTS_LABEL = 'Spots' as const;