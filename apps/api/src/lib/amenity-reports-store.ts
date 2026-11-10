import { randomUUID } from 'node:crypto';
import type { Collection } from 'mongodb';
import type { AmenityState } from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { facilitiesCollection } from './facilities-store.js';
import { ApiError } from './api-error.js';

export type AmenityReportDoc = {
  _id: string;
  facilityId: string;
  amenityState: AmenityState;
  note?: string;
  photoUrl?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  submittedBy: string;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

const amenityStateReportLabel = (state: AmenityState): string => {
  if (state === 'working') return 'Working';
  if (state === 'not_working') return 'Not working / dry';
  return 'Unknown';
};

export const getFacilityAmenityReportSummary = async (
  facilityId: string
): Promise<{ pending: AmenityReportDoc | null; latest: AmenityReportDoc | null }> => {
  const [pending, latest] = await Promise.all([
    col().findOne({ facilityId, status: 'pending' }, { sort: { createdAt: -1 } }),
    col().findOne({ facilityId }, { sort: { createdAt: -1 } }),
  ]);
  return { pending, latest };
};

const col = (): Collection<AmenityReportDoc> =>
  getMongoClient()!.db().collection<AmenityReportDoc>(COLLECTIONS.AMENITY_REPORTS);

export const createAmenityReport = async (input: {
  facilityId: string;
  userId: string;
  amenityState: AmenityState;
  note?: string;
  photoUrl: string;
}): Promise<AmenityReportDoc> => {
  const facility = await facilitiesCollection().findOne({ _id: input.facilityId });
  if (!facility) throw new ApiError(404, 'facility_not_found', 'Facility not found.');
  const photoUrl = input.photoUrl.trim();
  if (!photoUrl) {
    throw new ApiError(400, 'photo_required', 'Add a photo of the condition.');
  }
  const duplicatePending = await col().findOne({
    facilityId: input.facilityId,
    status: 'pending',
    amenityState: input.amenityState,
  });
  if (duplicatePending) {
    const label = amenityStateReportLabel(input.amenityState);
    throw new ApiError(
      409,
      'amenity_review_in_progress',
      `A review is already in progress for “${label}”. You do not need to report again.`
    );
  }
  const now = new Date();
  const doc: AmenityReportDoc = {
    _id: randomUUID(),
    facilityId: input.facilityId,
    amenityState: input.amenityState,
    note: input.note,
    photoUrl,
    status: 'pending',
    submittedBy: input.userId,
    createdAt: now,
    updatedAt: now,
  };
  await col().insertOne(doc);
  return doc;
};

export const listPendingAmenityReports = async (): Promise<AmenityReportDoc[]> =>
  col().find({ status: 'pending' }).sort({ createdAt: 1 }).limit(100).toArray();

export const confirmAmenityReport = async (
  id: string,
  reviewerId: string
): Promise<AmenityReportDoc | null> => {
  const report = await col().findOne({ _id: id, status: 'pending' });
  if (!report) return null;
  const now = new Date();
  await facilitiesCollection().updateOne(
    { _id: report.facilityId },
    {
      $set: {
        amenityState: report.amenityState,
        amenityLastCheckedAt: now,
        updatedAt: now,
      },
    }
  );
  await col().updateOne(
    { _id: id },
    { $set: { status: 'confirmed', reviewedBy: reviewerId, updatedAt: now } }
  );
  return col().findOne({ _id: id });
};
