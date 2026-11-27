import { useEffect, useState } from 'react';
import { fetchOrganisationTeam, type TeamMember } from '../../hooks/operatorDeskClientApi';
import { useAuth } from '../../context/AuthContext';
import { AppSelect } from './AppSelect';

interface HostSelectProps {
  tenantId: string;
  value: string;
  onChange: (userId: string) => void;
  required?: boolean;
  className?: string;
}

export const HostSelect = ({ tenantId, value, onChange, required, className = '' }: HostSelectProps) => {
  const { user } = useAuth();
  const [hosts, setHosts] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) {
      setHosts([]);
      return;
    }
    setLoading(true);
    fetchOrganisationTeam(tenantId)
      .then((data) => setHosts(data))
      .catch(() => setHosts([]))
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => {
    if (value || hosts.length === 0) return;
    const self = user ? hosts.find((m) => m.userId === user.id) : undefined;
    onChange(self?.userId ?? hosts[0].userId);
  }, [hosts, value, user, onChange]);

  const hostOptions = hosts.map((member) => ({
    value: member.userId,
    label: `${member.displayName || member.email}${member.userId === user?.id ? ' (you)' : ''}`,
  }));

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        Host <span className="text-neutral-400 font-normal">(runs the event on the day)</span>
        {required && <span className="text-red-500"> *</span>}
      </label>
      <AppSelect
        value={value}
        onChange={onChange}
        options={hostOptions}
        disabled={loading || hosts.length === 0}
        placeholder={loading ? 'Loading team…' : 'No team members — add hosts in Team'}
        inputClassName="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
        aria-label="Event host"
      />
      <p className="text-xs text-neutral-500 mt-1">
        Every activity needs a named host — the person participants can contact and who is responsible on site.
      </p>
    </div>
  );
}
