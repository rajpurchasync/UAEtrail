import { useEffect, useState } from 'react';
import { api, TeamMember } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

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
    api
      .getOrganizerTeam(tenantId)
      .then((res) => {
        setHosts(res.data);
      })
      .catch(() => setHosts([]))
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => {
    if (value || hosts.length === 0) return;
    const self = user ? hosts.find((m) => m.userId === user.id) : undefined;
    onChange(self?.userId ?? hosts[0].userId);
  }, [hosts, value, user?.id, onChange]);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        Host <span className="text-neutral-400 font-normal">(runs the event on the day)</span>
        {required && <span className="text-red-500"> *</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={loading || hosts.length === 0}
        className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-60"
      >
        {loading && <option value="">Loading team…</option>}
        {!loading && hosts.length === 0 && <option value="">No team members — add hosts in Team</option>}
        {hosts.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.displayName || member.email}
            {member.userId === user?.id ? ' (you)' : ''}
          </option>
        ))}
      </select>
      <p className="text-xs text-neutral-500 mt-1">
        Every activity needs a named host — the person participants can contact and who is responsible on site.
      </p>
    </div>
  );
};
