import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';
import { COLLECTIONS } from './collections.js';

export type MongoWeatherCacheDoc = {
  _id: string;
  /** Open-Meteo daily response slice + normalized hints for the UI. */
  data: unknown;
  expiresAt: Date;
  updatedAt: Date;
};

const weatherCacheCollection = (): Collection<MongoWeatherCacheDoc> =>
  getMongoClient()!.db().collection<MongoWeatherCacheDoc>(COLLECTIONS.WEATHER_CACHE);

export const weatherCacheKey = (input: { lat: number; lng: number; date: string }): string =>
  `${input.lat.toFixed(4)}:${input.lng.toFixed(4)}:${input.date}`;

export const findWeatherCacheById = async (id: string): Promise<MongoWeatherCacheDoc | null> =>
  weatherCacheCollection().findOne({ _id: id });

export const upsertWeatherCache = async (input: {
  id: string;
  data: unknown;
  expiresAt: Date;
}): Promise<void> => {
  const now = new Date();
  await weatherCacheCollection().updateOne(
    { _id: input.id },
    { $set: { data: input.data, expiresAt: input.expiresAt, updatedAt: now } },
    { upsert: true }
  );
};
