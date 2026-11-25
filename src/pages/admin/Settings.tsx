import { useMemo, useState } from 'react';
import { sendAdminNotificationBroadcast } from '../../hooks/adminConsoleApi';
import { useAdminNotificationBroadcasts } from '../../hooks/useAdminConsoleQueries';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import { AppSelect, ADMIN_FILTER_SELECT_CLASS, ADMIN_INPUT_CLASS, ADMIN_SELECT_CLASS } from '../../components/ui/AppSelect';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { AdminTablePager, DEFAULT_ADMIN_PAGE_SIZE, paginateRows, type AdminPageSize } from '../../components/admin/AdminTablePager';
import { formatAdminDate } from '../../utils/formatAdminDate';

const BROADCAST_TARGET_OPTIONS = [
  { value: 'all' as const, label: 'All Active Users' },
  { value: 'participant' as const, label: 'Participants Only' },
  { value: 'tenant_owner' as const, label: 'Tenant Owners Only' },
  { value: 'tenant_admin' as const, label: 'Tenant Admins Only' },
  { value: 'tenant_guide' as const, label: 'Guides Only' },
];

/** Platform broadcast ops (sidebar label: Broadcast). */
export const Settings = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    data: history = [],
    isPending: loadingHistory,
    refetch: refetchHistory,
  } = useAdminNotificationBroadcasts();
  const [confirmSend, setConfirmSend] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [historySearch, setHistorySearch] = useState('');
  const [historyAudience, setHistoryAudience] = useState('');

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await sendAdminNotificationBroadcast({
        title,
        body,
        targetRole: targetRole === 'all' ? undefined : targetRole
      });
      setSuccess('Notification sent successfully!');
      setTitle('');
      setBody('');
      setTargetRole('all');
      setConfirmSend(false);
      await refetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
      setConfirmSend(false);
    } finally {
      setSending(false);
    }
  };

  const canSend = title.trim().length >= 3 && body.trim().length >= 5;

  const filteredHistory = useMemo(() => {
    return history.filter((row) => {
      if (historyAudience && row.targetRole !== historyAudience) return false;
      if (!historySearch.trim()) return true;
      const q = historySearch.trim().toLowerCase();
      return row.title.toLowerCase().includes(q) || row.body.toLowerCase().includes(q);
    });
  }, [history, historySearch, historyAudience]);

  return (
    <DashboardLayout title="Broadcast" links={ADMIN_LINKS}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Broadcast</h2>
          <p className="text-sm text-neutral-500">Send a one-shot notification to a role segment.</p>
        </div>

        {/* Broadcast Form */}
        <div className="max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="mb-4 font-medium text-neutral-900">Send broadcast notification</h3>

          {error && <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded">{error}</p>}
          {success && <p className="text-emerald-700 text-sm mb-3 bg-emerald-50 px-3 py-2 rounded">{success}</p>}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g. Schedule Maintenance Notice" maxLength={100} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Message *</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Write the notification message..." rows={4} maxLength={500} />
              <p className="text-xs text-gray-400 mt-1">{body.length}/500 characters</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Target Audience</label>
              <AppSelect
                value={targetRole}
                onChange={setTargetRole}
                options={BROADCAST_TARGET_OPTIONS}
                inputClassName={ADMIN_SELECT_CLASS}
                aria-label="Target audience"
              />
            </div>

            <button onClick={() => setConfirmSend(true)} disabled={!canSend || sending}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </div>

        {/* Send Confirmation */}
        {confirmSend && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmSend(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Send Notification?</h3>
              <p className="text-sm text-gray-600 mb-1">This will send a notification to <strong>{targetRole === 'all' ? 'all active users' : targetRole.replace(/_/g, ' ') + 's'}</strong>.</p>
              <div className="bg-gray-50 rounded-lg p-3 mt-3 mb-4">
                <p className="font-medium text-sm text-gray-900">{title}</p>
                <p className="text-sm text-gray-600 mt-1">{body}</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmSend(false)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSend} disabled={sending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50">
                  {sending ? 'Sending...' : 'Confirm & Send'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Broadcast History */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Recent Broadcasts</h3>
          <AdminFilterBar
            onClear={() => {
              setHistorySearch('');
              setHistoryAudience('');
              setPage(1);
            }}
          >
            <label className="text-xs text-neutral-500">
              Search
              <input
                type="search"
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Title or message…"
                className={`${ADMIN_INPUT_CLASS} mt-1 block w-56`}
              />
            </label>
            <AppSelect
              value={historyAudience}
              onChange={(value) => {
                setHistoryAudience(value);
                setPage(1);
              }}
              options={BROADCAST_TARGET_OPTIONS}
              placeholder="All audiences"
              inputClassName={ADMIN_FILTER_SELECT_CLASS}
              aria-label="Filter broadcasts by audience"
            />
          </AdminFilterBar>
          <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Message</th>
                  <th className="px-4 py-3 text-left">Audience</th>
                  <th className="px-4 py-3 text-center">Recipients</th>
                </tr>
              </thead>
              <tbody>
                {loadingHistory ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />Loading...
                  </td></tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      {history.length === 0 ? 'No broadcasts sent yet' : 'No broadcasts match these filters'}
                    </td>
                  </tr>
                ) : paginateRows(filteredHistory, page, pageSize).map((h) => (
                  <tr key={h.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{formatAdminDate(h.sentAt)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{h.title}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{h.body}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">{h.targetRole === 'all' ? 'Everyone' : h.targetRole}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{h.recipientCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminTablePager
            page={page}
            pageSize={pageSize}
            total={filteredHistory.length}
            onPage={setPage}
            onPageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};
