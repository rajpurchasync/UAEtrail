import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TenantListDTO } from '@uaetrail/shared-types';
import { api, OrganizerApplication, TenantDetail } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { formatPhoneDisplay } from '../utils/phone';

type Tab = 'applications' | 'tenants';
type TenantFilter = 'all' | 'active' | 'suspended';

export const AdminOrganizers = () => {
  const [tab, setTab] = useState<Tab>('applications');
  const [tenantFilter, setTenantFilter] = useState<TenantFilter>('all');
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [tenants, setTenants] = useState<TenantListDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [applicationDetail, setApplicationDetail] = useState<OrganizerApplication | null>(null);
  const [tenantDetail, setTenantDetail] = useState<TenantDetail | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<TenantListDTO | null>(null);
  const [suspendComment, setSuspendComment] = useState('');

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

  const filteredTenants = useMemo(() => {
    if (tenantFilter === 'all') return tenants;
    return tenants.filter((t) => t.status === tenantFilter);
  }, [tenants, tenantFilter]);

  const review = async (id: string, status: 'approved' | 'rejected', note?: string) => {
    try {
      await api.reviewAdminApplication(id, status, note);
      setNoteModal(null);
      setReviewNote('');
      setApplicationDetail(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update application');
    }
  };

  const executeToggleTenantStatus = async (tenant?: TenantListDTO | TenantDetail) => {
    const target = tenant ?? confirmTarget;
    if (!target) return;
    const newStatus = target.status === 'active' ? 'suspended' : 'active';
    if (newStatus === 'suspended' && !suspendComment.trim()) {
      setError('A comment is required when suspending a host.');
      return;
    }
    try {
      await api.updateAdminTenantStatus(
        target.id,
        newStatus as 'active' | 'suspended',
        newStatus === 'suspended' ? suspendComment.trim() : undefined
      );
      setConfirmTarget(null);
      setSuspendComment('');
      if (tenantDetail?.id === target.id) {
        setTenantDetail({ ...tenantDetail, status: newStatus });
      }
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

  const formatApplicantPhone = (app: OrganizerApplication): string | null => {
    const meta = app.metadata;
    if (!meta) return null;
    if (meta.phoneE164) return meta.phoneE164;
    if (meta.phoneCountryCode && meta.phone) {
      return formatPhoneDisplay(meta.phoneCountryCode, meta.phone);
    }
    return meta.phone ?? null;
  };

  const hostDisplayName = (app: OrganizerApplication): string =>
    app.metadata?.hostDisplayName?.trim() || app.applicantName;

  const metaField = (label: string, value?: string | null) => {
    if (!value?.trim()) return null;
    return (
      <div>
        <p className="text-xs text-gray-500 uppercase font-medium">{label}</p>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{value}</p>
      </div>
    );
  };

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      <div className="space-y-4">
        <div className="border-b flex gap-0">
          <button onClick={() => setTab('applications')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'applications' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Applications {pendingCount > 0 && <span className="ml-1 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-xs">{pendingCount}</span>}
          </button>
          <button onClick={() => setTab('tenants')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'tenants' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Hosts <span className="ml-1 text-xs text-gray-400">({tenants.length})</span>
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />Loading...
          </div>
        )}

        {!loading && tab === 'applications' && (
          <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
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
                      <p className="font-medium text-gray-900">{hostDisplayName(app)}</p>
                      <p className="text-xs text-gray-500">{app.applicantEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{app.requestedName}</td>
                    <td className="px-4 py-3 capitalize">{app.requestedType.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{statusBadge(app.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setApplicationDetail(app)}
                          className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">View</button>
                        {app.status === 'pending' && (
                          <>
                            <button onClick={() => setNoteModal({ id: app.id, action: 'approved' })}
                              className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Approve</button>
                            <button onClick={() => setNoteModal({ id: app.id, action: 'rejected' })}
                              className="px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 text-xs">Reject</button>
                          </>
                        )}
                        {app.requestedTenantId && (
                          <button onClick={() => openTenantDetail(app.requestedTenantId!)}
                            className="px-2 py-1 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 text-xs">Host profile</button>
                        )}
                      </div>
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

        {!loading && tab === 'tenants' && (
          <>
            <div className="flex gap-2">
              {(['all', 'active', 'suspended'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTenantFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${
                    tenantFilter === f ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All hosts' : f}
                </button>
              ))}
            </div>
            <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
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
                  {filteredTenants.map((t) => (
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
                            <button onClick={() => { setConfirmTarget(t); setSuspendComment(''); }}
                              className={`px-2 py-1 rounded text-xs ${t.status === 'active' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>
                              {t.status === 'active' ? 'Suspend' : 'Reopen'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTenants.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No hosts found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmTarget(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmTarget.status === 'active' ? 'Suspend host?' : 'Reopen host?'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirmTarget.status === 'active'
                ? 'This host will not be able to create events or accept bookings until reopened.'
                : 'This will restore the host\'s ability to operate on the platform.'}
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmTarget.name}</p>
            {confirmTarget.status === 'active' && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Reason for suspension *</label>
                <textarea
                  value={suspendComment}
                  onChange={(e) => setSuspendComment(e.target.value)}
                  placeholder="Explain why this host is being suspended..."
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  rows={3}
                  maxLength={500}
                />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmTarget(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => executeToggleTenantStatus()}
                className={`px-4 py-2 rounded-md text-sm text-white ${confirmTarget.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {confirmTarget.status === 'active' ? 'Suspend' : 'Reopen'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {applicationDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setApplicationDetail(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Host application</h2>
                <p className="text-sm text-gray-500">{applicationDetail.requestedName} · {applicationDetail.requestedType.replace(/_/g, ' ')}</p>
              </div>
              <button onClick={() => setApplicationDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                {statusBadge(applicationDetail.status)}
                <span className="text-xs text-gray-500">Applied {new Date(applicationDetail.createdAt).toLocaleString()}</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 flex gap-4">
                {applicationDetail.metadata?.profilePhoto ? (
                  <SecureAvatar
                    src={applicationDetail.metadata.profilePhoto}
                    name={hostDisplayName(applicationDetail)}
                    className="w-16 h-16 text-lg border shrink-0"
                  />
                ) : (
                  <SecureAvatar
                    name={hostDisplayName(applicationDetail)}
                    className="w-16 h-16 text-lg border shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{hostDisplayName(applicationDetail)}</p>
                  <p className="text-sm text-gray-500">{applicationDetail.applicantEmail}</p>
                  {formatApplicantPhone(applicationDetail) && (
                    <p className="text-sm text-gray-600 mt-1">{formatApplicantPhone(applicationDetail)}</p>
                  )}
                </div>
              </div>

              {metaField('Display name', applicationDetail.metadata?.hostDisplayName)}

              {metaField('Bio', applicationDetail.metadata?.bio)}
              {metaField('Experience', applicationDetail.metadata?.experience)}
              {metaField('Languages', applicationDetail.metadata?.languages)}
              {metaField('Certificates', applicationDetail.metadata?.certificates)}
              {metaField('Notable hikes', applicationDetail.metadata?.notableHikes)}
              {metaField('Nationality', applicationDetail.metadata?.nationality)}
              {metaField('Residence', applicationDetail.metadata?.residence)}

              {applicationDetail.reviewerNote && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 uppercase font-medium">Reviewer note</p>
                  <p className="text-sm text-gray-700">{applicationDetail.reviewerNote}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {applicationDetail.requestedTenantId && (
                  <button onClick={() => { setApplicationDetail(null); openTenantDetail(applicationDetail.requestedTenantId!); }}
                    className="px-3 py-2 rounded-lg bg-blue-100 text-blue-800 text-sm font-medium hover:bg-blue-200">
                    View host organization
                  </button>
                )}
                {applicationDetail.requestedSlug && applicationDetail.status === 'approved' && (
                  <Link to={`/operator/${applicationDetail.requestedSlug}`} target="_blank"
                    className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200">
                    Public profile ↗
                  </Link>
                )}
                {applicationDetail.status === 'pending' && (
                  <>
                    <button onClick={() => { setApplicationDetail(null); setNoteModal({ id: applicationDetail.id, action: 'approved' }); }}
                      className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">Approve</button>
                    <button onClick={() => { setApplicationDetail(null); setNoteModal({ id: applicationDetail.id, action: 'rejected' }); }}
                      className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">Reject</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tenantDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setTenantDetail(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{tenantDetail.name}</h2>
                <p className="text-sm text-gray-500">{tenantDetail.slug} · {tenantDetail.type.replace(/_/g, ' ')}</p>
              </div>
              <button onClick={() => setTenantDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-3 items-center">
                  {statusBadge(tenantDetail.status)}
                  <span className="text-xs text-gray-500">Created {new Date(tenantDetail.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/operator/${tenantDetail.slug}`} target="_blank"
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 text-xs font-medium hover:bg-gray-200">
                    Public profile ↗
                  </Link>
                  {tenantDetail.status !== 'pending' && (
                    <button
                      onClick={() => {
                        setConfirmTarget({
                          id: tenantDetail.id,
                          name: tenantDetail.name,
                          slug: tenantDetail.slug,
                          type: tenantDetail.type,
                          status: tenantDetail.status,
                          ownerName: tenantDetail.owner.displayName ?? tenantDetail.owner.email,
                          memberCount: tenantDetail.members.length,
                          eventCount: tenantDetail.events.length,
                        });
                        setSuspendComment('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white ${
                        tenantDetail.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {tenantDetail.status === 'active' ? 'Suspend' : 'Reopen'}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Owner</p>
                <div className="flex items-center gap-3">
                  <SecureAvatar
                    name={tenantDetail.owner.displayName || tenantDetail.owner.email}
                    className="w-10 h-10 text-sm"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{tenantDetail.owner.displayName || 'No name'}</p>
                    <p className="text-xs text-gray-500">{tenantDetail.owner.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Members ({tenantDetail.members.length})</p>
                {tenantDetail.members.length > 0 ? (
                  <div className="border rounded-lg overflow-x-auto desktop-scrollbar-x">
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

              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Events ({tenantDetail.events.length})</p>
                {tenantDetail.events.length > 0 ? (
                  <div className="border rounded-lg overflow-x-auto desktop-scrollbar-x">
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
