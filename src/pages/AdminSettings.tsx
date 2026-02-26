import { useEffect, useState } from 'react';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';

interface BroadcastHistory {
  id: string;
  title: string;
  body: string;
  targetRole: string;
  sentAt: string;
  recipientCount: number;
}

export const AdminSettings = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<BroadcastHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [confirmSend, setConfirmSend] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getAdminNotifications();
      setHistory((res.data ?? []) as unknown as BroadcastHistory[]);
    } catch {
      // silent fail for history
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await api.sendAdminNotification({
        title,
        body,
        targetRole: targetRole === 'all' ? undefined : targetRole
      });
      setSuccess('Notification sent successfully!');
      setTitle('');
      setBody('');
      setTargetRole('all');
      setConfirmSend(false);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
      setConfirmSend(false);
    } finally {
      setSending(false);
    }
  };

  const canSend = title.trim().length >= 3 && body.trim().length >= 5;

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Notifications & Settings</h2>

        {/* Broadcast Form */}
        <div className="bg-white border rounded-lg p-6 max-w-2xl">
          <h3 className="font-medium text-gray-900 mb-4">Send Broadcast Notification</h3>

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
              <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="all">All Active Users</option>
                <option value="visitor">Visitors Only</option>
                <option value="tenant_owner">Tenant Owners Only</option>
                <option value="tenant_admin">Tenant Admins Only</option>
                <option value="tenant_guide">Guides Only</option>
              </select>
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
          <div className="bg-white border rounded-lg overflow-hidden">
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
                ) : history.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No broadcasts sent yet</td></tr>
                ) : history.map((h) => (
                  <tr key={h.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{new Date(h.sentAt).toLocaleString()}</td>
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
        </div>
      </div>
    </DashboardLayout>
  );
};
