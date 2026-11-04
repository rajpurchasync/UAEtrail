import { useEffect } from 'react';
import { AppSelect, ADMIN_FILTER_SELECT_CLASS } from '../ui/AppSelect';

export const ADMIN_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export type AdminPageSize = (typeof ADMIN_PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_ADMIN_PAGE_SIZE: AdminPageSize = 20;

const PAGE_SIZE_SELECT_OPTIONS = ADMIN_PAGE_SIZE_OPTIONS.map((size) => ({
  value: String(size),
  label: `${size} / page`,
}));

type AdminTablePagerProps = {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize?: (pageSize: AdminPageSize) => void;
};

const toPositiveInt = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;

const buildPageList = (current: number, last: number): Array<number | 'ellipsis'> => {
  if (!Number.isFinite(last) || last < 1) return [1];
  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1);
  }
  const items: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  if (start > 2) items.push('ellipsis');
  for (let n = start; n <= end; n += 1) items.push(n);
  if (end < last - 1) items.push('ellipsis');
  items.push(last);
  return items;
};

export const paginateRows = <T,>(rows: T[], page: number, pageSize: number): T[] => {
  const start = (Math.max(1, page) - 1) * pageSize;
  return rows.slice(start, start + pageSize);
};

export const AdminTablePager = ({ page, pageSize, total, onPage, onPageSize }: AdminTablePagerProps) => {
  const size = toPositiveInt(pageSize, DEFAULT_ADMIN_PAGE_SIZE);
  const count = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
  const last = Math.max(1, Math.ceil(count / size));
  const safePage = Math.min(Math.max(1, toPositiveInt(page, 1)), last);
  const from = count === 0 ? 0 : (safePage - 1) * size + 1;
  const to = Math.min(safePage * size, count);
  const pages = buildPageList(safePage, last).filter((item) => item === 'ellipsis' || Number.isFinite(item));

  useEffect(() => {
    if (page !== safePage) onPage(safePage);
  }, [page, safePage, onPage]);

  const navButtonClass =
    'rounded-lg border border-gray-200 px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 disabled:opacity-50';

  const pageButtonClass = (active: boolean) =>
    `min-w-[2rem] rounded-lg border px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
      active
        ? 'border-emerald-600 bg-emerald-600 text-white'
        : 'border-gray-200 bg-white text-gray-800 hover:bg-emerald-50'
    }`;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-neutral-600">
        {count === 0 ? 'No results' : `Showing ${from}–${to} of ${count}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSize ? (
          <AppSelect
            value={String(size)}
            onChange={(value) => {
              const next = Number(value);
              if (ADMIN_PAGE_SIZE_OPTIONS.includes(next as AdminPageSize)) onPageSize(next as AdminPageSize);
            }}
            options={PAGE_SIZE_SELECT_OPTIONS}
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Rows per page"
          />
        ) : null}
        <button
          type="button"
          disabled={safePage === 1}
          onClick={() => onPage(safePage - 1)}
          className={navButtonClass}
        >
          Previous
        </button>
        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              className={pageButtonClass(item === safePage)}
              aria-current={item === safePage ? 'page' : undefined}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          disabled={safePage >= last}
          onClick={() => onPage(safePage + 1)}
          className={navButtonClass}
        >
          Next
        </button>
      </div>
    </div>
  );
};
