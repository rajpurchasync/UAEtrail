import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  mapFilterToActivityListFilter,
  mapFilterToVenueListFilter,
  type ActivityListFilterKey,
  type ExplorePanel,
  type MapFilterKey,
  type VenueListFilterKey,
} from '../routing';

export type DesktopBrowseTab = 'activities' | 'venues';

export const ACTIVITY_LIST_FILTERS: Array<{ key: ActivityListFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'carpool', label: 'Rideshare' },
  { key: 'event', label: 'Events' },
];

export const VENUE_LIST_FILTERS: Array<{ key: VenueListFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'event', label: 'Events' },
  { key: 'shop', label: 'Shop' },
];

export const PANEL_TABS: Array<{ key: ExplorePanel; label: string }> = [
  { key: 'activities', label: 'Activities' },
  { key: 'venues', label: 'Venues' },
  { key: 'shops', label: 'Shops' },
];

export const DESKTOP_BROWSE_TABS: Array<{ key: DesktopBrowseTab; label: string }> = [
  { key: 'activities', label: 'Activities' },
  { key: 'venues', label: 'Venues' },
];

export const MAP_FILTERS_BY_BROWSE_TAB: Record<DesktopBrowseTab, MapFilterKey[]> = {
  activities: ['all', 'hiking', 'camping', 'carpool', 'others', 'shops'],
  venues: ['all', 'hiking', 'camping', 'others', 'shops'],
};

export const parseDesktopBrowseTab = (panel: ExplorePanel): DesktopBrowseTab =>
  panel === 'venues' ? 'venues' : 'activities';

const listItemLabel = (activityFilter: ActivityListFilterKey, count: number): string => {
  if (activityFilter === 'carpool') return `${count} rideshare${count === 1 ? '' : 's'} in your area`;
  if (activityFilter === 'event') return `${count} event${count === 1 ? '' : 's'} in your area`;
  if (activityFilter === 'hiking') return `${count} hike${count === 1 ? '' : 's'} in your area`;
  if (activityFilter === 'camping') return `${count} camp${count === 1 ? '' : 's'} in your area`;
  return `${count} activit${count === 1 ? 'y' : 'ies'} in your area`;
};

const venueListLabel = (venueFilter: VenueListFilterKey, count: number): string => {
  if (venueFilter === 'hiking') return `${count} hiking venue${count === 1 ? '' : 's'} in your area`;
  if (venueFilter === 'camping') return `${count} camping spot${count === 1 ? '' : 's'} in your area`;
  if (venueFilter === 'event') return `${count} event venue${count === 1 ? '' : 's'} in your area`;
  if (venueFilter === 'shop') return `${count} shop${count === 1 ? '' : 's'} in your area`;
  return `${count} venue${count === 1 ? '' : 's'} in your area`;
};

export const panelListTitle = (
  panel: ExplorePanel,
  count: number,
  activityFilter: ActivityListFilterKey,
  venueFilter: VenueListFilterKey
): string => {
  if (panel === 'venues') return venueListLabel(venueFilter, count);
  if (panel === 'shops') return 'Gear shops & partners';
  return listItemLabel(activityFilter, count);
};

export const desktopBrowseListTitle = (tab: DesktopBrowseTab, count: number, mapFilter: MapFilterKey): string => {
  if (tab === 'activities') {
    return listItemLabel(mapFilterToActivityListFilter(mapFilter), count);
  }
  return venueListLabel(mapFilterToVenueListFilter(mapFilter), count);
};

export const desktopSearchPlaceholder = (tab: DesktopBrowseTab): string =>
  tab === 'venues' ? 'Search venues…' : 'Search activities…';

export const panelSearchPlaceholder = (panel: ExplorePanel): string => {
  if (panel === 'venues') return 'Search places…';
  if (panel === 'shops') return 'Search shops…';
  return 'Search activities…';
};

export type ShopListSections = {
  physical: ExploreMapItemDTO[];
  online: ExploreMapItemDTO[];
};

export const browseListEmptyMessage = (input: {
  isDesktop: boolean;
  desktopBrowseTab: DesktopBrowseTab;
  sidebarPanel: ExplorePanel;
  emptyFiltersCopy: string;
}): string => {
  const { isDesktop, desktopBrowseTab, sidebarPanel, emptyFiltersCopy } = input;
  if (isDesktop) {
    return desktopBrowseTab === 'venues' ? 'No venues match this filter yet.' : emptyFiltersCopy;
  }
  if (sidebarPanel === 'venues') return 'No venues match this filter yet.';
  if (sidebarPanel === 'shops') return 'No gear shops listed yet.';
  return emptyFiltersCopy;
};
