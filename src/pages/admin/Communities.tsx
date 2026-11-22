import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import type { AdminCommunityDetail, AdminCommunityListItem } from '../../api/types';
import {
  approveAdminCommunityMemberRequest,
  fetchAdminCommunities,
  updateAdminCommunityStatus,
} from '../../hooks/adminConsoleApi';
import { fetchAdminCommunityDetail } from '../../hooks/adminDrilldownApi';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import { AppSelect, ADMIN_FILTER_SELECT_CLASS, ADMIN_INPUT_CLASS } from '../../components/ui/AppSelect';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { AdminTablePager, DEFAULT_ADMIN_PAGE_SIZE, paginateRows, type AdminPageSize } from '../../components/admin/AdminTablePager';
import { formatAdminDate } from '../../utils/formatAdminDate';
import { communityClubPath, messagesToUserPath } from '../../config/routingCatalog';
import { FEATURE_FLAGS } from '../../config/platform';

const joinPolicyLabel: Record<string, string> = {
  open: 'Open',
  request: 'Request',
  invite: 'Invite',
};

/** Discoverable clubs (`MIG-COMMUNITY-DISCOVER`) — not private Teams on `/admin/groups`. */
export const Communities = () => {
  const [rows, setRows] = useState<AdminCommunityListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [joinFilter, setJoinFilter] = useState('');
  const [hostFilter, setHostFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminCommunityDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<AdminCommunityListItem | null>(null);
  const [suspendComment, setSuspendComment] = useState('');
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);

  const loadCommunities = async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminCommunities();
      if (!isActive()) return;
      setRows(data);
    } catch (err) {
      if (!isActive()) return;
      setError(err instanceof Error ? err.message : 'Failed to load communities');
    } finally {
      if (isActive()) setLoading(false);
    }
  };

  useSafeAsyncEffect((isActive) => loadCommunities(isActive), []);

  const visibleRows = rows.filter((row) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${row.name} ${row.slug} ${row.admin?.displayName ?? ''} ${row.admin?.email ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (statusFilter && row.status !== statusFilter) return false;
    if (joinFilter && row.joinPolicy !== joinFilter) return false;
    if (hostFilter) {
      const q = hostFilter.toLowerCase();
      const host = `${row.admin?.displayName ?? ''} ${row.admin?.email ?? ''}`.toLowerCase();
      if (!host.includes(q)) return false;
    }
    return true;
  });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, joinFilter, hostFilter]);

  const openDetail = async (id: string) => {
    setError(null);
    try {
      const communityDetail = await fetchAdminCommunityDetail(id);
      setDetail(communityDetail);
      setDetailOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load community details');
    }
  };

  const formatDate = (value: string) => formatAdminDate(value);

  const statusBadge = (status: string) => {
    const isActive = status === 'active';
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
      >
        {status}
      </span>
    );
  };

  const executeToggleStatus = async () => {
    if (!confirmTarget) return;
    const newStatus = confirmTarget.status === 'active' ? 'suspended' : 'active';
    if (newStatus === 'suspended' && !suspendComment.trim()) {
      setError('A comment is required when suspending.');
      return;
    }
    try {
      const updated = await updateAdminCommunityStatus(
        confirmTarget.id,
        newStatus,
        newStatus === 'suspended' ? suspendComment.trim() : undefined
      );
      setConfirmTarget(null);
      setSuspendComment('');
      if (detail?.community.id === confirmTarget.id) {
        setDetail({
          ...detail,
          community: { ...detail.community, status: updated.status },
        });
      }
      await loadCommunities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update community status');
    }
  };

  const approveMember = async (communityId: string, userId: string) => {
    setApprovingUserId(userId);
    setError(null);
    try {
      await approveAdminCommunityMemberRequest(communityId, userId);
      const refreshed = await fetchAdminCommunityDetail(communityId);
      setDetail(refreshed);
      await loadCommunities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve member');
    } finally {
      setApprovingUserId(null);
    }
  };

  return (
    <DashboardLayout title="Communities" links={ADMIN_LINKS}>
      {!FEATURE_FLAGS.communityDiscover && (
        <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Consumer Community tab is feature-gated (`VITE_COMMUNITY_DISCOVER`). Admin can still seed and moderate clubs here.
        </p>
      )}

      <AdminFilterBar
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
        }}
        onClear={() => {
          setSearch('');
          setStatusFilter('');
          setJoinFilter('');
          setHostFilter('');
          setPage(1);
        }}
      >
        <label className="text-xs text-neutral-500">
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, slug, or host…"
            className={`${ADMIN_INPUT_CLASS} mt-1 block w-56`}
          />
        </label>
        <AppSelect
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          placeholder="Status"
          inputClassName={ADMIN_FILTER_SELECT_CLASS}
          aria-label="Filter by status"
        />
        <AppSelect
          value={joinFilter}
          onChange={(value) => {
            setJoinFilter(value);
            setPage(1);
          }}
          options={[
            { value: 'open', label: 'Open join' },
            { value: 'request', label: 'Request join' },
            { value: 'invite', label: 'Invite only' },
          ]}
          placeholder="Join policy"
          inputClassName={ADMIN_FILTER_SELECT_CLASS}
          aria-label="Filter by join policy"
        />
        <label className="text-xs text-neutral-500">
          Host
          <input
            type="search"
            value={hostFilter}
            onChange={(e) => setHostFilter(e.target.value)}
            placeholder="Name or email"
            className={`${ADMIN_INPUT_CLASS} mt-1 block w-40`}
          />
        </label>
      </AdminFilterBar>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Community</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Host</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Join</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    No communities found.
                  </td>
                </tr>
              ) : (
                paginateRows(visibleRows, page, pageSize).map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="admin-table-hit">
                      <button type="button" onClick={() => void openDetail(row.id)}>
                        <span className="block font-medium text-gray-900">{row.name}</span>
                        <span className="block text-xs text-gray-500">/{row.slug}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.geoRef.names.country}
                      {row.geoRef.names.area ? ` · ${row.geoRef.names.area}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{row.admin?.displayName || '—'}</div>
                      <div className="text-xs text-gray-500">{row.admin?.email || row.adminUserId || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.memberCount}</td>
                    <td className="px-4 py-3 capitalize text-gray-700">{joinPolicyLabel[row.joinPolicy] ?? row.joinPolicy}</td>
                    <td className="px-4 py-3">{statusBadge(row.status)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void openDetail(row.id)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmTarget(row);
                            setSuspendComment('');
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            row.status === 'active'
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {row.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <AdminTablePager
        page={page}
        pageSize={pageSize}
        total={visibleRows.length}
        onPage={setPage}
        onPageSize={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {detailOpen && detail && (
        <div
          className="admin-dialog-backdrop fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailOpen(false)}
        >
          <div
            className="admin-dialog bg-white rounded-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold text-gray-900">{detail.community.name}</h2>
                  {statusBadge(detail.community.status)}
                </div>
                <p className="text-sm text-gray-500">
                  {joinPolicyLabel[detail.community.joinPolicy]} · Created {formatDate(detail.community.createdAt)}
                </p>
                {detail.community.summary ? (
                  <p className="text-sm text-gray-600 mt-2">{detail.community.summary}</p>
                ) : null}
                <p className="text-xs text-gray-500 mt-2">
                  <Link to={communityClubPath(detail.community.slug)} className="text-emerald-700 hover:underline">
                    Public club page
                  </Link>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmTarget(detail.community);
                    setSuspendComment('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white ${
                    detail.community.status === 'active'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {detail.community.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Members', value: detail.stats.memberCount },
                { label: 'Pending requests', value: detail.stats.pendingCount },
                { label: 'Listed count', value: detail.community.memberCount },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Community host (contact)</h3>
              {detail.host ? (
                <div className="rounded-lg border border-gray-100 px-3 py-2 space-y-2">
                  <p className="font-medium text-gray-900">{detail.host.displayName || detail.host.email}</p>
                  <p className="text-sm text-gray-500">{detail.host.email}</p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <a href={`mailto:${detail.host.email}`} className="text-emerald-700 font-medium hover:underline">
                      Email host
                    </a>
                    <Link to={messagesToUserPath(detail.host.id)} className="text-emerald-700 font-medium hover:underline">
                      Open messages
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No host assigned — set `adminUserId` when seeding the club.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Members ({detail.members.length})</h3>
              <div className="space-y-2">
                {detail.members.length === 0 ? (
                  <p className="text-sm text-gray-500">No members yet.</p>
                ) : (
                  detail.members.map((member) => (
                    <div
                      key={`${member.userId}-${member.joinedAt}`}
                      className="rounded-lg border border-gray-100 px-3 py-2 flex flex-wrap items-center gap-2 justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{member.displayName || member.email}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            member.status === 'pending' ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {member.status}
                        </span>
                        {member.status === 'pending' ? (
                          <button
                            type="button"
                            disabled={approvingUserId === member.userId}
                            onClick={() => void approveMember(detail.community.id, member.userId)}
                            className="text-xs font-medium text-emerald-700 hover:underline disabled:opacity-50"
                          >
                            {approvingUserId === member.userId ? 'Approving…' : 'Approve'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmTarget && (
        <div
          className="admin-dialog-backdrop fixed inset-0 flex items-center justify-center z-[60]"
          onClick={() => setConfirmTarget(null)}
        >
          <div className="admin-dialog bg-white rounded-lg max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmTarget.status === 'active' ? 'Suspend community?' : 'Activate community?'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {confirmTarget.status === 'active'
                ? 'The club disappears from discover until reactivated. The host receives a notification.'
                : 'The club becomes discoverable again (when public and feature-flag allows).'}
            </p>
            {confirmTarget.status === 'active' && (
              <label className="block text-sm text-gray-700 mb-4">
                Reason (required)
                <textarea
                  value={suspendComment}
                  onChange={(e) => setSuspendComment(e.target.value)}
                  className={`${ADMIN_INPUT_CLASS} mt-1 block w-full min-h-[80px]`}
                />
              </label>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmTarget(null)} className="px-4 py-2 text-sm text-gray-600">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void executeToggleStatus()}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};