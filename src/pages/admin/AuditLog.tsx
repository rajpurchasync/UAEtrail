import { useMemo, useState } from 'react';
import { useAdminAuditLogs } from '../../hooks/useAdminConsoleQueries';
import { DashboardLayout } from '../../components/layout';
import { AdminTablePager, DEFAULT_ADMIN_PAGE_SIZE, type AdminPageSize } from '../../components/admin/AdminTablePager';
import { ADMIN_LINKS } from '../../constants';
import { AppSelect, ADMIN_FILTER_SELECT_CLASS, ADMIN_INPUT_CLASS } from '../../components/ui/AppSelect';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { formatAdminDateTime } from '../../utils/formatAdminDate';
import { useDisplayPreferences } from '../../preferences/useDisplayPreferences';

const ACTION_FILTER_OPTIONS = [
  { value: 'create' as const, label: 'Create' },
  { value: 'update' as const, label: 'Update' },
  { value: 'delete' as const, label: 'Delete' },
  { value: 'approve' as const, label: 'Approve' },
  { value: 'reject' as const, label: 'Reject' },
  { value: 'suspend' as const, label: 'Suspend' },
  { value: 'activate' as const, label: 'Activate' },
  { value: 'moderate' as const, label: 'Moderate' },
  { value: 'content_report' as const, label: 'Content reports' },
  { value: 'broadcast' as const, label: 'Broadcast' },
];

const ENTITY_FILTER_OPTIONS = [
  { value: 'user' as const, label: 'Member' },
  { value: 'tenant' as const, label: 'Tenant' },
  { value: 'activity' as const, label: 'Activity' },
  { value: 'location' as const, label: 'Place' },
  { value: 'application' as const, label: 'Application' },
  { value: 'product' as const, label: 'Product' },
  { value: 'notification' as const, label: 'Notification' },
  { value: 'post' as const, label: 'Post (legacy feed)' },
  { value: 'review' as const, label: 'Review' },
  { value: 'message' as const, label: 'Message' },
  { value: 'reply' as const, label: 'Reply (legacy feed)' },
];

const datetimeLocalToIso = (value: string, endOfDay: boolean): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay && value.length === 10) date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

export const AuditLog = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actorQuery, setActorQuery] = useState('');
  const [actorApplied, setActorApplied] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { clock } = useDisplayPreferences();

  const auditQueryInput = useMemo(
    () => ({
      page,
      pageSize,
      action: actionFilter,
      entityType: entityFilter,
      actor: actorApplied,
      from: datetimeLocalToIso(fromDate, false) ?? '',
      to: datetimeLocalToIso(toDate, true) ?? '',
    }),
    [page, pageSize, actionFilter, entityFilter, actorApplied, fromDate, toDate]
  );

  const {
    data: auditPayload,
    isPending: loading,
    error: loadError,
  } = useAdminAuditLogs(auditQueryInput);
  const logs = auditPayload?.data ?? [];
  const total = auditPayload?.total ?? 0;
  const error =
    loadError instanceof Error ? loadError.message : loadError ? 'Failed to load audit logs' : null;

  const actionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      approve: 'bg-emerald-100 text-emerald-800',
      reject: 'bg-orange-100 text-orange-800',
      suspend: 'bg-red-100 text-red-800',
      activate: 'bg-green-100 text-green-800',
      moderate: 'bg-purple-100 text-purple-800',
      content_report: 'bg-rose-100 text-rose-800',
      login: 'bg-gray-100 text-gray-800',
      broadcast: 'bg-indigo-100 text-indigo-800'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[action] ?? 'bg-gray-100 text-gray-800'}`}>{action}</span>;
  };

  const entityBadge = (type: string) => {
    const colors: Record<string, string> = {
      user: 'bg-blue-50 text-blue-700',
      tenant: 'bg-purple-50 text-purple-700',
      event: 'bg-emerald-50 text-emerald-700',
      location: 'bg-amber-50 text-amber-700',
      application: 'bg-cyan-50 text-cyan-700',
      product: 'bg-pink-50 text-pink-700',
      notification: 'bg-indigo-50 text-indigo-700'
    };
    return <span className={`px-2 py-0.5 rounded text-xs ${colors[type] ?? 'bg-gray-50 text-gray-700'}`}>{type}</span>;
  };

  return (
    <DashboardLayout title="Audit Log" links={ADMIN_LINKS}>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
          <p className="text-sm text-neutral-500">Filter by date, actor, action, or entity type.</p>
        </div>

        <AdminFilterBar
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setActorApplied(actorQuery.trim());
          }}
          onClear={() => {
            setFromDate('');
            setToDate('');
            setActorQuery('');
            setActorApplied('');
            setActionFilter('');
            setEntityFilter('');
            setPage(1);
          }}
          actions={
            <button type="submit" className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
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
            Actor
            <input
              type="search"
              value={actorQuery}
              onChange={(e) => setActorQuery(e.target.value)}
              placeholder="ID / name / email / phone"
              className={`${ADMIN_INPUT_CLASS} mt-1 block w-56`}
            />
          </label>
          <AppSelect
            value={actionFilter}
            onChange={(value) => {
              setActionFilter(value);
              setPage(1);
            }}
            options={ACTION_FILTER_OPTIONS}
            placeholder="All Actions"
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Filter by action"
          />
          <AppSelect
            value={entityFilter}
            onChange={(value) => {
              setEntityFilter(value);
              setPage(1);
            }}
            options={ENTITY_FILTER_OPTIONS}
            placeholder="All Entities"
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Filter by entity"
          />
        </AdminFilterBar>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Timestamp</th>
                <th className="px-4 py-3 text-left">Actor</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Entity</th>
                <th className="px-4 py-3 text-left">Entity ID</th>
                <th className="px-4 py-3 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />Loading...
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No audit log entries found</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                    {formatAdminDateTime(log.createdAt, clock)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{log.actorName || 'System'}</p>
                    <p className="text-xs text-gray-500">{log.actorEmail}</p>
                  </td>
                  <td className="px-4 py-3">{actionBadge(log.action)}</td>
                  <td className="px-4 py-3">{entityBadge(log.entityType)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono break-all max-w-[120px]">{log.entityId}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px]">
                    {log.metadata ? (
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-800">View</summary>
                        <pre className="mt-1 text-xs bg-gray-50 rounded p-2 whitespace-pre-wrap overflow-auto max-h-32">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
