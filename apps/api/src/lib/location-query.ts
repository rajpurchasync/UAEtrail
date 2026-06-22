import { Location, LocationStatus, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

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

const haversineKm = (lat: number, lng: number) => Prisma.sql`
  (6371 * acos(LEAST(1::double precision, GREATEST(-1::double precision,
    cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng}))
    + sin(radians(${lat})) * sin(radians(latitude))
  ))))`;

const buildWhereConditions = (filters: LocationListFilters): Prisma.Sql[] => {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`status = ${LocationStatus.ACTIVE}::"LocationStatus"`
  ];

  if (filters.activityType) {
    const activity = filters.activityType === 'hiking' ? 'HIKING' : 'CAMPING';
    conditions.push(Prisma.sql`"activityType" = ${activity}::"ActivityType"`);
  }
  if (filters.featured !== undefined) {
    conditions.push(Prisma.sql`featured = ${filters.featured}`);
  }
  if (filters.countryCode) {
    conditions.push(Prisma.sql`"countryCode" = ${filters.countryCode.toUpperCase()}`);
  }
  if (filters.lat != null && filters.lng != null) {
    const radiusKm = filters.radius ?? 50;
    conditions.push(Prisma.sql`latitude IS NOT NULL`);
    conditions.push(Prisma.sql`longitude IS NOT NULL`);
    conditions.push(Prisma.sql`${haversineKm(filters.lat, filters.lng)} <= ${radiusKm}`);
  }

  return conditions;
};

export async function listActiveLocations(
  filters: LocationListFilters
): Promise<{ items: Location[]; total: number }> {
  const offset = (filters.page - 1) * filters.pageSize;
  const whereClause = Prisma.join(buildWhereConditions(filters), ' AND ');

  if (filters.lat != null && filters.lng != null) {
    const countRows = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count FROM "Location" WHERE ${whereClause}
    `;
    const total = Number(countRows[0]?.count ?? 0);

    const idRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Location"
      WHERE ${whereClause}
      ORDER BY featured DESC, "createdAt" DESC
      LIMIT ${filters.pageSize} OFFSET ${offset}
    `;

    const ids = idRows.map((row) => row.id);
    if (ids.length === 0) {
      return { items: [], total };
    }

    const locations = await prisma.location.findMany({ where: { id: { in: ids } } });
    const order = new Map(ids.map((id, index) => [id, index]));
    locations.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return { items: locations, total };
  }

  const where: Prisma.LocationWhereInput = {
    status: LocationStatus.ACTIVE,
    ...(filters.activityType
      ? { activityType: filters.activityType === 'hiking' ? 'HIKING' : 'CAMPING' }
      : {}),
    ...(filters.featured !== undefined ? { featured: filters.featured } : {}),
    ...(filters.countryCode ? { countryCode: filters.countryCode.toUpperCase() } : {})
  };

  const [items, total] = await Promise.all([
    prisma.location.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      skip: offset,
      take: filters.pageSize
    }),
    prisma.location.count({ where })
  ]);

  return { items, total };
}
