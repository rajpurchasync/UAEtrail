import { describe, expect, it, vi } from 'vitest';
import { LIST_PAGE_SIZE, fetchAllPages } from './listAllPages';

describe('fetchAllPages', () => {
  it('walks pages of 100 until meta.total is reached', async () => {
    const load = vi.fn(async (page: number) => ({
      data: page === 1 ? Array.from({ length: LIST_PAGE_SIZE }, (_, index) => index) : [100],
      meta: { total: 101 },
    }));
    const rows = await fetchAllPages(load);
    expect(rows).toHaveLength(101);
    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenNthCalledWith(1, 1, LIST_PAGE_SIZE);
  });
});
