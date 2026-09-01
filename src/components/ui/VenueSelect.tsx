import { Link } from 'react-router-dom';
import type { LocationDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { LocationSelect } from './LocationSelect';

interface VenueSelectProps {
  value: string;
  onChange: (locationId: string) => void;
  activityType?: ActivityType;
  tenantId?: string;
  locations?: LocationDTO[];
  required?: boolean;
}

const addVenueHref = (tenantId?: string) =>
  tenantId ? '/organizer/locations' : '/discovery';

/**
 * Pick where a scheduled activity takes place.
 * Adding a new venue is a separate flow (Discovery or Organizer → Venues).
 */
export const VenueSelect = ({
  value,
  onChange,
  activityType,
  tenantId,
  locations,
  required = true,
}: VenueSelectProps) => {
  const venueLink = addVenueHref(tenantId);

  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 space-y-2">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Venue{required ? ' *' : ''}
        </label>
        <p className="text-xs text-gray-500 mb-2">
          The trail, camp, or spot where this activity happens — not the activity itself.
        </p>
        <LocationSelect
          value={value}
          onChange={onChange}
          activityType={activityType}
          tenantId={tenantId}
          locations={locations}
          required={required}
          emptyHelp={
            <p className="text-xs text-gray-600">
              <Link to={venueLink} className="text-emerald-700 font-semibold hover:underline">
                Add a venue first
              </Link>
              , then come back to schedule your activity.
            </p>
          }
        />
      </div>
      <p className="text-xs text-gray-500 border-t border-gray-100 pt-2">
        <span className="font-medium text-gray-700">Different flow:</span> submitting a venue (Discovery or{' '}
        <Link to="/organizer/locations" className="text-emerald-700 hover:underline">
          Organizer → Venues
        </Link>
        ) is separate from creating an activity.
      </p>
    </div>
  );
};
