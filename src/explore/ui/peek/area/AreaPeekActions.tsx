import { Link } from 'react-router-dom';
import type { ExploreAreaLensStatsDTO } from '@uaetrail/shared-types';
import { explorePath } from '../../../routing';
import type { ExplorePinKindFilter } from '../../../explorePinKindFilter';

export type AreaPeekActionsProps = {
  areaSlug: string;
  stats?: ExploreAreaLensStatsDTO | null;
  areaPagePath: string;
  onClose: () => void;
};

const scopedExplore = (
  areaSlug: string,
  pinKind: ExplorePinKindFilter,
  filter?: 'hiking' | 'camping' | 'shops'
): string =>
  explorePath({
    area: areaSlug,
    list: true,
    pinKind,
    filter,
  });

/**
 * **Area** hub page actions — Area is a curated name, not an explore map pin.
 * `facilities` = amenity pins in this hub (`areaLensStats.facilities`), linked via `#places`.
 */
export const AreaPeekActions = ({
  areaSlug,
  stats,
  areaPagePath,
  onClose,
}: AreaPeekActionsProps) => {
  const hosted = stats?.hostedActivities ?? 0;
  const available = stats?.availabilityPins ?? 0;
  const trails = stats?.trailSpots ?? 0;
  const camps = stats?.campSpots ?? 0;
  const facilities = stats?.facilities ?? 0;
  const shops = stats?.shops ?? 0;
  const spots = trails + camps;

  const linkClass =
    'block w-full rounded-2xl border border-slate-200 bg-white py-3 text-center text-sm font-semibold text-slate-900';

  return (
    <div className="mt-3 space-y-2">
      {hosted > 0 ? (
        <Link to={scopedExplore(areaSlug, 'activities')} className={linkClass} onClick={onClose}>
          Activities ({hosted})
        </Link>
      ) : null}
      {available > 0 ? (
        <Link
          to={`${scopedExplore(areaSlug, 'activities')}&activityMode=availability`}
          className={linkClass}
          onClick={onClose}
        >
          Available ({available})
        </Link>
      ) : null}
      {trails > 0 ? (
        <Link to={scopedExplore(areaSlug, 'places', 'hiking')} className={linkClass} onClick={onClose}>
          Trails ({trails})
        </Link>
      ) : null}
      {spots > 0 ? (
        <Link to={scopedExplore(areaSlug, 'places')} className={linkClass} onClick={onClose}>
          Spots ({spots})
        </Link>
      ) : null}
      {facilities > 0 ? (
        <Link to={`${areaPagePath}#places`} className={linkClass} onClick={onClose}>
          Facilities ({facilities})
        </Link>
      ) : null}
      {shops > 0 ? (
        <Link to={scopedExplore(areaSlug, 'shops', 'shops')} className={linkClass} onClick={onClose}>
          Shops ({shops})
        </Link>
      ) : null}
      <Link
        to={areaPagePath}
        className={`${linkClass} border-emerald-200 bg-emerald-50 text-emerald-900`}
        onClick={onClose}
      >
        Area page
      </Link>
    </div>
  );
};
