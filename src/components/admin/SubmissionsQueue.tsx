import { useCallback, useState } from 'react';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import { fetchAdminSubmissions, reviewAdminSubmission } from '../../hooks/geoHierarchyClientApi';

type QueueRow = {
  id: string;
  kind: string;
  status: string;
  name: string;
  insisted?: { reason: string };
  submittedBy: string;
};

/** Thin always-review queue on Admin Places — no extra admin nav item. */
export const SubmissionsQueue = () => {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (isActive?: () => boolean) => {
    try {
      const res = await fetchAdminSubmissions();
      if (isActive && !isActive()) return;
      setRows(res.data);
      setError(null);
    } catch (err) {
      if (isActive && !isActive()) return;
      setError(err instanceof Error ? err.message : 'Could not load suggestions.');
    }
  }, []);

  useSafeAsyncEffect(async (isActive) => {
    await load(isActive);
  }, [load]);

  const review = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      await reviewAdminSubmission(id, action);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed.');
    } finally {
      setBusyId(null);
    }
  };

  if (rows.length === 0 && !error) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <h2 className="text-sm font-semibold text-amber-950">Pending map suggestions</h2>
      <p className="mt-1 text-xs text-amber-900">
        Member-submitted trails, camps, facilities, and areas stay pending until you approve.
      </p>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{row.name || 'Untitled'}</p>
              <p className="text-xs text-gray-500">
                {row.kind}
                {row.insisted?.reason ? ` · insisted: ${row.insisted.reason}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => void review(row.id, 'approve')}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => void review(row.id, 'reject')}
                className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
