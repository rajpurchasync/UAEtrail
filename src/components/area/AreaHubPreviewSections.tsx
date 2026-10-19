import { Link } from 'react-router-dom';
import type { ActivityDTO, LocationDTO } from '@uaetrail/shared-types';
import { activityDetailPath, placeDetailPath } from '@uaetrail/shared-types';
import { explorePath, exploreShopsPath } from '../../explore/routing';
import { addPlaceCompose, hostCompose, seekFixedCompose } from '../../explore/compose';
import { exploreMapPeekPath } from '@uaetrail/shared-types';
import { communityShopPlaceToView } from '../../utils/communityShopPlace';
import {
  groupAreaHubPlaces,
  placeDetailRouteKindForRow,
  placeKindLabelForRow,
} from './areaHubPlaceGroups';

export type AreaHubOperatorPreview = {
  id: string;
  name: string;
  slug: string;
  profileKind: 'agency' | 'pro_guide';
  path: string;
};

export type AreaHubPreviewMode = 'all' | 'activities' | 'places';

type AreaHubPreviewSectionsProps = {
  areaSlug: string;
  activities: ActivityDTO[];
  places: LocationDTO[];
  operators?: AreaHubOperatorPreview[];
  /** Split hub content across area detail tabs (S9 Phase 4). Default `all`. */
  mode?: AreaHubPreviewMode;
};

const PREVIEW_PER_GROUP = 5;

const formatActivityWhen = (activity: ActivityDTO): string => {
  const parts = [activity.date, activity.time].filter(Boolean);
  return parts.join(' · ') || 'Soon';
};

const shopHrefForPlace = (place: LocationDTO): string => {
  const view = communityShopPlaceToView(place);
  if (view) return exploreMapPeekPath(`venue:${place.id}`, 'shops');
  return placeDetailPath('shop', place.id);
};

/** Curated area hub — upcoming outings + catalog places with explore deep links. */
export const AreaHubPreviewSections = ({
  areaSlug,
  activities,
  places,
  operators = [],
  mode = 'all',
}: AreaHubPreviewSectionsProps) => {
  const showAll = mode === 'all';
  const showActivities = showAll || mode === 'activities';
  const showPlaces = showAll || mode === 'places';

  const exploreActivities = explorePath({ list: true, area: areaSlug, panel: 'activities' });
  const exploreToday = explorePath({ list: true, area: areaSlug, panel: 'activities', date: 'today' });
  const explorePlaces = explorePath({ list: true, area: areaSlug, panel: 'venues' });
  const exploreShopsInArea = explorePath({ area: areaSlug, panel: 'shops', filter: 'shops' });
  const placeGroups = groupAreaHubPlaces(places);
  const shopsForRail = placeGroups.find((g) => g.key === 'shops')?.places.slice(0, 8) ?? [];

  return (
    <div className={showAll ? 'mt-8 space-y-8' : 'space-y-8'}>
      {showActivities ? (
      <section className="flex flex-wrap gap-2">
        <Link
          to={explorePath({
            area: areaSlug,
            compose: seekFixedCompose('hiking'),
          })}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900"
        >
          Find crew
        </Link>
        <Link
          to={explorePath({
            area: areaSlug,
            compose: hostCompose('hiking'),
          })}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
        >
          Host an outing
        </Link>
        <Link
          to={explorePath({
            area: areaSlug,
            compose: addPlaceCompose('hiking'),
          })}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
        >
          Add a place
        </Link>
      </section>
      ) : null}

      {showPlaces && shopsForRail.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Gear & shops</h2>
            <Link to={exploreShopsInArea} className="text-sm font-semibold text-emerald-800">
              On the map
            </Link>
          </div>
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x">
            {shopsForRail.map((place) => (
              <li key={place.id} className="w-[min(72vw,220px)] shrink-0 snap-start">
                <Link
                  to={shopHrefForPlace(place)}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-200"
                >
                  <span className="font-medium text-slate-900 line-clamp-2">{place.name}</span>
                  <span className="mt-1 text-xs text-slate-500">Shop · {areaSlug}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to={exploreShopsPath()} className="text-sm text-slate-600 underline-offset-2 hover:underline">
            Browse all gear shops
          </Link>
        </section>
      ) : null}

      {showPlaces && operators.length > 0 ? (
        <section className="space-y-3" id="operators">
          <div className="flex items-end justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Guides & operators</h2>
            <Link to={exploreActivities} className="text-sm font-semibold text-emerald-800">
              Outings here
            </Link>
          </div>
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x">
            {operators.map((operator) => (
              <li key={operator.id} className="w-[min(72vw,220px)] shrink-0 snap-start">
                <Link
                  to={operator.path}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-200"
                >
                  <span className="font-medium text-slate-900 line-clamp-2">{operator.name}</span>
                  <span className="mt-1 text-xs text-slate-500">
                    {operator.profileKind === 'agency' ? 'Tour operator' : 'Pro guide'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showActivities ? (
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
            <Link
              to={explorePath({
            area: areaSlug,
            compose: hostCompose('hiking'),
          })}
              className="font-semibold text-emerald-800"
            >
              Host one
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
      ) : null}

      {showPlaces ? (
      <section className="space-y-5" id="places-list">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Places in this area</h2>
          <Link to={explorePlaces} className="text-sm font-semibold text-emerald-800">
            All on map
          </Link>
        </div>
        {placeGroups.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-600">
            Catalog places in this area will show here once they are linked with an area tag.{' '}
            <Link
              to={explorePath({
            area: areaSlug,
            compose: addPlaceCompose('hiking'),
          })}
              className="font-semibold text-emerald-800"
            >
              Add one
            </Link>
          </p>
        ) : (
          placeGroups.map((group) => (
            <div key={group.key} className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {group.label}
              </h3>
              <ul className="divide-y rounded-2xl border border-slate-200 bg-white">
                {group.places.slice(0, PREVIEW_PER_GROUP).map((place) => (
                  <li key={place.id}>
                    <Link
                      to={
                        group.key === 'shops'
                          ? shopHrefForPlace(place)
                          : placeDetailPath(placeDetailRouteKindForRow(place), place.id)
                      }
                      className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-900">{place.name}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {placeKindLabelForRow(place)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {group.places.length > PREVIEW_PER_GROUP ? (
                <p className="text-xs text-slate-500">
                  +{group.places.length - PREVIEW_PER_GROUP} more in {group.label.toLowerCase()}
                </p>
              ) : null}
            </div>
          ))
        )}
      </section>
      ) : null}
    </div>
  );
};
