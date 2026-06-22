import { useEffect, useMemo, useState } from 'react';
import { LocationDTO } from '@uaetrail/shared-types';
import { api } from '../../api/services';
import { SubmitLocationForm } from './SubmitLocationForm';

interface LocationSelectProps {
  value: string;
  onChange: (locationId: string) => void;
  tenantId?: string;
  activityType?: 'hiking' | 'camping';
  required?: boolean;
  className?: string;
}

export const LocationSelect = ({
  value,
  onChange,
  tenantId,
  activityType,
  required = true,
  className = 'w-full border rounded-xl px-3 py-2.5 text-sm'
}: LocationSelectProps) => {
  const [activeLocations, setActiveLocations] = useState<LocationDTO[]>([]);
  const [pendingLocations, setPendingLocations] = useState<LocationDTO[]>([]);
  const [showAddNew, setShowAddNew] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const loadLocations = async () => {
    try {
      const [publicRes, pendingRes] = await Promise.all([
        api.getPublicLocations(),
        tenantId ? api.getOrganizerSubmittedLocations(tenantId) : Promise.resolve({ data: [] as LocationDTO[] })
      ]);
      setActiveLocations(publicRes.data);
      setPendingLocations(pendingRes.data.filter((l) => l.status === 'draft'));
    } catch {
      /* non-critical */
    }
  };

  useEffect(() => {
    void loadLocations();
  }, [tenantId]);

  const options = useMemo(() => {
    const filtered = activityType
      ? activeLocations.filter((l) => l.activityType === activityType)
      : activeLocations;
    const pending = activityType
      ? pendingLocations.filter((l) => l.activityType === activityType)
      : pendingLocations;
    return { filtered, pending };
  }, [activeLocations, pendingLocations, activityType]);

  const handleSelect = (next: string) => {
    if (next === '__new__') {
      if (!tenantId) return;
      setShowAddNew(true);
      onChange('');
      return;
    }
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <select
        required={required}
        value={value}
        onChange={(e) => handleSelect(e.target.value)}
        className={className}
      >
        <option value="">Select location…</option>
        {options.filtered.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name} ({loc.region})
          </option>
        ))}
        {options.pending.map((loc) => (
          <option key={loc.id} value={loc.id} disabled>
            {loc.name} — pending approval
          </option>
        ))}
        {tenantId && <option value="__new__">+ Add new location…</option>}
      </select>

      {success && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{success}</p>}

      {!tenantId && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          Select your organization to submit a new location.
        </p>
      )}

      {showAddNew && tenantId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowAddNew(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add new location</h3>
            <SubmitLocationForm
              tenantId={tenantId}
              defaultActivityType={activityType ?? 'hiking'}
              compact
              onCancel={() => setShowAddNew(false)}
              onSubmitted={(loc) => {
                setShowAddNew(false);
                setSuccess(`"${loc.name}" submitted for review. You'll be notified when approved.`);
                void loadLocations();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
