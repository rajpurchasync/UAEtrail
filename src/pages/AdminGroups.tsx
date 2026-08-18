import { useEffect, useState } from 'react';
import { api, AdminSocialGroupDetail, AdminSocialGroupListItem } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';

const typeLabel = {
  family: 'Family',
  friends: 'Friends',
} as const;

const inviteStatusClass: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-800',
};

export const AdminGroups = () => {
  const [groups, setGroups] = useState<AdminSocialGroupListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminSocialGroupDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const pageSize = 20;

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminGroups({
        search: search || undefined,
        type: typeFilter ? (typeFilter as 'family' | 'friends') : undefined,
        page,
        pageSize,
      });
      setGroups(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGroups();
  }, [page, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadGroups();
  };

  const openDetail = async (id: string) => {
    setError(null);
    try {
      const res = await api.getAdminGroupDetail(id);
      setDetail(res.data);
      setDetailOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group details');
    }
  };

  const formatDate = (value: string) => new Date(value).toLocaleString();

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by group name..."
            className="border border-gray-200 rounded-md px-3 py-2 text-sm w-56"
          />
          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
            Search
          </button>
        </form>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="family">Family</option>
          <option value="friends">Friends</option>
        </select>
      </div>

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
                <th className="px-4 py-3 font-medium">Group</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Creator</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No groups found.
                  </td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{group.name}</div>
                      {group.slogan && <div className="text-xs text-gray-500 mt-0.5">{group.slogan}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {typeLabel[group.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{group.admin?.displayName || '—'}</div>
                      <div className="text-xs text-gray-500">{group.admin?.email || group.adminUserId}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{group.memberCount}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(group.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void openDetail(group.id)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {total > pageSize && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page * pageSize >= total}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {detailOpen && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailOpen(false)}>
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{detail.group.name}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {typeLabel[detail.group.type]} group · Created {formatDate(detail.group.createdAt)}
                </p>
                {detail.group.slogan && <p className="text-sm text-gray-600 mt-2">{detail.group.slogan}</p>}
              </div>
              <button type="button" onClick={() => setDetailOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Members', value: detail.stats.memberCount },
                { label: 'Adults', value: detail.stats.adultCount },
                { label: 'Kids', value: detail.stats.kidCount },
                { label: 'Pending invites', value: detail.stats.pendingInvites },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Group admin</h3>
              {detail.admin ? (
                <div className="rounded-lg border border-gray-100 px-3 py-2">
                  <p className="font-medium text-gray-900">{detail.admin.displayName || detail.admin.email}</p>
                  <p className="text-sm text-gray-500">{detail.admin.email}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Admin user not found.</p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Participants ({detail.members.length})</h3>
              <div className="space-y-2">
                {detail.members.map((member) => (
                  <div key={member.id} className="rounded-lg border border-gray-100 px-3 py-2 flex flex-wrap items-center gap-2 justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.memberType === 'kid'
                          ? member.displayName || 'Child'
                          : member.user?.displayName || member.user?.email || member.invitedEmail || 'Member'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.memberType === 'kid' ? 'Child profile' : member.user?.email || member.invitedEmail || 'No email'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                        {member.role}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                        {member.memberType}
                      </span>
                      {member.isActive === false && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Invites ({detail.invites.length})</h3>
              {detail.invites.length === 0 ? (
                <p className="text-sm text-gray-500">No invites sent.</p>
              ) : (
                <div className="space-y-2">
                  {detail.invites.map((invite) => (
                    <div key={invite.id} className="rounded-lg border border-gray-100 px-3 py-2 flex flex-wrap items-center gap-2 justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{invite.email}</p>
                        <p className="text-xs text-gray-500">
                          Sent {formatDate(invite.createdAt)} · Role: {invite.role}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${inviteStatusClass[invite.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {invite.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
