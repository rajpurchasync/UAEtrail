import { useState } from 'react';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import type { AdminContentReportEntry } from '../../api/types';
import { fetchAdminContentReports } from '../../hooks/adminConsoleApi';
import { DashboardLayout } from '../../components/layout';
import { AdminTablePager, DEFAULT_ADMIN_PAGE_SIZE, type AdminPageSize } from '../../components/admin/AdminTablePager';
import { ADMIN_LINKS } from '../../constants';
import { AppSelect, ADMIN_FILTER_SELECT_CLASS, ADMIN_INPUT_CLASS } from '../../components/ui/AppSelect';
import { formatAdminDate } from '../../utils/formatAdminDate';

const reasonLabel: Record<AdminContentReportEntry['reason'], string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  other: 'Other',
};

const REASON_OPTIONS = [
  { value: 'spam' as const, label: 'Spam' },
  { value: 'harassment' as const, label: 'Harassment' },
  { value: 'other' as const, label: 'Other' },
];

const TARGET_OPTIONS = [
  { value: 'user' as const, label: 'Member' },
  { value: 'message' as const, label: 'Message' },
  { value: 'review' as const, label: 'Review' },
  { value: 'post' as const, label: 'Post (legacy)' },
  { value: 'reply' as const, label: 'Reply (legacy)' },
];

const dateToIso = (value: string, endOfDay: boolean): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

export const Reports = () => {
  const [reports, setReports] = useState<AdminContentReportEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [targetType, setTargetType] = useState('');
  const [reporterQuery, setReporterQuery] = useState('');
  const [reporterApplied, setReporterApplied] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadReports = async (isActive: () => boolean = () => true) => {
    setLoading(true);
    try {
      const res = await fetchAdminContentReports({
        page,
        pageSize,
        reason: reason || undefined,
        targetType: targetType || undefined,
        reporter: reporterApplied || undefined,
        from: dateToIso(fromDate, false),
        to: dateToIso(toDate, true),
      });
      if (!isActive()) return;
      setReports(res.data);
      setTotal(res.pagination?.total ?? 0);
    } catch (err) {
      if (!isActive()) return;
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      if (isActive()) setLoading(false);
    }
  };

  useSafeAsyncEffect((isActive) => loadReports(isActive), [
    page,
    pageSize,
    reason,
    targetType,
    reporterApplied,
    fromDate,
    toDate,
  ]);

  return (
    <DashboardLayout title="Reports" links={ADMIN_LINKS}>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Member reports</h2>
          <p className="text-sm text-gray-500">Spam, harassment, and other issues submitted in chat and across the app.</p>
        </div>

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setReporterApplied(reporterQuery.trim());
          }}
        >
          <label className="text-xs text-gray-500">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className={`${ADMIN_INPUT_CLASS} mt-1 block`}
            />
          </label>
          <label className="text-xs text-gray-500">
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className={`${ADMIN_INPUT_CLASS} mt-1 block`}
            />
          </label>
          <label className="text-xs text-gray-500">
            Reporter ID / name / email / phone
            <input
              type="search"
              value={reporterQuery}
              onChange={(e) => setReporterQuery(e.target.value)}
              placeholder="Case insensitive"
              className={`${ADMIN_INPUT_CLASS} mt-1 block w-56`}
            />
          </label>
          <AppSelect
            value={reason}
            onChange={(value) => {
              setReason(value);
              setPage(1);
            }}
            options={REASON_OPTIONS}
            placeholder="All reasons"
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Filter by reason"
          />
          <AppSelect
            value={targetType}
            onChange={(value) => {
              setTargetType(value);
              setPage(1);
            }}
            options={TARGET_OPTIONS}
            placeholder="All targets"
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Filter by target type"
          />
          <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
            Apply
          </button>
        </form>

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
                  <tr key={report.id} className="align-top hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {formatAdminDate(report.createdAt)}
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

        <AdminTablePager
          page={page}
          pageSize={pageSize}
          total={total}
          onPage={setPage}
          onPageSize={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </DashboardLayout>
  );
};
