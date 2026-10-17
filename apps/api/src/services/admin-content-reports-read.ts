import { listContentReportsAdmin } from '../lib/content-reports-store.js';

export const listAdminContentReports = async (input: { page: number; pageSize: number }) => {
  const { items, total } = await listContentReportsAdmin({
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  });
  return { items, total };
};
