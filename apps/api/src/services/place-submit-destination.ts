import type { z } from 'zod';
import type { locationSubmitBodySchema } from '../domain/location-submit.js';
import { ApiError } from '../lib/api-error.js';
import { boundsRingFromCenter } from '../lib/destination-bounds.js';
import {
  createAdminDestination,
  findDestinationById,
  findDestinationBySlug,
  findPublishedDestinationById,
} from '../lib/destinations-store.js';
import { slugify } from '../lib/slug.js';

type PlaceSubmitBody = z.infer<typeof locationSubmitBodySchema>;

const uniqueDraftDestinationSlug = async (name: string): Promise<string> => {
  const base = slugify(name) || 'destination';
  let slug = base;
  let n = 0;
  while (await findDestinationBySlug(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
};

/** Published destination id, or a new draft hub from the host’s proposed name + pin. */
export const resolvePlaceSubmitDestination = async (
  body: PlaceSubmitBody
): Promise<{ destinationId: string; placeHubLabel: string }> => {
  const existingId = body.destinationId?.trim() || '';
  const placeHubLabelHint = body.placeHubLabel?.trim() || '';

  if (existingId) {
    const published = await findPublishedDestinationById(existingId);
    const anyRow = published ?? (await findDestinationById(existingId));
    if (!anyRow) {
      throw new ApiError(
        400,
        'destination_not_found',
        'Choose a published destination, or name a new one for this pin.'
      );
    }
    return { destinationId: anyRow.id, placeHubLabel: placeHubLabelHint || anyRow.name };
  }

  const proposed = body.proposedDestinationName?.trim() || '';
  if (!proposed || body.latitude == null || body.longitude == null) {
    throw new ApiError(
      400,
      'destination_not_found',
      'This pin isn’t in a listed destination. Pick an existing destination or name a new one.'
    );
  }

  const created = await createAdminDestination({
    slug: await uniqueDraftDestinationSlug(proposed),
    name: proposed,
    region: body.region.trim(),
    status: 'draft',
    center: { latitude: body.latitude, longitude: body.longitude },
    bounds: boundsRingFromCenter({ latitude: body.latitude, longitude: body.longitude }),
    countryCode: body.countryCode?.toUpperCase() || 'AE',
    summary: `Proposed with catalog place “${body.name.trim()}”.`,
  });
  return { destinationId: created.id, placeHubLabel: created.name };
};