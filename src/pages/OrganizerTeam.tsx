import { useEffect, useState } from 'react';
import { api, TeamMember } from '../api/services';
import { getActiveTenantId } from '../api/tenant';
import { OrganizerShell } from '../components/organizer/OrganizerShell';
import { TenantSwitcher } from '../components/ui';

export const OrganizerTeam = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, 'tenant_admin' | 'tenant_guide'>>({});
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [busyActionMemberId, setBusyActionMemberId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'tenant_admin' | 'tenant_guide'>('tenant_guide');
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async (activeTenantId: string) => {
    if (!activeTenantId) return;
    try {
      const response = await api.getOrganizerTeam(activeTenantId);
      setMembers(response.data);
      const drafts: Record<string, 'tenant_admin' | 'tenant_guide'> = {};
      response.data.forEach((member) => {
        if (member.role === 'tenant_admin' || member.role === 'tenant_guide') {
          drafts[member.id] = member.role;
        }
      });
      setRoleDrafts(drafts);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load team');
    }
  };

  useEffect(() => {
    loadMembers(tenantId);
  }, [tenantId]);

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tenantId) return;
    setError(null);
    try {
      await api.createOrganizerTeamMember(tenantId, { email, displayName, role });
      setEmail('');
      setDisplayName('');
      setRole('tenant_guide');
      await loadMembers(tenantId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to add member');
    }
  };

  const updateMemberRole = async (memberId: string) => {
    if (!tenantId) return;
    const nextRole = roleDrafts[memberId];
    if (!nextRole) return;
    setError(null);
    setSavingMemberId(memberId);
    try {
      await api.updateOrganizerTeamMemberRole(tenantId, memberId, nextRole);
      await loadMembers(tenantId);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update member role');
    } finally {
      setSavingMemberId(null);
    }
  };

  const toggleMemberStatus = async (memberId: string, nextActive: boolean) => {
    if (!tenantId) return;
    setError(null);
    setBusyActionMemberId(memberId);
    try {
      await api.toggleOrganizerTeamMemberStatus(tenantId, memberId, nextActive);
      await loadMembers(tenantId);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update member access');
    } finally {
      setBusyActionMemberId(null);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!tenantId) return;
    setError(null);
    setBusyActionMemberId(memberId);
    try {
      await api.removeOrganizerTeamMember(tenantId, memberId);
      await loadMembers(tenantId);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to remove member');
    } finally {
      setBusyActionMemberId(null);
    }
  };

  return (
    <OrganizerShell title="Team">
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
            <select className="border rounded-md px-3 py-2" value={role} onChange={(event) => setRole(event.target.value as 'tenant_admin' | 'tenant_guide')}>
              <option value="tenant_guide">Guide</option>
              <option value="tenant_admin">Admin</option>
            </select>
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
              {members.map((member) => (
                <tr key={member.id} className="border-t">
                  <td className="px-4 py-3">{member.displayName}</td>
                  <td className="px-4 py-3">{member.email}</td>
                  <td className="px-4 py-3">
                    {member.role === 'tenant_owner' ? (
                      <span className="capitalize">tenant owner</span>
                    ) : (
                      <select
                        className="border rounded-md px-2 py-1.5 text-xs"
                        value={roleDrafts[member.id] ?? 'tenant_guide'}
                        onChange={(event) =>
                          setRoleDrafts((current) => ({
                            ...current,
                            [member.id]: event.target.value as 'tenant_admin' | 'tenant_guide'
                          }))
                        }
                      >
                        <option value="tenant_guide">Guide</option>
                        <option value="tenant_admin">Admin</option>
                      </select>
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
    </OrganizerShell>
  );
};
