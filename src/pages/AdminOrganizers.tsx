import { useEffect, useState } from 'react';
import { TenantListDTO } from '@uaetrail/shared-types';
import { api, OrganizerApplication } from '../api/services';
import { DashboardLayout } from '../components/layout';

const adminLinks = [
  { to: '/admin/overview', label: 'Overview' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/organizers', label: 'Organizer Approvals' },
  { to: '/admin/events', label: 'Event Moderation' }
];

type Tab = 'applications' | 'tenants';

export const AdminOrganizers = () => {
  const [tab, setTab] = useState<Tab>('applications');
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [tenants, setTenants] = useState<TenantListDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [tenantDetail, setTenantDetail] = useState<Record<string, unknown> | null>(null);

  const loadApplications = async () => {
    try {
      const res = await api.getAdminApplications();
      setApplications(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    }
  };

  const loadTenants = async () => {
    try {
      const res = await api.getAdminTenants();
      setTenants(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenants');
    }
  };

  useEffect(() => {
    loadApplications();
    loadTenants();
  }, []);

  const review = async (id: string, status: 'approved' | 'rejected', note?: string) => {
    try {
      await api.reviewAdminApplication(id, status, note);
      setNoteModal(null);
      setReviewNote('');
      await loadApplications();
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update application');
    }
  };

  const toggleTenantStatus = async (tenant: TenantListDTO) => {
    const newStatus = tenant.status === 'active' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateAdminTenantStatus(tenant.id, newStatus);
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tenant status');
    }
  };

  const openTenantDetail = async (id: string) => {
    try {
      const res = await api.getAdminTenantDetail(id);
      setTenantDetail(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant details');
    }
  };

  const tenantStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <DashboardLayout title="Admin Dashboard" links={adminLinks}>
      <div className="space-y-4">
        {/* Tabs */}
        <div className="border-b flex gap-0">
          <button onClick={() => setTab('applications')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'applications' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Applications {pendingCount > 0 && <span className="ml-1 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-xs">{pendingCount}</span>}
          </button>
          <button onClick={() => setTab('tenants')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'tenants' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Active Tenants <span className="ml-1 text-xs text-gray-400">({tenants.length})</span>
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Applications Tab */}
        {tab === 'applications' && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Applicant</th>
                  <th className="px-4 py-3 text-left">Org Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{app.applicantName}</p>
                      <p className="text-xs text-gray-500">{app.applicantEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{app.requestedName}</td>
                    <td className="px-4 py-3 capitalize">{app.requestedType}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{tenantStatusBadge(app.status)}</td>
                    <td className="px-4 py-3">
                      {app.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button onClick={() => setNoteModal({ id: app.id, action: 'approved' })}
                            className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Approve</button>
                          <button onClick={() => setNoteModal({ id: app.id, action: 'rejected' })}
                            className="px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 text-xs">Reject</button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">Finalized</span>
                      )}
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No applications</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tenants Tab */}
        {tab === 'tenants' && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Organization</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-center">Members</th>
                  <th className="px-4 py-3 text-center">Events</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.slug}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{t.type.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{t.ownerName}</td>
                    <td className="px-4 py-3 text-center">{t.memberCount}</td>
                    <td className="px-4 py-3 text-center">{t.eventCount}</td>
                    <td className="px-4 py-3">{tenantStatusBadge(t.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openTenantDetail(t.id)}
                          className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">View</button>
                        {t.status !== 'pending' && (
                          <button onClick={() => toggleTenantStatus(t)}
                            className={`px-2 py-1 rounded text-xs ${t.status === 'active' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>
                            {t.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No tenants yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setNoteModal(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">
              {noteModal.action === 'approved' ? 'Approve Application' : 'Reject Application'}
            </h3>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Add a note for the applicant (optional)"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setNoteModal(null); setReviewNote(''); }} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={() => review(noteModal.id, noteModal.action, reviewNote || undefined)}
                className={`px-4 py-2 rounded-lg text-sm text-white ${noteModal.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {noteModal.action === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Detail Modal */}
      {tenantDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setTenantDetail(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tenant Details</h2>
              <button onClick={() => setTenantDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-4 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(tenantDetail, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
