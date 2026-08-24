import { useEffect, useState } from 'react';
import { AdminUserType } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { AdminUserDetail, AdminUserDetailPanel } from '../components/admin/AdminUserDetailPanel';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';
import { USER_TYPE_BADGE, USER_TYPE_LABELS } from '../constants/userTypes';

interface UserRow {
  id: string;
  email: string;
  role: string;
  userType?: AdminUserType;
  status: string;
  authProvider?: string;
  displayName?: string;
  avatarUrl?: string | null;
  createdAt: string;
  lastActiveAt?: string | null;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<UserRow | null>(null);
  const [suspendComment, setSuspendComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers({
        role: roleFilter || undefined,
        userType: userTypeFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        pageSize: 20
      });
      setUsers(res.data as unknown as UserRow[]);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [page, roleFilter, userTypeFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const executeToggleStatus = async () => {
    if (!confirmTarget) return;
    const newStatus = confirmTarget.status === 'active' ? 'suspended' : 'active';
    if (newStatus === 'suspended' && !suspendComment.trim()) {
      setError('A comment is required when suspending an account.');
      return;
    }
    setActionLoading(true);
    try {
      await api.updateAdminUserStatus(
        confirmTarget.id,
        newStatus,
        newStatus === 'suspended' ? suspendComment.trim() : undefined
      );
      setConfirmTarget(null);
      setSuspendComment('');
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const res = await api.getAdminUserDetail(id);
      setSelectedUser(res.data as unknown as AdminUserDetail);
      setDetailOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load user details');
    }
  };

  const typeBadge = (userType?: AdminUserType) => {
    const key = userType ?? 'participant';
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${USER_TYPE_BADGE[key]}`}>
        {USER_TYPE_LABELS[key]}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const isActive = status === 'active';
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status}</span>;
  };

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input type="text" placeholder="Search email or name..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-60" />
          <button type="submit" className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-700">Search</button>
        </form>
        <select value={userTypeFilter} onChange={(e) => { setUserTypeFilter(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All User Types</option>
          <option value="participant">Participant</option>
          <option value="guide_organizer">Individual Host</option>
          <option value="business_organizer">Organizer</option>
          <option value="organizer_staff">Host Staff</option>
          <option value="platform_admin">Admin</option>
        </select>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All Roles (legacy)</option>
          <option value="platform_admin">Admin</option>
          <option value="tenant_owner">Tenant Owner</option>
          <option value="tenant_admin">Tenant Admin</option>
          <option value="tenant_guide">Guide</option>
          <option value="visitor">Visitor</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Joined On</th>
              <th className="px-4 py-3 text-left">Last Active</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />Loading...
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                        {(u.displayName || u.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{u.displayName || 'No name'}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{typeBadge(u.userType)}</td>
                <td className="px-4 py-3">{statusBadge(u.status)}</td>
                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                  {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openDetail(u.id)} className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">View</button>
                    {u.role !== 'platform_admin' && (
                      <button onClick={() => { setConfirmTarget(u); setSuspendComment(''); }}
                        className={`px-2 py-1 rounded text-xs ${u.status === 'active' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
            <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmTarget(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmTarget.status === 'active' ? 'Suspend User?' : 'Activate User?'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirmTarget.status === 'active'
                ? 'This will prevent the user from logging in or accessing the platform.'
                : 'This will restore the user\'s access to the platform.'}
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmTarget.displayName || confirmTarget.email}</p>
            {confirmTarget.status === 'active' && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Reason for suspension *</label>
                <textarea
                  value={suspendComment}
                  onChange={(e) => setSuspendComment(e.target.value)}
                  placeholder="Explain why this account is being suspended..."
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  rows={3}
                  maxLength={500}
                />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmTarget(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={executeToggleStatus} disabled={actionLoading}
                className={`px-4 py-2 rounded-md text-sm text-white disabled:opacity-60 ${confirmTarget.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {actionLoading ? 'Saving...' : confirmTarget.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailOpen && selectedUser && (
        <AdminUserDetailPanel
          user={selectedUser}
          onClose={() => setDetailOpen(false)}
          onOpenUser={(userId) => {
            setDetailOpen(false);
            void openDetail(userId);
          }}
        />
      )}
    </DashboardLayout>
  );
};
