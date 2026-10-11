import { Link } from 'react-router-dom';
import type { ActivityDTO, LocationDTO } from '@uaetrail/shared-types';
import { activityDetailPath, placeDetailPath } from '@uaetrail/shared-types';
import { explorePath } from '../../explore/routing';
import { VENUE_TYPE_LABELS } from '../../config/activityTypes';

type AreaHubPreviewSectionsProps = {
  areaSlug: string;
  activities: ActivityDTO[];
  places: LocationDTO[];
};

const placeKindLabel = (type: LocationDTO['activityType']): string => {
  if (type === 'hiking') return VENUE_TYPE_LABELS.hiking;
  if (type === 'camping') return VENUE_TYPE_LABELS.camping;
  if (type === 'event') return VENUE_TYPE_LABELS.event;
  if (type === 'shop') return 'Shop';
  return type;
};

const formatActivityWhen = (activity: ActivityDTO): string => {
  const parts = [activity.date, activity.time].filter(Boolean);
  return parts.join(' · ') || 'Soon';
};

/** Curated area hub — upcoming outings + catalog places with explore deep links. */
export const AreaHubPreviewSections = ({
  areaSlug,
  activities,
  places,
}: AreaHubPreviewSectionsProps) => {
  const exploreActivities = explorePath({ list: true, area: areaSlug, panel: 'activities' });
  const exploreToday = explorePath({ list: true, area: areaSlug, panel: 'activities', date: 'today' });
  const explorePlaces = explorePath({ list: true, area: areaSlug, panel: 'venues' });
  return (
    <div className="mt-8 space-y-8">
      <section className="flex flex-wrap gap-2">
        <Link
          to={explorePath({ area: areaSlug, compose: { intent: 'find', kind: 'hiking' } })}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900"
        >
          Find crew
        </Link>
        <Link
          to={explorePath({ area: areaSlug, compose: { intent: 'organize', kind: 'hiking' } })}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
        >
          Organize outing
        </Link>
        <Link
          to={explorePath({ area: areaSlug, compose: { intent: 'add', kind: 'hiking' } })}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
        >
          Add a place
        </Link>
      </section>
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Happening soon</h2>
          <Link to={exploreActivities} className="text-sm font-semibold text-emerald-800">
            All outings
          </Link>
        </div>
        {activities.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-600">
            No published outings in this area yet.{' '}
            <Link to={explorePath({ area: areaSlug, compose: { intent: 'organize', kind: 'hiking' } })} className="font-semibold text-emerald-800">
              Organize one
            </Link>
          </p>
        ) : (
          <ul className="divide-y rounded-2xl border border-slate-200 bg-white">
            {activities.map((activity) => (
              <li key={activity.id}>
                <Link
                  to={activityDetailPath(activity.id)}
                  className="flex flex-col gap-0.5 px-4 py-3 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{activity.title}</span>
                  <span className="text-xs text-slate-500">
                    {formatActivityWhen(activity)}
                    {activity.activityMode === 'seeking' ? ' · Seeking crew' : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to={exploreToday} className="inline-block text-sm text-slate-600 underline-offset-2 hover:underline">
          See today on the map
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Trails, camps & spots</h2>
          <Link to={explorePlaces} className="text-sm font-semibold text-emerald-800">
            All places
          </Link>
        </div>
        {places.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-600">
            Catalog places in this area will show here once admin links them with an area tag.
          </p>
        ) : (
          <ul className="divide-y rounded-2xl border border-slate-200 bg-white">
            {places.map((place) => (
              <li key={place.id}>
                <Link
                  to={placeDetailPath(place.activityType, place.id)}
                  className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{place.name}</span>
                  <span className="shrink-0 text-xs text-slate-500">{placeKindLabel(place.activityType)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
};
