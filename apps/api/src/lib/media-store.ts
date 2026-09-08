import { randomUUID } from 'crypto';
import type { MediaAsset } from '../domain/types.js';
import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';

type MongoMediaAsset = {
  _id: string;
  key: string;
  url: string;
  bucket: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  tenantId: string | null;
  kind: string;
  createdAt: Date;
};

const mediaAssetsCollection = (): Collection<MongoMediaAsset> =>
  getMongoClient()!.db().collection<MongoMediaAsset>('media_assets');

const mapMediaAsset = (doc: MongoMediaAsset): MediaAsset => ({
  id: doc._id,
  key: doc.key,
  url: doc.url,
  bucket: doc.bucket,
  mimeType: doc.mimeType,
  size: doc.size,
  uploadedById: doc.uploadedById,
  tenantId: doc.tenantId,
  kind: doc.kind,
  createdAt: doc.createdAt
});

export const createMediaAssetRecord = async (input: {
  key: string;
  url: string;
  bucket: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  tenantId?: string;
  kind: string;
}): Promise<MediaAsset> => {
  const doc: MongoMediaAsset = {
    _id: randomUUID(),
    key: input.key,
    url: input.url,
    bucket: input.bucket,
    mimeType: input.mimeType,
    size: input.size,
    uploadedById: input.uploadedById,
    tenantId: input.tenantId ?? null,
    kind: input.kind,
    createdAt: new Date()
  };
  await mediaAssetsCollection().insertOne(doc);
  return mapMediaAsset(doc);
};

export const findMediaAssetByKey = async (key: string): Promise<MediaAsset | null> => {
  const doc = await mediaAssetsCollection().findOne({ key });
  return doc ? mapMediaAsset(doc) : null;
};
