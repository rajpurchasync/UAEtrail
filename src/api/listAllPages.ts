/** Matches API `paginationSchema` max pageSize. */
export const LIST_PAGE_SIZE = 100;

/** Admin tables — one server page; do not concatenate all pages in the client. */
export const ADMIN_TABLE_PAGE_SIZE = 50;

type PageResult<T> = {
  data: T[];
  meta?: { total?: number };
};

export const fetchAllPages = async <T>(
  load: (page: number, pageSize: number) => Promise<PageResult<T>>
): Promise<T[]> => {
  const all: T[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (all.length < total && page <= 50) {
    const response = await load(page, LIST_PAGE_SIZE);
    all.push(...response.data);
    total = response.meta?.total ?? (response.data.length < LIST_PAGE_SIZE ? all.length : total);
    if (response.data.length === 0) break;
    page += 1;
  }

  return all;
};
