import type { ReferralClickEntityKind } from '@uaetrail/shared-types';
import type { Document } from 'mongodb';
import { COLLECTIONS } from '../lib/collections.js';
import { findFacilityById } from '../lib/facilities-store.js';
import { getMongoClient } from '../lib/mongo.js';
import { ApiError } from '../lib/api-error.js';

const normalizeUrl = (value: string): string => value.trim();

export const recordReferralClick = async (input: {
  entityKind: ReferralClickEntityKind;
  entityId: string;
  destinationUrl: string;
  source: string;
  viewerUserId: string | null;
}): Promise<void> => {
  const destinationUrl = normalizeUrl(input.destinationUrl);
  if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
    throw new ApiError(400, 'invalid_destination', 'destinationUrl must be an http(s) URL.');
  }

  if (input.entityKind === 'facility') {
    const facility = await findFacilityById(input.entityId);
    if (!facility) {
      throw new ApiError(404, 'entity_not_found', 'Facility not found.');
    }
    const expected = facility.partnerReferralUrl?.trim();
    if (!expected || normalizeUrl(expected) !== destinationUrl) {
      throw new ApiError(400, 'referral_mismatch', 'Referral URL does not match this facility.');
    }
  } else {
    throw new ApiError(400, 'unsupported_entity', 'Unsupported referral entity kind.');
  }

  const now = new Date();
  await getMongoClient()!.db().collection(COLLECTIONS.REFERRAL_CLICKS).insertOne({
    entityKind: input.entityKind,
    entityId: input.entityId,
    destinationUrl,
    source: input.source,
    viewerUserId: input.viewerUserId,
    createdAt: now,
  } as Document);
};
