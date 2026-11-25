import { useEffect, useState } from 'react';
import {
  createOrganisationTeamMember,
  removeOrganisationTeamMember,
  toggleOrganisationTeamMemberStatus,
  updateOrganisationTeamMemberRole,
} from '../../hooks/organisationConsoleApi';
import { useOrganisationTeam } from '../../hooks/usePublishingConsoleQueries';
import { getActiveTenantId } from '../../api/tenant';
import { ConsoleShell } from '../../console/ConsoleShell';
import { AppSelect } from '../../components/ui/AppSelect';
import { TenantSwitcher } from '../../components/ui';

const HOST_TEAM_ROLE_OPTIONS = [
  { value: 'tenant_guide' as const, label: 'Guide' },
  { value: 'tenant_admin' as const, label: 'Admin' },
];

export const Team = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const {
    data: members = [],
    isPending: loading,
    error: loadError,
    refetch: refetchTeam,
  } = useOrganisationTeam(tenantId);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, 'tenant_admin' | 'tenant_guide'>>({});
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [busyActionMemberId, setBusyActionMemberId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'tenant_admin' | 'tenant_guide'>('tenant_guide');
  const [actionError, setActionError] = useState<string | null>(null);
  const error =
    actionError ??
    (loadError instanceof Error ? loadError.message : loadError ? 'Failed to load team' : null);

  useEffect(() => {
    const drafts: Record<string, 'tenant_admin' | 'tenant_guide'> = {};
    members.forEach((member) => {
      if (member.role === 'tenant_admin' || member.role === 'tenant_guide') {
        drafts[member.id] = member.role;
      }
    });
    setRoleDrafts(drafts);
  }, [members]);

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tenantId) return;
    setActionError(null);
    try {
      await createOrganisationTeamMember(tenantId, { email, displayName, role });
      setEmail('');
      setDisplayName('');
      setRole('tenant_guide');
      await refetchTeam();
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : 'Failed to add member');
    }
  };

  const updateMemberRole = async (memberId: string) => {
    if (!tenantId) return;
    const nextRole = roleDrafts[memberId];
    if (!nextRole) return;
    setActionError(null);
    setSavingMemberId(memberId);
    try {
      await updateOrganisationTeamMemberRole(tenantId, memberId, nextRole);
      await refetchTeam();
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Failed to update member role');
    } finally {
      setSavingMemberId(null);
    }
  };

  const toggleMemberStatus = async (memberId: string, nextActive: boolean) => {
    if (!tenantId) return;
    setActionError(null);
    setBusyActionMemberId(memberId);
    try {
      await toggleOrganisationTeamMemberStatus(tenantId, memberId, nextActive);
      await refetchTeam();
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Failed to update member access');
    } finally {
      setBusyActionMemberId(null);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!tenantId) return;
    setActionError(null);
    setBusyActionMemberId(memberId);
    try {
      await removeOrganisationTeamMember(tenantId, memberId);
      await refetchTeam();
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Failed to remove member');
    } finally {
      setBusyActionMemberId(null);
    }
  };

  return (
    <ConsoleShell title="Team">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Add guides and admins who help run events. Your public profile lists team members separately.
        </p>
        <TenantSwitcher onChange={setTenantId} />
        <section className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Add Team Member</h2>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={addMember}>
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            <AppSelect
              value={role}
              onChange={setRole}
              options={HOST_TEAM_ROLE_OPTIONS}
              inputClassName="rounded-xl border border-neutral-200 px-3 py-2 text-sm w-full"
              aria-label="Team member role"
            />
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Add</button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>
        <section className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                  </td>
                </tr>
              ) : null}
              {!loading &&
                members.map((member) => (
                <tr key={member.id} className="border-t">
                  <td className="px-4 py-3">{member.displayName}</td>
                  <td className="px-4 py-3">{member.email}</td>
                  <td className="px-4 py-3">
                    {member.role === 'tenant_owner' ? (
                      <span className="capitalize">tenant owner</span>
                    ) : (
                      <AppSelect
                        value={roleDrafts[member.id] ?? 'tenant_guide'}
                        onChange={(nextRole) =>
                          setRoleDrafts((current) => ({
                            ...current,
                            [member.id]: nextRole,
                          }))
                        }
                        options={HOST_TEAM_ROLE_OPTIONS}
                        size="compact"
                        aria-label={`Role for ${member.displayName}`}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {member.role === 'tenant_owner' ? (
                        <span className="text-xs text-gray-400">Owner role is fixed</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={savingMemberId === member.id || (roleDrafts[member.id] ?? member.role) === member.role}
                            onClick={() => void updateMemberRole(member.id)}
                            className="px-2.5 py-1.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs disabled:opacity-50"
                          >
                            {savingMemberId === member.id ? 'Saving...' : 'Save role'}
                          </button>
                          <button
                            type="button"
                            disabled={busyActionMemberId === member.id}
                            onClick={() => void toggleMemberStatus(member.id, !(member.isActive ?? true))}
                            className="px-2.5 py-1.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs disabled:opacity-50"
                          >
                            {busyActionMemberId === member.id ? 'Working...' : (member.isActive ?? true) ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            disabled={busyActionMemberId === member.id}
                            onClick={() => void removeMember(member.id)}
                            className="px-2.5 py-1.5 rounded bg-rose-100 text-rose-800 hover:bg-rose-200 text-xs disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </ConsoleShell>
  );
};
