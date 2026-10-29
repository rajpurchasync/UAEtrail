type AdminTablePagerProps = {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
};

export const AdminTablePager = ({ page, pageSize, total, onPage }: AdminTablePagerProps) => {
  if (total <= pageSize) return null;
  const last = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm text-neutral-600">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= last}
          onClick={() => onPage(page + 1)}
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};
