import { listAdminPlacesPaged } from '../lib/admin-store.js';
import { toLocationDto } from '../lib/mappers.js';

export const listAdminPlacesPage = async (input: { page: number; pageSize: number }) => {
  const { items: locations, total } = await listAdminPlacesPaged({
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  });
  return {
    total,
    items: locations.map((l) => toLocationDto(l, { admin: true })),
  };
};
