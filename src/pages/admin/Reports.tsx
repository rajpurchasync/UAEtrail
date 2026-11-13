import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import type { AdminContentReportEntry } from '../../api/types';
import { fetchAdminContentReports, resolveAdminContentReport } from '../../hooks/adminConsoleApi';
import { DashboardLayout } from '../../components/layout';
import { AdminTablePager, DEFAULT_ADMIN_PAGE_SIZE, type AdminPageSize } from '../../components/admin/AdminTablePager';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { AdminConfirmSheet } from '../../components/admin/AdminConfirmSheet';
import { ADMIN_LINKS } from '../../constants';
import { ADMIN_USERS_PATH } from '../../config/adminSurfacePaths';
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

const STATUS_OPTIONS = [
  { value: 'open' as const, label: 'Open' },
  { value: 'resolved' as const, label: 'Resolved' },
  { value: 'dismissed' as const, label: 'Dismissed' },
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
  const [status, setStatus] = useState('open');
  const [reporterQuery, setReporterQuery] = useState('');
  const [reporterApplied, setReporterApplied] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [actionTarget, setActionTarget] = useState<{
    report: AdminContentReportEntry;
    next: 'resolved' | 'dismissed';
  } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const loadReports = async (isActive: () => boolean = () => true) => {
    setLoading(true);
    try {
      const res = await fetchAdminContentReports({
        page,
        pageSize,
        reason: reason || undefined,
        targetType: targetType || undefined,
        status: status || undefined,
        reporter: reporterApplied || undefined,
        from: dateToIso(fromDate, false),
        to: dateToIso(toDate, true),
      });
      if (!isActive()) return;
      setReports(res.data);
      setTotal(res.pagination?.total ?? 0);
      setError(null);
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
    status,
    reporterApplied,
    fromDate,
    toDate,
  ]);

  const applyResolve = async () => {
    if (!actionTarget) return;
    setBusy(true);
    try {
      await resolveAdminContentReport(actionTarget.report.id, actionTarget.next, note || undefined);
      setActionTarget(null);
      setNote('');
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update report');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout title="Reports" links={ADMIN_LINKS}>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Member reports</h2>
          <p className="text-sm text-neutral-500">
            Spam, harassment, and other issues — triage open items, then resolve or dismiss.
          </p>
        </div>

        <AdminFilterBar
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setReporterApplied(reporterQuery.trim());
          }}
          onClear={() => {
            setFromDate('');
            setToDate('');
            setReporterQuery('');
            setReporterApplied('');
            setStatus('');
            setReason('');
            setTargetType('');
            setPage(1);
          }}
          actions={
            <button type="submit" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800">
              Apply
            </button>
          }
        >
          <label className="text-xs text-neutral-500">
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
          <label className="text-xs text-neutral-500">
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
          <label className="text-xs text-neutral-500">
            Reporter
            <input
              type="search"
              value={reporterQuery}
              onChange={(e) => setReporterQuery(e.target.value)}
              placeholder="ID / name / email"
              className={`${ADMIN_INPUT_CLASS} mt-1 block w-56`}
            />
          </label>
          <AppSelect
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Filter by status"
          />
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
        </AdminFilterBar>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="rounded-2xl border border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">
            No reports in this filter.
          </p>
        ) : (
          <div className="space-y-3 md:hidden">
            {reports.map((report) => (
              <article key={report.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-800">
                    {reasonLabel[report.reason]}
                  </span>
                  <span className="text-xs text-neutral-400">{formatAdminDate(report.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-neutral-900">
                  {report.reporter.displayName ?? report.reporter.email}
                </p>
                <p className="text-xs uppercase text-neutral-400">
                  {report.targetType} · {report.status}
                </p>
                <p className="mt-1 break-all font-mono text-xs text-neutral-600">{report.targetId}</p>
                <p className="mt-2 text-sm text-neutral-600">{report.details ?? '—'}</p>
                {report.status === 'open' ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                      onClick={() => setActionTarget({ report, next: 'resolved' })}
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-800"
                      onClick={() => setActionTarget({ report, next: 'dismissed' })}
                    >
                      Dismiss
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}

        {!loading && reports.length > 0 ? (
          <div className="hidden overflow-x-auto rounded-2xl border border-neutral-200 bg-white md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {reports.map((report) => (
                  <tr key={report.id} className="align-top hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                      {formatAdminDate(report.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">
                        {report.reporter.displayName ?? report.reporter.email}
                      </p>
                      <Link
                        to={`${ADMIN_USERS_PATH}?search=${encodeURIComponent(report.reporter.email)}`}
                        className="text-xs text-emerald-700 hover:underline"
                      >
                        {report.reporter.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-800">
                        {reasonLabel[report.reason]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      <span className="text-xs uppercase text-neutral-400">{report.targetType}</span>
                      <p className="break-all font-mono text-xs">{report.targetId}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold uppercase text-neutral-600">{report.status}</td>
                    <td className="max-w-xs px-4 py-3 text-neutral-600">{report.details ?? '—'}</td>
                    <td className="px-4 py-3">
                      {report.status === 'open' ? (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            className="text-left text-xs font-semibold text-emerald-700"
                            onClick={() => setActionTarget({ report, next: 'resolved' })}
                          >
                            Resolve
                          </button>
                          <button
                            type="button"
                            className="text-left text-xs font-semibold text-neutral-600"
                            onClick={() => setActionTarget({ report, next: 'dismissed' })}
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">{report.resolutionNote || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

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

      <AdminConfirmSheet
        open={Boolean(actionTarget)}
        title={actionTarget?.next === 'resolved' ? 'Resolve report?' : 'Dismiss report?'}
        description="This closes the queue item. You can still find it under Resolved / Dismissed filters."
        confirmLabel={actionTarget?.next === 'resolved' ? 'Resolve' : 'Dismiss'}
        danger={actionTarget?.next === 'dismissed'}
        busy={busy}
        onCancel={() => {
          setActionTarget(null);
          setNote('');
        }}
        onConfirm={() => void applyResolve()}
      >
        <label className="block text-xs text-neutral-500">
          Note (optional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>
      </AdminConfirmSheet>
    </DashboardLayout>
  );
};
