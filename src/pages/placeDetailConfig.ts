import type { ActivityType } from '@uaetrail/shared-types';
import { VENUE_TYPE_LABELS } from '../config/activityTypes';

/** URL segment kind for place detail pages (`/trail`, `/camp`, `/event`). */
export type PlaceDetailKind = 'trail' | 'camp' | 'event';

export type PlaceDetailAccent = 'emerald' | 'amber' | 'violet';

type PlaceActivityType = Extract<ActivityType, 'hiking' | 'camping' | 'event'>;

export interface PlaceDetailKindConfig {
  activityType: PlaceActivityType;
  accent: PlaceDetailAccent;
  pathPrefix: `/trail` | `/camp` | `/event`;
  backLabel: string;
  loadingTitle: string;
  notFoundTitle: string;
  imageAltSuffix: string;
  shareSuffix: string;
  activitiesHeading: string;
  activitiesSubheading: string;
  activitiesBrowseLabel: string;
  emptyActivitiesMessage: string;
  emptyActivitiesLinkLabel: string;
  spinnerBorderClass: string;
  notFoundLinkClass: string;
  typeBadge?: string;
}

export const PLACE_DETAIL_CONFIG: Record<PlaceDetailKind, PlaceDetailKindConfig> = {
  trail: {
    activityType: 'hiking',
    accent: 'emerald',
    pathPrefix: '/trail',
    backLabel: 'Hiking venues',
    loadingTitle: 'Loading trail',
    notFoundTitle: 'Trail not found',
    imageAltSuffix: 'hiking trail',
    shareSuffix: 'hiking trail on UAE Trails',
    activitiesHeading: 'Upcoming activities',
    activitiesSubheading: 'Join organized hikes at this trail',
    activitiesBrowseLabel: 'View all activities',
    emptyActivitiesMessage: 'No upcoming activities scheduled for this trail yet.',
    emptyActivitiesLinkLabel: 'Check all upcoming activities',
    spinnerBorderClass: 'border-emerald-600',
    notFoundLinkClass: 'text-emerald-600 hover:text-emerald-700',
  },
  camp: {
    activityType: 'camping',
    accent: 'amber',
    pathPrefix: '/camp',
    backLabel: 'Camping venues',
    loadingTitle: 'Loading camp',
    notFoundTitle: 'Camping spot not found',
    imageAltSuffix: 'camping spot',
    shareSuffix: 'camping spot on UAE Trails',
    activitiesHeading: 'Upcoming camping activities',
    activitiesSubheading: 'Join organized camping at this location',
    activitiesBrowseLabel: 'View all activities',
    emptyActivitiesMessage: 'No upcoming activities scheduled for this location yet.',
    emptyActivitiesLinkLabel: 'Check all upcoming activities',
    spinnerBorderClass: 'border-amber-600',
    notFoundLinkClass: 'text-amber-600 hover:text-amber-700',
  },
  event: {
    activityType: 'event',
    accent: 'violet',
    pathPrefix: '/event',
    backLabel: 'Event venues',
    loadingTitle: 'Loading event venue',
    notFoundTitle: `${VENUE_TYPE_LABELS.event} not found`,
    imageAltSuffix: `${VENUE_TYPE_LABELS.event.toLowerCase()} venue`,
    shareSuffix: `${VENUE_TYPE_LABELS.event.toLowerCase()} venue on UAE Trails`,
    activitiesHeading: 'Upcoming Events',
    activitiesSubheading: 'Trail runs, races, and community events at this venue',
    activitiesBrowseLabel: 'View all events',
    emptyActivitiesMessage: 'No upcoming events scheduled at this venue yet.',
    emptyActivitiesLinkLabel: 'Browse all events',
    spinnerBorderClass: 'border-violet-600',
    notFoundLinkClass: 'text-violet-600 hover:text-violet-700',
    typeBadge: VENUE_TYPE_LABELS.event,
  },
};
