/**
 * Place map peek copy/lines — `card.source` is `venue` (wire); product entity is Place.
 * Curated **Area** hub link uses `card.areaSlug` / `card.areaName` (from `place.areaId`), not `source: 'area'`.
 * @see docs/DOMAIN_CANONICALS.md §12.1.1
 */
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  browseCatalogEntityName,
  browseCatalogNormalize,
} from '../list/browse/browseCatalogLabels';

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

  const curated = card.areaName?.trim();
  if (curated && normalize(local) === normalize(curated)) return null;
  if (normalize(local) === normalize(browseCatalogEntityName(card))) return null;
  return local || null;
};

export const resolvePlacePeekCuratedArea = (
  card: DiscoveryCardModel
): { slug: string | null; name: string } | null => {
  const name = card.areaName?.trim();
  if (!name) return null;
  const slug = card.areaSlug?.trim() || null;
  return { slug, name };
};
