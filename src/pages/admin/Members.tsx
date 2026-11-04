import { useState } from 'react';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import { AdminUserType } from '@uaetrail/shared-types';
import {
  fetchAdminMemberDetail,
  fetchAdminMembers,
  grantPlatformAdminByEmail,
  revokePlatformAdminByUserId,
  updateAdminMemberStatus,
} from '../../hooks/adminConsoleApi';
import { UserDetail, UserDetailPanel } from '../../components/admin/UserDetailPanel';
import { AdminTablePager, DEFAULT_ADMIN_PAGE_SIZE, type AdminPageSize } from '../../components/admin/AdminTablePager';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import { AppSelect, ADMIN_FILTER_SELECT_CLASS, ADMIN_INPUT_CLASS } from '../../components/ui/AppSelect';
import { AdminIconButton } from '../../components/admin/AdminIconButton';
import { Ban, Eye, ShieldOff, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { MEMBER_TYPE_BADGE, MEMBER_TYPE_LABELS } from '../../constants/userTypes';
import { formatAdminDate } from '../../utils/formatAdminDate';

const MEMBER_TYPE_OPTIONS = [
  { value: 'participant' as const, label: MEMBER_TYPE_LABELS.participant },
  { value: 'guide_host' as const, label: MEMBER_TYPE_LABELS.guide_host },
  { value: 'business_host' as const, label: MEMBER_TYPE_LABELS.business_host },
  { value: 'host_staff' as const, label: MEMBER_TYPE_LABELS.host_staff },
  { value: 'platform_admin' as const, label: MEMBER_TYPE_LABELS.platform_admin },
];

const ROLE_OPTIONS = [
  { value: 'platform_admin' as const, label: 'Platform admin' },
  { value: 'tenant_owner' as const, label: 'Host owner' },
  { value: 'tenant_admin' as const, label: 'Host staff' },
  { value: 'tenant_guide' as const, label: 'Guide' },
  { value: 'participant' as const, label: 'Participants only' },
];

const STATUS_OPTIONS = [
  { value: 'active' as const, label: 'Active' },
  { value: 'suspended' as const, label: 'Suspended' },
];



interface MemberRow {
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

export const Members = () => {
  const { user: authUser } = useAuth();
  const isMasterAdmin = authUser?.platformMasterAdmin === true;
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [roleFilter, setRoleFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<MemberRow | null>(null);
  const [suspendComment, setSuspendComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadUsers = async (isActive: () => boolean = () => true) => {
    setLoading(true);
    try {
      const res = await fetchAdminMembers({
        role: roleFilter || undefined,
        userType: userTypeFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        pageSize
      });
      if (!isActive()) return;
      setError(null);
      setMembers(res.data as unknown as MemberRow[]);
      setTotal(res.total ?? 0);
    } catch (e) {
      if (!isActive()) return;
      setError(e instanceof Error ? e.message : 'Failed to load members');
    } finally {
      if (isActive()) setLoading(false);
    }
  };

  useSafeAsyncEffect((isActive) => loadUsers(isActive), [page, pageSize, roleFilter, userTypeFilter, statusFilter]);

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
      await updateAdminMemberStatus(
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

  const grantPlatformAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = grantEmail.trim();
    if (!email) return;
    setGrantLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await grantPlatformAdminByEmail(email);
      setGrantEmail('');
      setSuccessMessage(`Platform admin access granted to ${email}.`);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant platform admin');
    } finally {
      setGrantLoading(false);
    }
  };

  const revokePlatformAdmin = async (row: MemberRow) => {
    if (!window.confirm(`Remove platform admin access for ${row.displayName || row.email}?`)) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await revokePlatformAdminByUserId(row.id);
      setSuccessMessage('Platform admin access removed.');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke platform admin');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const detail = await fetchAdminMemberDetail(id);
      setSelectedUser(detail as unknown as UserDetail);
      setDetailOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load member details');
    }
  };

  const typeBadge = (userType?: AdminUserType) => {
    const key = userType ?? 'participant';
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${MEMBER_TYPE_BADGE[key]}`}>
        {MEMBER_TYPE_LABELS[key]}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const isActive = status === 'active';
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status}</span>;
  };

  return (
    <DashboardLayout title="Users" links={ADMIN_LINKS}>
      <p className="text-sm text-gray-600 mb-4">
        Search members, review accounts, suspend or activate access. Platform staff roles are managed separately below.
      </p>

      {isMasterAdmin && (
        <section className="mb-6 rounded-xl border border-purple-100 bg-purple-50/60 p-4">
          <h2 className="text-sm font-semibold text-purple-900">Platform admin staff</h2>
          <p className="text-xs text-purple-800/80 mt-1 mb-3">
            Master admin only — grant console access to an existing account by email. They must already have signed up.
          </p>
          <form onSubmit={grantPlatformAdmin} className="flex flex-wrap gap-2 items-center">
            <input
              type="email"
              required
              placeholder="member@example.com"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              className={`${ADMIN_INPUT_CLASS} min-w-[220px]`}
            />
            <button
              type="submit"
              disabled={grantLoading}
              className="bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm hover:bg-purple-800 disabled:opacity-60"
            >
              {grantLoading ? 'Granting…' : 'Grant platform admin'}
            </button>
          </form>
        </section>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search email, name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${ADMIN_INPUT_CLASS} w-60`}
          />
          <button type="submit" className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-700">Search</button>
        </form>
        <AppSelect
          value={userTypeFilter}
          onChange={(value) => {
            setUserTypeFilter(value);
            setPage(1);
          }}
          options={MEMBER_TYPE_OPTIONS}
          placeholder="All member types"
          inputClassName={ADMIN_FILTER_SELECT_CLASS}
          aria-label="Filter by member type"
        />
        <AppSelect
          value={roleFilter}
          onChange={(value) => {
            setRoleFilter(value);
            setPage(1);
          }}
          options={ROLE_OPTIONS}
          placeholder="All Roles (legacy)"
          inputClassName={ADMIN_FILTER_SELECT_CLASS}
          aria-label="Filter by role"
        />
        <AppSelect
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="All Status"
          inputClassName={ADMIN_FILTER_SELECT_CLASS}
          aria-label="Filter by status"
        />
      </div>

      {successMessage && <p className="text-emerald-700 text-sm mb-3">{successMessage}</p>}
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
            ) : members.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No members found</td></tr>
            ) : members.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="admin-table-hit">
                  <button
                    type="button"
                    onClick={() => void openDetail(u.id)}
                    className="flex items-center gap-3"
                  >
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
                  </button>
                </td>
                <td className="px-4 py-3">{typeBadge(u.userType)}</td>
                <td className="px-4 py-3">{statusBadge(u.status)}</td>
                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatAdminDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                  {u.lastActiveAt ? formatAdminDate(u.lastActiveAt) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <AdminIconButton label="View" icon={Eye} onClick={() => void openDetail(u.id)} />
                    {u.role !== 'platform_admin' && (
                      <AdminIconButton
                        label={u.status === 'active' ? 'Suspend' : 'Activate'}
                        icon={u.status === 'active' ? Ban : UserCheck}
                        tone={u.status === 'active' ? 'red' : 'green'}
                        onClick={() => {
                          setConfirmTarget(u);
                          setSuspendComment('');
                        }}
                      />
                    )}
                    {isMasterAdmin && u.role === 'platform_admin' && u.id !== authUser?.id && (
                      <AdminIconButton
                        label="Revoke admin"
                        icon={ShieldOff}
                        tone="purple"
                        disabled={actionLoading}
                        onClick={() => void revokePlatformAdmin(u)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminTablePager
        page={page}
        pageSize={pageSize}
        total={total}
        onPage={setPage}
        onPageSize={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {confirmTarget && (
        <div className="admin-dialog-backdrop fixed inset-0 flex items-center justify-center z-50" onClick={() => setConfirmTarget(null)}>
          <div className="admin-dialog bg-white rounded-lg max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmTarget.status === 'active' ? 'Suspend member?' : 'Activate member?'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirmTarget.status === 'active'
                ? 'This member will lose access to the platform until reactivated.'
                : 'This will restore the member\'s access to the platform.'}
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
        <UserDetailPanel
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

