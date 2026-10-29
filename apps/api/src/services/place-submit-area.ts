import type { z } from 'zod';
import type { locationSubmitBodySchema } from '../domain/location-submit.js';
import { ApiError } from '../lib/api-error.js';
import { boundsRingFromCenter } from '../lib/area-bounds.js';
import {
  createAdminArea,
  findAreaById,
  findAreaBySlug,
  findPublishedAreaById,
} from '../lib/areas-store.js';
import { slugify } from '../lib/slug.js';

type PlaceSubmitBody = z.infer<typeof locationSubmitBodySchema>;

const uniqueDraftAreaSlug = async (name: string): Promise<string> => {
  const base = slugify(name) || 'area';
  let slug = base;
  let n = 0;
  while (await findAreaBySlug(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
};

/** Published area id, or a new draft area from the host’s proposed name + pin. */
export const resolvePlaceSubmitArea = async (
  body: PlaceSubmitBody
): Promise<{ areaId: string; areaLabel: string }> => {
  const existingId = body.areaId?.trim() || '';
  const areaLabelHint = body.areaLabel?.trim() || '';

  if (existingId) {
    const published = await findPublishedAreaById(existingId);
    const anyArea = published ?? (await findAreaById(existingId));
    if (!anyArea) {
      throw new ApiError(
        400,
        'area_not_found',
        'Choose a published area, or name a new one for this pin.'
      );
    }
    return { areaId: anyArea.id, areaLabel: areaLabelHint || anyArea.name };
  }

  const proposed = body.proposedAreaName?.trim() || '';
  if (!proposed || body.latitude == null || body.longitude == null) {
    throw new ApiError(
      400,
      'area_not_found',
      'This pin isn’t in a listed area. Pick an existing area or name a new one.'
    );
  }

  const createdArea = await createAdminArea({
    slug: await uniqueDraftAreaSlug(proposed),
    name: proposed,
    region: body.region.trim(),
    status: 'draft',
    center: { latitude: body.latitude, longitude: body.longitude },
    bounds: boundsRingFromCenter({ latitude: body.latitude, longitude: body.longitude }),
    countryCode: body.countryCode?.toUpperCase() || 'AE',
    summary: `Proposed with catalog place “${body.name.trim()}”.`,
  });
  return { areaId: createdArea.id, areaLabel: createdArea.name };
};
