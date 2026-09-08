import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export const paginatedResponse = <T>(data: T[], total: number, params: PaginationParams) => ({
  data,
  meta: {
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize)
  }
});
