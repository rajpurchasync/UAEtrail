import type { VerificationDocumentType } from '@uaetrail/shared-types';
import { COLLECTIONS } from '../lib/collections.js';
import { newEntityId } from '../lib/entity-builders.js';
import { getMongoClient } from '../lib/mongo.js';

type VerificationRow = {
  _id: string;
  organizerId: string;
  docType: VerificationDocumentType;
  fileKey: string;
  status: 'pending' | 'accepted' | 'rejected';
  expiresAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

const col = () => getMongoClient()!.db().collection<VerificationRow>(COLLECTIONS.VERIFICATION_DOCUMENTS);

const toDto = (row: VerificationRow) => ({
  id: row._id,
  organizerId: row.organizerId,
  docType: row.docType,
  fileKey: row.fileKey,
  status: row.status,
  expiresAt: row.expiresAt ?? null,
  reviewedBy: row.reviewedBy ?? null,
  createdAt: row.createdAt,
});

export const listMyVerificationDocuments = async (organizerId: string) => {
  const rows = await col().find({ organizerId }).sort({ createdAt: -1 }).limit(50).toArray();
  return rows.map(toDto);
};

export const submitVerificationDocument = async (input: {
  organizerId: string;
  docType: VerificationDocumentType;
  fileKey?: string;
}) => {
  const id = newEntityId();
  const now = new Date().toISOString();
  const row: VerificationRow = {
    _id: id,
    organizerId: input.organizerId,
    docType: input.docType,
    fileKey: input.fileKey?.trim() || `verification/${input.organizerId}/${id}`,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  await col().insertOne(row);
  return toDto(row);
};

export const listPendingVerificationDocuments = async () => {
  const rows = await col().find({ status: 'pending' }).sort({ createdAt: 1 }).limit(100).toArray();
  return rows.map(toDto);
};

export const reviewVerificationDocument = async (input: {
  id: string;
  reviewerId: string;
  status: 'accepted' | 'rejected';
}) => {
  const now = new Date().toISOString();
  const result = await col().findOneAndUpdate(
    { _id: input.id },
    { $set: { status: input.status, reviewedBy: input.reviewerId, updatedAt: now } },
    { returnDocument: 'after' }
  );
  return result ? toDto(result) : null;
};
