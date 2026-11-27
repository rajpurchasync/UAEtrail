import { useCallback, useEffect, useState } from 'react';
import {
  createOrganisationTeamMember,
  fetchOrganisationTeam,
  removeOrganisationTeamMember,
  type TeamMember,
} from '../../hooks/operatorDeskClientApi';
import { GlassCard } from '../../components/mobile/GlassCard';
import { AppButton } from '../../components/mobile/AppButton';
import { AppSelect } from '../../components/ui/AppSelect';

const HOST_TEAM_ROLE_OPTIONS = [
  { value: 'tenant_guide' as const, label: 'Guide' },
  { value: 'tenant_admin' as const, label: 'Admin' },
];

interface AgencyTeamSectionProps {
  tenantId: string;
}

/** Add and manage agency employees — must already have a UAE Trail account. */
export const AgencyTeamSection = ({ tenantId }: AgencyTeamSectionProps) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'tenant_admin' | 'tenant_guide'>('tenant_guide');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await fetchOrganisationTeam(tenantId);
      setMembers(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tenantId) return;
    setError(null);
    setBusy(true);
    try {
      await createOrganisationTeamMember(tenantId, { email: email.trim(), role });
      setEmail('');
      setRole('tenant_guide');
      await loadMembers();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to add team member');
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!tenantId) return;
    setBusy(true);
    setError(null);
    try {
      await removeOrganisationTeamMember(tenantId, memberId);
      await loadMembers();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Failed to remove member');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <GlassCard padding>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Add guides and admins by email. They must already be signed up on UAE Trail — ask them to create an account
          first if you do not see them added.
        </p>
        <form onSubmit={addMember} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="colleague@example.com"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Role</label>
            <AppSelect
              value={role}
              onChange={setRole}
              options={HOST_TEAM_ROLE_OPTIONS}
              inputClassName="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              aria-label="Team member role"
            />
          </div>
          <AppButton type="submit" disabled={busy} className="w-full">
            {busy ? 'Adding…' : 'Add team member'}
          </AppButton>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </GlassCard>

      <GlassCard padding>
        <h3 className="text-sm font-bold text-neutral-900">Team ({members.length})</h3>
        {loading ? (
          <p className="mt-3 text-sm text-neutral-500">Loading team…</p>
        ) : members.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No team members yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{member.displayName}</p>
                  <p className="text-xs text-neutral-500 truncate">{member.email}</p>
                  <p className="text-[11px] font-medium text-emerald-700 capitalize mt-0.5">
                    {member.role.replace('_', ' ')}
                  </p>
                </div>
                {member.role !== 'tenant_owner' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void removeMember(member.id)}
                    className="shrink-0 text-xs font-semibold text-rose-700"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
};
