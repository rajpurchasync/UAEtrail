import { useEffect, useState } from 'react';
import { TenantListDTO } from '@uaetrail/shared-types';
import { api, OrganizerApplication, TenantDetail } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';

type Tab = 'applications' | 'tenants';

export const AdminOrganizers = () => {
  const [tab, setTab] = useState<Tab>('applications');
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [tenants, setTenants] = useState<TenantListDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [tenantDetail, setTenantDetail] = useState<TenantDetail | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<TenantListDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, tenantRes] = await Promise.all([api.getAdminApplications(), api.getAdminTenants()]);
      setApplications(appRes.data);
      setTenants(tenantRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const review = async (id: string, status: 'approved' | 'rejected', note?: string) => {
    try {
      await api.reviewAdminApplication(id, status, note);
      setNoteModal(null);
      setReviewNote('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update application');
    }
  };

  const executeToggleTenantStatus = async () => {
    if (!confirmTarget) return;
    const newStatus = confirmTarget.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateAdminTenantStatus(confirmTarget.id, newStatus as 'active' | 'suspended');
      setConfirmTarget(null);
      await loadData();
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

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
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

        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />Loading...
          </div>
        )}

        {/* Applications Tab */}
        {!loading && tab === 'applications' && (
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
                    <td className="px-4 py-3">{statusBadge(app.status)}</td>
                    <td className="px-4 py-3">
                      {app.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button onClick={() => setNoteModal({ id: app.id, action: 'approved' })}
                            className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Approve</button>
                          <button onClick={() => setNoteModal({ id: app.id, action: 'rejected' })}
                            className="px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 text-xs">Reject</button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs italic">
                          {app.status === 'approved' ? 'Approved' : 'Rejected'}
                          {app.reviewNote && <span className="ml-1" title={app.reviewNote}>📝</span>}
                        </span>
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
        {!loading && tab === 'tenants' && (
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
                    <td className="px-4 py-3 capitalize">{t.type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">{t.ownerName}</td>
                    <td className="px-4 py-3 text-center">{t.memberCount}</td>
                    <td className="px-4 py-3 text-center">{t.eventCount}</td>
                    <td className="px-4 py-3">{statusBadge(t.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openTenantDetail(t.id)}
                          className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">View</button>
                        {t.status !== 'pending' && (
                          <button onClick={() => setConfirmTarget(t)}
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

      {/* Tenant Status Confirmation */}
      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmTarget(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmTarget.status === 'active' ? 'Suspend Organization?' : 'Activate Organization?'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirmTarget.status === 'active'
                ? 'This will prevent the organization from creating events and accepting bookings.'
                : 'This will restore the organization\'s ability to operate on the platform.'}
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmTarget.name}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmTarget(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={executeToggleTenantStatus}
                className={`px-4 py-2 rounded-md text-sm text-white ${confirmTarget.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {confirmTarget.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setNoteModal(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">
              {noteModal.action === 'approved' ? 'Approve Application' : 'Reject Application'}
            </h3>
            <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Add a note for the applicant (optional)" className="w-full border rounded-lg px-3 py-2 text-sm mb-4" rows={3} />
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

      {/* Structured Tenant Detail Modal */}
      {tenantDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setTenantDetail(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{tenantDetail.name}</h2>
                <p className="text-sm text-gray-500">{tenantDetail.slug} &middot; {tenantDetail.type.replace(/_/g, ' ')}</p>
              </div>
              <button onClick={() => setTenantDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="space-y-5">
              {/* Status + Created */}
              <div className="flex gap-3 items-center">
                {statusBadge(tenantDetail.status)}
                <span className="text-xs text-gray-500">Created {new Date(tenantDetail.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Owner */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Owner</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                    {(tenantDetail.owner.displayName || tenantDetail.owner.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tenantDetail.owner.displayName || 'No name'}</p>
                    <p className="text-xs text-gray-500">{tenantDetail.owner.email}</p>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Members ({tenantDetail.members.length})</p>
                {tenantDetail.members.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs">Name</th>
                          <th className="px-3 py-2 text-left text-xs">Email</th>
                          <th className="px-3 py-2 text-left text-xs">Role</th>
                          <th className="px-3 py-2 text-left text-xs">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenantDetail.members.map((m) => (
                          <tr key={m.userId} className="border-t">
                            <td className="px-3 py-2 text-sm">{m.displayName || '—'}</td>
                            <td className="px-3 py-2 text-xs text-gray-500">{m.email}</td>
                            <td className="px-3 py-2">
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">{m.role.replace(/_/g, ' ')}</span>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-500">{new Date(m.joinedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No members yet</p>
                )}
              </div>

              {/* Events */}
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Events ({tenantDetail.events.length})</p>
                {tenantDetail.events.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs">Title</th>
                          <th className="px-3 py-2 text-left text-xs">Location</th>
                          <th className="px-3 py-2 text-left text-xs">Date</th>
                          <th className="px-3 py-2 text-center text-xs">Participants</th>
                          <th className="px-3 py-2 text-left text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenantDetail.events.map((ev) => (
                          <tr key={ev.id} className="border-t">
                            <td className="px-3 py-2 text-sm font-medium">{ev.title}</td>
                            <td className="px-3 py-2 text-xs text-gray-500">{ev.locationName}</td>
                            <td className="px-3 py-2 text-xs text-gray-500">{new Date(ev.startAt).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="text-sm">{ev.participantCount}</span>
                              <span className="text-gray-400 text-xs">/{ev.capacity}</span>
                              {ev.checkedInCount > 0 && <span className="ml-1 text-xs text-emerald-600">({ev.checkedInCount} ✓)</span>}
                            </td>
                            <td className="px-3 py-2">{statusBadge(ev.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No events created yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
