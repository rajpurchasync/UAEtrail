/**
 * Place map peek copy/lines — `card.source` is `venue` (wire); product entity is Place.
 * Curated **Destination** hub link uses `card.destinationSlug` / `card.destinationName` (from `place.destinationId`), not `source: 'area'`.
 * @see docs/DOMAIN_CANONICALS.md §12.1.1
 */
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  browseCatalogEntityName,
  browseCatalogNormalize,
} from '../discovery/discoveryPortListPeek';

const normalize = browseCatalogNormalize;

/** Emirate / region line — never duplicates Arabic subtitle blobs. */
export const resolvePlacePeekRegionLabel = (card: DiscoveryCardModel): string | null => {
  const region = card.venueRegion?.trim();
  if (!region) return null;
  if (normalize(region) === normalize(browseCatalogEntityName(card))) return null;
  return region;
};

/** Local subtitle (Arabic name or wadi label) when it is not the curated hub title. */
export const resolvePlacePeekLocalLabel = (card: DiscoveryCardModel): string | null => {
  const subtitle = card.subtitle?.trim();
  if (!subtitle) return null;

  const region = card.venueRegion?.trim();
  let local = subtitle;
  if (region) {
    const suffix = ` · ${region}`;
    if (local.endsWith(suffix)) {
      local = local.slice(0, -suffix.length).trim();
    }
    if (normalize(local) === normalize(region)) return null;
  }

  const curated = card.destinationName?.trim();
  if (curated && normalize(local) === normalize(curated)) return null;
  if (normalize(local) === normalize(browseCatalogEntityName(card))) return null;
  return local || null;
};

export const resolvePlacePeekCuratedDestination = (
  card: DiscoveryCardModel
): { slug: string | null; name: string } | null => {
  const name = card.destinationName?.trim();
  if (!name) return null;
  const slug = card.destinationSlug?.trim() || null;
  return { slug, name };
};
