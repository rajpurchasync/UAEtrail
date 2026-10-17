import {
  listAdminFacilitiesPaged,
} from '../lib/facilities-store.js';
import { toFacilityDto } from '../lib/facility-mappers.js';

export const listAdminFacilitiesPage = async (input: { page: number; pageSize: number }) => {
  const { items, total } = await listAdminFacilitiesPaged({
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  });
  return { items: items.map((f) => toFacilityDto(f)), total };
};
