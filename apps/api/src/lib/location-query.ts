import type { Collection } from 'mongodb';
import type { Location } from '../domain/types.js';
import { LocationStatus } from '../domain/enums.js';
import { getMongoClient } from './mongo.js';
import { radiusKmToRadians, withLocationGeoFields } from './location-geo.js';
import { withQueryTiming } from './query-timing.js';

export interface LocationListFilters {
  activityType?: 'hiking' | 'camping';
  featured?: boolean;
  countryCode?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page: number;
  pageSize: number;
}

type MongoLocationDoc = Omit<Location, 'id'> & {
  _id: string;
  geo?: { type: 'Point'; coordinates: [number, number] };
};

const locationsCollection = (): Collection<MongoLocationDoc> =>
  getMongoClient()!.db().collection<MongoLocationDoc>('locations');

const mapMongoLocation = (item: MongoLocationDoc): Location => {
  const { _id, geo: _geo, ...rest } = item;
  return { id: _id, ...rest };
};

export const locationDocForMongo = (location: Location): MongoLocationDoc => {
  const { id, ...rest } = location;
  return withLocationGeoFields({ _id: id, ...rest }) as MongoLocationDoc;
};

export const syncLocationsToMongo = async (locations: Location[]): Promise<void> => {
  if (locations.length === 0) return;
  await Promise.all(
    locations.map((location) =>
      locationsCollection().updateOne(
        { _id: location.id },
        { $set: locationDocForMongo(location) },
        { upsert: true }
      )
    )
  );
};

const buildMongoFilter = (filters: LocationListFilters): Record<string, unknown> => {
  const query: Record<string, unknown> = {
    status: LocationStatus.ACTIVE
  };
  if (filters.activityType) {
    query.activityType = filters.activityType === 'hiking' ? 'HIKING' : 'CAMPING';
  }
  if (filters.featured !== undefined) {
    query.featured = filters.featured;
  }
  if (filters.countryCode) {
    query.countryCode = filters.countryCode.toUpperCase();
  }
  return query;
};

const listActiveLocationsFromMongoGeo = async (
  filters: LocationListFilters,
  offset: number
): Promise<{ items: Location[]; total: number }> => {
  const radiusKm = filters.radius ?? 50;
  const query = {
    ...buildMongoFilter(filters),
    geo: {
      $geoWithin: {
        $centerSphere: [[filters.lng!, filters.lat!], radiusKmToRadians(radiusKm)]
      }
    }
  };

  const [items, total] = await Promise.all([
    locationsCollection()
      .find(query)
      .sort({ featured: -1, createdAt: -1 })
      .skip(offset)
      .limit(filters.pageSize)
      .toArray(),
    locationsCollection().countDocuments(query)
  ]);

  return { items: items.map(mapMongoLocation), total };
};

const listActiveLocationsFromMongo = async (
  filters: LocationListFilters,
  offset: number
): Promise<{ items: Location[]; total: number }> => {
  const query = buildMongoFilter(filters);

  const [items, total] = await Promise.all([
    locationsCollection()
      .find(query)
      .sort({ featured: -1, createdAt: -1 })
      .skip(offset)
      .limit(filters.pageSize)
      .toArray(),
    locationsCollection().countDocuments(query)
  ]);

  return { items: items.map(mapMongoLocation), total };
};

export async function listActiveLocations(
  filters: LocationListFilters
): Promise<{ items: Location[]; total: number }> {
  const offset = (filters.page - 1) * filters.pageSize;

  return withQueryTiming('listActiveLocations', async () => {
    if (filters.lat != null && filters.lng != null) {
      return listActiveLocationsFromMongoGeo(filters, offset);
    }

    return listActiveLocationsFromMongo(filters, offset);
  });
}
