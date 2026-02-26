import { useEffect, useState } from 'react';
import { api, TeamMember } from '../api/services';
import { getActiveTenantId } from '../api/tenant';
import { DashboardLayout } from '../components/layout';
import { TenantSwitcher } from '../components/ui';

const organizerLinks = [
  { to: '/organizer/overview', label: 'Overview' },
  { to: '/organizer/events', label: 'Events' },
  { to: '/organizer/requests', label: 'Join Requests' },
  { to: '/organizer/team', label: 'Team' },
  { to: '/organizer/profile', label: 'Profile' }
];

export const OrganizerTeam = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'tenant_admin' | 'tenant_guide'>('tenant_guide');
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async (activeTenantId: string) => {
    if (!activeTenantId) return;
    try {
      const response = await api.getOrganizerTeam(activeTenantId);
      setMembers(response.data);
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

  return (
    <DashboardLayout title="Organizer Dashboard" links={organizerLinks}>
      <div className="space-y-4">
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
        <section className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-t">
                  <td className="px-4 py-3">{member.displayName}</td>
                  <td className="px-4 py-3">{member.email}</td>
                  <td className="px-4 py-3 capitalize">{member.role.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </DashboardLayout>
  );
};
