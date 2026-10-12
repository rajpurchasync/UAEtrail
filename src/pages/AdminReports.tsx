import { useEffect, useState } from 'react';
import type { AdminContentReportEntry } from '../api/types';
import { fetchAdminContentReports } from '../hooks/adminConsoleApi';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';

const reasonLabel: Record<AdminContentReportEntry['reason'], string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  other: 'Other',
};

export const AdminReports = () => {
  const [reports, setReports] = useState<AdminContentReportEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminContentReports(page, 25);
      setReports(res.data);
      setTotal(res.pagination?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / 25));

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Member reports</h2>
          <p className="text-sm text-gray-500">Spam, harassment, and other issues submitted in chat and across the app.</p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-gray-500">No reports yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3">Report as</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <tr key={report.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {report.reporter.displayName ?? report.reporter.email}
                      </p>
                      <p className="text-xs text-gray-500">{report.reporter.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-800">
                        {reasonLabel[report.reason]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="text-xs uppercase text-gray-400">{report.targetType}</span>
                      <p className="font-mono text-xs break-all">{report.targetId}</p>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-gray-600">{report.details ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-gray-500">Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};
