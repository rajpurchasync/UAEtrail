import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LocationDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { api } from '../../api/services';

interface VenueSelectProps {
  value: string;
  onChange: (locationId: string) => void;
  activityType?: ActivityType;
  tenantId?: string;
  locations?: LocationDTO[];
  required?: boolean;
}

const addVenueHref = (tenantId?: string) =>
  tenantId ? '/host/locations' : '/discovery';

const fieldClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';

/** Pick where a scheduled activity takes place. */
export const VenueSelect = ({
  value,
  onChange,
  activityType,
  tenantId,
  locations: locationsOverride,
  required = true,
}: VenueSelectProps) => {
  const [activeLocations, setActiveLocations] = useState<LocationDTO[]>(locationsOverride ?? []);
  const [pendingLocations, setPendingLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locationsOverride) {
      setActiveLocations(locationsOverride);
      setPendingLocations([]);
      return;
    }

    let disposed = false;
    setLoading(true);

    void Promise.all([
      api.getPublicLocations(),
      tenantId ? api.getHostSubmittedLocations(tenantId) : Promise.resolve({ data: [] as LocationDTO[] }),
    ])
      .then(([publicRes, pendingRes]) => {
        if (disposed) return;
        setActiveLocations(publicRes.data);
        setPendingLocations(pendingRes.data.filter((l) => l.status === 'draft'));
      })
      .catch(() => {
        if (!disposed) {
          setActiveLocations([]);
          setPendingLocations([]);
        }
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });

    return () => {
      disposed = true;
    };
  }, [tenantId, locationsOverride]);

  const matchType = (location: LocationDTO) =>
    !activityType || location.activityType === activityType;

  const active = useMemo(
    () =>
      activeLocations
        .filter(matchType)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [activeLocations, activityType]
  );

  const pending = useMemo(
    () =>
      pendingLocations
        .filter(matchType)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [pendingLocations, activityType]
  );

  const listEmpty = !loading && active.length === 0 && pending.length === 0;
  const venueLink = addVenueHref(tenantId);

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">
        Venue{required ? ' *' : ''}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={loading}
        className={fieldClass}
      >
        <option value="">{loading ? 'Loading venues…' : 'Select venue…'}</option>
        {active.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name} ({location.region})
          </option>
        ))}
        {pending.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name} — pending review
          </option>
        ))}
      </select>
      {listEmpty && (
        <p className="text-xs text-gray-500 mt-1">
          No venues yet.{' '}
          <Link to={venueLink} className="text-emerald-700 font-medium hover:underline">
            Add a venue
          </Link>{' '}
          first, then schedule your activity.
        </p>
      )}
    </div>
  );
};
