import { useEffect, useState } from 'react';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';

const adminLinks = [
  { to: '/admin/overview', label: 'Overview' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/organizers', label: 'Organizer Approvals' },
  { to: '/admin/events', label: 'Event Moderation' }
];

interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  displayName?: string;
  createdAt: string;
}

interface UserDetail {
  id: string;
  email: string;
  role: string;
  status: string;
  profile?: { displayName?: string; phone?: string; bio?: string; avatarUrl?: string };
  requests?: Array<{ id: string; eventTitle: string; status: string; createdAt: string }>;
  trips?: Array<{ id: string; eventTitle: string; startAt: string }>;
  memberships?: Array<{ tenantName: string; role: string }>;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        pageSize: 20
      });
      setUsers(res.data as unknown as UserRow[]);
      setTotal(res.pagination?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const toggleStatus = async (user: UserRow) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`${newStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'} user ${user.email}?`)) return;
    try {
      await api.updateAdminUserStatus(user.id, newStatus);
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update user status');
    }
  };

  const openDetail = async (id: string) => {
    try {
      const res = await api.getAdminUserDetail(id);
      setSelectedUser(res.data as unknown as UserDetail);
      setDetailOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load user details');
    }
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      platform_admin: 'bg-purple-100 text-purple-800',
      tenant_owner: 'bg-blue-100 text-blue-800',
      tenant_admin: 'bg-cyan-100 text-cyan-800',
      tenant_guide: 'bg-emerald-100 text-emerald-800',
      visitor: 'bg-gray-100 text-gray-800'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[role] ?? 'bg-gray-100 text-gray-800'}`}>{role.replace('_', ' ')}</span>;
  };

  const statusBadge = (status: string) => {
    const isActive = status === 'ACTIVE';
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status.toLowerCase()}</span>;
  };

  return (
    <DashboardLayout title="Admin Dashboard" links={adminLinks}>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-60"
          />
          <button type="submit" className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-700">Search</button>
        </form>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All Roles</option>
          <option value="platform_admin">Admin</option>
          <option value="tenant_owner">Tenant Owner</option>
          <option value="tenant_admin">Tenant Admin</option>
          <option value="tenant_guide">Guide</option>
          <option value="visitor">Visitor</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{u.displayName || 'No name'}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </td>
                <td className="px-4 py-3">{roleBadge(u.role)}</td>
                <td className="px-4 py-3">{statusBadge(u.status)}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openDetail(u.id)} className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">View</button>
                    {u.role !== 'platform_admin' && (
                      <button onClick={() => toggleStatus(u)} className={`px-2 py-1 rounded text-xs ${u.status === 'ACTIVE' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
            <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedUser.profile?.displayName || selectedUser.email}</h2>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              <button onClick={() => setDetailOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                {roleBadge(selectedUser.role)}
                {statusBadge(selectedUser.status)}
              </div>

              {selectedUser.profile?.bio && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Bio</p>
                  <p className="text-sm text-gray-700">{selectedUser.profile.bio}</p>
                </div>
              )}

              {selectedUser.profile?.phone && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Phone</p>
                  <p className="text-sm text-gray-700">{selectedUser.profile.phone}</p>
                </div>
              )}

              {selectedUser.memberships && selectedUser.memberships.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Tenant Memberships</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {selectedUser.memberships.map((m, i) => (
                      <li key={i} className="flex justify-between"><span>{m.tenantName}</span><span className="text-xs text-gray-500">{m.role}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedUser.requests && selectedUser.requests.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Recent Requests</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {selectedUser.requests.slice(0, 5).map((r) => (
                      <li key={r.id} className="flex justify-between"><span>{r.eventTitle}</span><span className="capitalize text-xs">{r.status}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedUser.trips && selectedUser.trips.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Trips</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {selectedUser.trips.slice(0, 5).map((t) => (
                      <li key={t.id} className="flex justify-between"><span>{t.eventTitle}</span><span className="text-xs text-gray-500">{new Date(t.startAt).toLocaleDateString()}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
