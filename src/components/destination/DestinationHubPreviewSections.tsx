import { Link } from 'react-router-dom';
import { ConsumerDetailSection } from '../../detail/shell/ConsumerDetailSection';
import { HorizontalDragScroll } from '../ui/HorizontalDragScroll';
import type { ActivityDTO, LocationDTO } from '@uaetrail/shared-types';
import { activityDetailPath, placeDetailPath } from '@uaetrail/shared-types';
import { explorePath, exploreShopsPath } from '../../explore/routing';
import { placeCompose, activityCompose } from '../../explore/compose';
import { exploreMapPeekPath } from '@uaetrail/shared-types';
import { communityShopPlaceToView } from '../../utils/communityShopPlace';
import {
  groupAreaHubPlaces,
  placeDetailRouteKindForRow,
  placeKindLabelForRow,
} from './destinationHubPlaceGroups';

export type AreaHubOperatorPreview = {
  id: string;
  name: string;
  slug: string;
  profileKind: 'agency' | 'pro_guide';
  path: string;
};

export type AreaHubPreviewMode = 'all' | 'activities' | 'places';

type DestinationHubPreviewSectionsProps = {
  destinationSlug: string;
  activities: ActivityDTO[];
  places: LocationDTO[];
  operators?: AreaHubOperatorPreview[];
  /** Split hub content across area detail tabs (S9 Phase 4). Default `all`. */
  mode?: AreaHubPreviewMode;
};

const PREVIEW_PER_GROUP = 5;
const RAIL_CARD_CLASS =
  'box-border w-[min(16.5rem,calc(100%-2.75rem))] max-w-full shrink-0 snap-start';
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
export const DestinationHubPreviewSections = ({
  destinationSlug,
  activities,
  places,
  operators = [],
  mode = 'all',
}: DestinationHubPreviewSectionsProps) => {
  const showAll = mode === 'all';
  const showActivities = showAll || mode === 'activities';
  const showPlaces = showAll || mode === 'places';

  const exploreActivities = explorePath({ list: true, destination: destinationSlug, panel: 'activities' });
  const exploreToday = explorePath({ list: true, destination: destinationSlug, panel: 'activities', date: 'today' });
  const explorePlaces = explorePath({ list: true, destination: destinationSlug, panel: 'venues' });
  const exploreShopsInDestination = explorePath({ destination: destinationSlug, panel: 'shops', filter: 'shops' });
  const placeGroups = groupAreaHubPlaces(places);
  const shopsForRail = placeGroups.find((g) => g.key === 'shops')?.places.slice(0, 8) ?? [];
  const facilitiesForRail = placeGroups.find((g) => g.key === 'facilities')?.places.slice(0, 8) ?? [];

  return (
    <div className={showAll ? 'mt-3 min-w-0 space-y-3 lg:mt-8 lg:space-y-8' : 'min-w-0 space-y-3 lg:space-y-8'}>
      {showPlaces && facilitiesForRail.length > 0 ? (
        <ConsumerDetailSection title="Facilities" tone="slate" collapsible defaultExpanded>
          <ul className="space-y-2">
            {facilitiesForRail.map((place) => (
              <li key={place.id}>
                <Link
                  to={placeDetailPath(placeDetailRouteKindForRow(place), place.id)}
                  className="text-sm font-semibold leading-snug text-emerald-900 [overflow-wrap:anywhere] hover:underline"
                >
                  {place.name}
                </Link>
                <span className="block text-xs text-slate-500 [overflow-wrap:anywhere]">
                  {placeKindLabelForRow(place)}
                </span>
              </li>
            ))}
          </ul>
        </ConsumerDetailSection>
      ) : null}

      {showPlaces && shopsForRail.length > 0 ? (
        <ConsumerDetailSection title="Gear & shops" tone="amber" collapsible defaultExpanded>
          <p className="mb-3 text-end">
            <Link
              to={exploreShopsInDestination}
              className="text-xs font-semibold text-amber-900 underline-offset-2 hover:underline dark:text-amber-100"
            >
              On the map
            </Link>
          </p>
          <HorizontalDragScroll className="pb-1 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
            <ul className="flex w-max max-w-none gap-3">
            {shopsForRail.map((place) => (
              <li key={place.id} className={RAIL_CARD_CLASS}>
                <Link
                  to={shopHrefForPlace(place)}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-200 dark:border-neutral-700 dark:bg-neutral-900"
                  draggable={false}
                >
                  <span className="font-medium text-slate-900 line-clamp-2 [overflow-wrap:anywhere]">{place.name}</span>
                  <span className="mt-1 text-xs text-slate-500">Shop · {destinationSlug}</span>
                </Link>
              </li>
            ))}
            </ul>
          </HorizontalDragScroll>
          <Link to={exploreShopsPath()} className="text-sm text-slate-600 underline-offset-2 hover:underline">
            Browse all gear shops
          </Link>
        </ConsumerDetailSection>
      ) : null}

      {showPlaces && operators.length > 0 ? (
        <ConsumerDetailSection
          id="operators"
          title="Guides & operators"
          tone="violet"
          collapsible
          defaultExpanded
        >
          <p className="mb-3 text-end">
            <Link
              to={exploreActivities}
              className="text-xs font-semibold text-violet-900 underline-offset-2 hover:underline dark:text-violet-100"
            >
              Outings here
            </Link>
          </p>
          <HorizontalDragScroll className="pb-1 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
            <ul className="flex w-max max-w-none gap-3">
            {operators.map((operator) => (
              <li key={operator.id} className={RAIL_CARD_CLASS}>
                <Link
                  to={operator.path}
                  className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-200 dark:border-neutral-700 dark:bg-neutral-900"
                  draggable={false}
                >
                  <span className="font-medium text-slate-900 line-clamp-2 [overflow-wrap:anywhere]">{operator.name}</span>
                  <span className="mt-1 text-xs text-slate-500">
                    {operator.profileKind === 'agency' ? 'Tour operator' : 'Pro guide'}
                  </span>
                </Link>
              </li>
            ))}
            </ul>
          </HorizontalDragScroll>
        </ConsumerDetailSection>
      ) : null}

      {showActivities ? (
      <ConsumerDetailSection title="Happening soon" tone="emerald" collapsible defaultExpanded>
        <p className="mb-3 text-end">
          <Link
            to={exploreActivities}
            className="text-xs font-semibold text-emerald-900 underline-offset-2 hover:underline dark:text-emerald-100"
          >
            All outings
          </Link>
        </p>
        {activities.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-600">
            No published outings in this destination yet.{' '}
            <Link
              to={explorePath({
            destination: destinationSlug,
            compose: activityCompose('hiking'),
          })}
              className="font-semibold text-emerald-800"
            >
              Host one
            </Link>
          </p>
        ) : (
          <ul className="divide-y rounded-2xl border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
            {activities.map((activity) => (
              <li key={activity.id}>
                <Link
                  to={activityDetailPath(activity.id)}
                  className="flex min-w-0 flex-col gap-0.5 px-4 py-3 hover:bg-slate-50"
                >
                  <span className="font-medium leading-snug text-slate-900 [overflow-wrap:anywhere]">{activity.title}</span>
                  <span className="text-xs text-slate-500">
                    {formatActivityWhen(activity)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to={exploreToday} className="inline-block text-sm text-slate-600 underline-offset-2 hover:underline">
          See today on the map
        </Link>
      </ConsumerDetailSection>
      ) : null}

      {showPlaces ? (
      <ConsumerDetailSection
        id="places-list"
        title="Places in this destination"
        tone="sky"
        collapsible
        defaultExpanded
      >
        <p className="mb-3 text-end">
          <Link
            to={explorePlaces}
            className="text-xs font-semibold text-sky-900 underline-offset-2 hover:underline dark:text-sky-100"
          >
            All on map
          </Link>
        </p>
        <div className="space-y-5">
        {placeGroups.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-600">
            Catalog places in this destination will show here once they are linked to the hub.{' '}
            <Link
              to={explorePath({
            destination: destinationSlug,
            compose: placeCompose('hiking'),
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
              <ul className="min-w-0 divide-y overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                {group.places.slice(0, PREVIEW_PER_GROUP).map((place) => (
                  <li key={place.id} className="min-w-0">
                    <Link
                      to={
                        group.key === 'shops'
                          ? shopHrefForPlace(place)
                          : placeDetailPath(placeDetailRouteKindForRow(place), place.id)
                      }
                      className="grid min-w-0 grid-cols-1 gap-0.5 px-4 py-3 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-3"
                    >
                      <span className="min-w-0 break-words font-medium leading-snug text-slate-900">
                        {place.name}
                      </span>
                      <span className="min-w-0 break-words text-xs leading-snug text-slate-500 sm:text-right">
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
        </div>
      </ConsumerDetailSection>
      ) : null}
    </div>
  );
};
