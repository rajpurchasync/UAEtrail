import { useEffect, useState } from 'react';
import { api, EventRequestView } from '../api/services';
import { getActiveTenantId } from '../api/tenant';
import { DashboardLayout } from '../components/layout';
import { TenantSwitcher } from '../components/ui';

const organizerLinks = [
  { to: '/organizer/overview', label: 'Overview' },
  { to: '/organizer/events', label: 'Events' },
  { to: '/organizer/requests', label: 'Join Requests' },
  { to: '/organizer/team', label: 'Team' },
  { to: '/organizer/locations', label: 'Locations' },
  { to: '/organizer/history', label: 'History' },
  { to: '/organizer/profile', label: 'Profile' }
];

export const OrganizerRequests = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [requests, setRequests] = useState<EventRequestView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [decisionModal, setDecisionModal] = useState<{ request: EventRequestView; action: 'approved' | 'rejected' } | null>(null);
  const [organizerNote, setOrganizerNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadRequests = async (activeTenantId: string) => {
    if (!activeTenantId) return;
    try {
      const res = await api.getOrganizerRequests(activeTenantId);
      setRequests(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    }
  };

  useEffect(() => {
    loadRequests(tenantId);
  }, [tenantId]);

  const submitDecision = async () => {
    if (!tenantId || !decisionModal) return;
    try {
      await api.decideOrganizerRequest(tenantId, decisionModal.request.id, decisionModal.action, organizerNote || undefined);
      setDecisionModal(null);
      setOrganizerNote('');
      await loadRequests(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request');
    }
  };

  const filtered = statusFilter === 'all' ? requests : requests.filter((r) => r.status === statusFilter);
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-600'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  return (
    <DashboardLayout title="Organizer Dashboard" links={organizerLinks}>
      <div className="space-y-4">
        <TenantSwitcher onChange={setTenantId} />
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Join Requests</h2>
            {pendingCount > 0 && <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium">{pendingCount} pending</span>}
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Requester</th>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left">Note</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{req.user?.displayName ?? '—'}</p>
                    <p className="text-xs text-gray-500">{req.user?.email ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{req.event.title || req.event.locationName}</p>
                    <p className="text-xs text-gray-500">
                      {req.event.date || req.event.startAt ? new Date(req.event.startAt || req.event.date || '').toLocaleDateString() : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {req.note ? (
                      <p className="text-xs text-gray-700 max-w-[200px] truncate" title={req.note}>{req.note}</p>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{statusBadge(req.status)}</td>
                  <td className="px-4 py-3">
                    {req.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button onClick={() => { setDecisionModal({ request: req, action: 'approved' }); setOrganizerNote(''); }}
                          className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Approve</button>
                        <button onClick={() => { setDecisionModal({ request: req, action: 'rejected' }); setOrganizerNote(''); }}
                          className="px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 text-xs">Reject</button>
                      </div>
                    ) : (
                      <>
                        {req.organizerNote && (
                          <span className="text-xs text-gray-500" title={req.organizerNote}>📝 Note added</span>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {decisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDecisionModal(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">
              {decisionModal.action === 'approved' ? 'Approve Request' : 'Reject Request'}
            </h3>

            {/* Requester Info */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium">{decisionModal.request.user?.displayName}</p>
              <p className="text-xs text-gray-500">{decisionModal.request.user?.email}</p>
              {decisionModal.request.note && (
                <div className="mt-2 text-xs">
                  <p className="text-gray-500 font-medium">Visitor&apos;s note:</p>
                  <p className="text-gray-700 italic">&quot;{decisionModal.request.note}&quot;</p>
                </div>
              )}
            </div>

            <label className="text-sm font-medium text-gray-700 mb-1 block">Response note (optional)</label>
            <textarea value={organizerNote} onChange={(e) => setOrganizerNote(e.target.value)}
              placeholder={decisionModal.action === 'approved' ? 'e.g. Welcome! Please bring hiking boots and water.' : 'e.g. Sorry, this event is already at capacity.'}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4" rows={3} />

            <div className="flex justify-end gap-3">
              <button onClick={() => setDecisionModal(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={submitDecision}
                className={`px-4 py-2 rounded-lg text-sm text-white ${decisionModal.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {decisionModal.action === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
