import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { MAP_FILTER_PILLS } from '../../config/exploreMapFilters';
import {
  activityFilterToMapFilter,
  clearFulfillIntentMapItemParams,
  mapFilterToActivityListFilter,
  mapFilterToVenueListFilter,
  parseActivityListFilter,
  parseExplorePanel,
  parseExploreActivityDate,
  parseMapFilter,
  parseVenueRegionsParam,
  venueFilterToMapFilter,
  type ActivityListFilterKey,
  type ExplorePanel,
  type MapFilterKey,
  type VenueListFilterKey,
} from '../routing';
import { MAP_FILTERS_BY_BROWSE_TAB, parseDesktopBrowseTab, type DesktopBrowseTab } from './exploreBrowsePanelCopy';
import { mapFilterToPanel, parseListOpen, readInitialListOpen } from './exploreListPanelUrl';

type SyncPatch = {
  filter?: MapFilterKey;
  activityFilter?: ActivityListFilterKey;
  panel?: ExplorePanel;
  list?: boolean;
  q?: string;
  venueRegions?: string[];
  activityDate?: string | null;
};

type UseExploreBrowseUrlStateArgs = {
  isDesktop: boolean;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  clearSelection: () => void;
};

export const useExploreBrowseUrlState = ({
  isDesktop,
  searchParams,
  setSearchParams,
  clearSelection,
}: UseExploreBrowseUrlStateArgs) => {
  const [mapFilter, setMapFilter] = useState<MapFilterKey>(() => parseMapFilter(searchParams.get('filter')));
  const [activityFilter, setActivityFilter] = useState<ActivityListFilterKey>(() =>
    parseActivityListFilter(searchParams.get('activity'))
  );
  const [panel, setPanel] = useState<ExplorePanel>(() => parseExplorePanel(searchParams.get('panel')));
  const [listOpen, setListOpen] = useState(() => readInitialListOpen(searchParams.get('list')));
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [venueFilter, setVenueFilter] = useState<VenueListFilterKey>('all');
  const [venueRegions, setVenueRegions] = useState<string[]>(() => parseVenueRegionsParam(searchParams));
  const [desktopBrowseTab, setDesktopBrowseTab] = useState<DesktopBrowseTab>(() =>
    parseDesktopBrowseTab(parseExplorePanel(searchParams.get('panel')))
  );
  const [searchExpanded, setSearchExpanded] = useState(() => Boolean(searchParams.get('q')?.trim()));
  const [activityDate, setActivityDate] = useState<string | null>(() =>
    parseExploreActivityDate(searchParams.get('date'))
  );

  const syncExploreUrl = useCallback(
    (next: SyncPatch) => {
      const params = new URLSearchParams(searchParams);
      const filterValue = next.filter ?? mapFilter;
      const activityFilterValue = next.activityFilter ?? activityFilter;
      const panelValue = next.panel ?? panel;
      const listValue = next.list ?? listOpen;
      const queryValue = next.q ?? query;
      const regionValue = next.venueRegions ?? venueRegions;
      const dateValue = next.activityDate !== undefined ? next.activityDate : activityDate;

      if (filterValue === 'all') params.delete('filter');
      else params.set('filter', filterValue);

      if (activityFilterValue === 'all') params.delete('activity');
      else params.set('activity', activityFilterValue);

      if (panelValue === 'activities') params.delete('panel');
      else params.set('panel', panelValue);

      if (listValue) params.set('list', '1');
      else params.set('list', '0');

      if (queryValue.trim()) params.set('q', queryValue.trim());
      else params.delete('q');

      if (dateValue && parseExploreActivityDate(dateValue)) params.set('date', dateValue);
      else params.delete('date');

      if (regionValue.length > 0) {
        params.set('regions', regionValue.join(','));
        params.delete('region');
      } else {
        params.delete('regions');
        params.delete('region');
      }

      params.delete('addLocation');
      params.delete('compose');
      params.delete('contribute');
      params.delete('request');
      clearFulfillIntentMapItemParams(params);

      setSearchParams(params, { replace: true });
    },
    [mapFilter, activityFilter, panel, listOpen, query, venueRegions, activityDate, searchParams, setSearchParams]
  );

  useEffect(() => {
    const nextMapFilterRaw = parseMapFilter(searchParams.get('filter'));
    const nextPanel = parseExplorePanel(searchParams.get('panel'));
    const nextBrowseTab = parseDesktopBrowseTab(nextPanel);
    const allowedForPlaces = MAP_FILTERS_BY_BROWSE_TAB.venues;
    const allowedForActivities = MAP_FILTERS_BY_BROWSE_TAB.activities;
    const inPlacesContext = isDesktop ? nextBrowseTab === 'venues' : nextPanel === 'venues';
    const inActivitiesContext = !inPlacesContext;
    let nextMapFilter = nextMapFilterRaw;
    if (inPlacesContext && !allowedForPlaces.includes(nextMapFilterRaw)) {
      nextMapFilter = 'all';
    } else if (inActivitiesContext && !allowedForActivities.includes(nextMapFilterRaw)) {
      nextMapFilter = 'all';
    }
    setMapFilter(nextMapFilter);
    setActivityFilter(parseActivityListFilter(searchParams.get('activity')));
    setVenueFilter(mapFilterToVenueListFilter(nextMapFilter));
    setPanel(nextPanel);
    setListOpen(parseListOpen(searchParams.get('list'), isDesktop));
    setQuery(searchParams.get('q') ?? '');
    setVenueRegions(parseVenueRegionsParam(searchParams));
    setActivityDate(parseExploreActivityDate(searchParams.get('date')));
    if (isDesktop) {
      setDesktopBrowseTab(parseDesktopBrowseTab(nextPanel));
      if (searchParams.get('q')?.trim()) setSearchExpanded(true);
    }
  }, [searchParams, isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;
    const listParam = searchParams.get('list');
    if (listParam === '0' || listParam === '1') return;
    syncExploreUrl({ list: true });
  }, [isDesktop, searchParams, syncExploreUrl]);

  const applyMapFilter = (next: MapFilterKey) => {
    setMapFilter(next);
    clearSelection();
    const syncedActivity = mapFilterToActivityListFilter(next);
    const syncedVenue = mapFilterToVenueListFilter(next);
    const inPlaces = isDesktop ? desktopBrowseTab === 'venues' : panel === 'venues';
    const syncedPanel = isDesktop
      ? inPlaces
        ? 'venues'
        : 'activities'
      : inPlaces && MAP_FILTERS_BY_BROWSE_TAB.venues.includes(next)
        ? 'venues'
        : !inPlaces && MAP_FILTERS_BY_BROWSE_TAB.activities.includes(next)
          ? 'activities'
          : mapFilterToPanel(next);
    setActivityFilter(syncedActivity);
    setVenueFilter(syncedVenue);
    setPanel(syncedPanel);
    syncExploreUrl({
      filter: next,
      panel: syncedPanel,
      activityFilter: syncedActivity,
      list: listOpen,
    });
  };

  const applyDesktopBrowseTab = (next: DesktopBrowseTab) => {
    setDesktopBrowseTab(next);
    clearSelection();
    setMapFilter('all');
    setActivityFilter('all');
    setVenueFilter('all');
    const syncedPanel = next === 'venues' ? 'venues' : 'activities';
    setPanel(syncedPanel);
    syncExploreUrl({
      filter: 'all',
      activityFilter: 'all',
      panel: syncedPanel,
      list: listOpen,
    });
  };

  const applyActivityFilter = (next: ActivityListFilterKey) => {
    setActivityFilter(next);
    clearSelection();
    const syncedMap = activityFilterToMapFilter(next);
    if (syncedMap && syncedMap !== mapFilter) {
      setMapFilter(syncedMap);
      setVenueFilter(mapFilterToVenueListFilter(syncedMap));
      setPanel('activities');
      syncExploreUrl({
        activityFilter: next,
        filter: syncedMap,
        panel: 'activities',
        list: listOpen,
      });
      return;
    }
    syncExploreUrl({ activityFilter: next, list: listOpen });
  };

  const applyPanel = (next: ExplorePanel) => {
    setPanel(next);
    clearSelection();
    const tab = parseDesktopBrowseTab(next);
    const allowed = MAP_FILTERS_BY_BROWSE_TAB[tab];
    const nextFilter = allowed.includes(mapFilter) ? mapFilter : 'all';
    if (nextFilter !== mapFilter) {
      setMapFilter(nextFilter);
      setActivityFilter(mapFilterToActivityListFilter(nextFilter));
      setVenueFilter(mapFilterToVenueListFilter(nextFilter));
    }
    if (isDesktop) {
      setDesktopBrowseTab(tab);
    }
    syncExploreUrl({
      panel: next,
      list: true,
      filter: nextFilter,
      activityFilter: mapFilterToActivityListFilter(nextFilter),
    });
    setListOpen(true);
  };

  const openBrowse = () => {
    clearSelection();
    setListOpen(true);
    syncExploreUrl({ list: true, panel });
  };

  const closeListPanel = () => {
    setListOpen(false);
    syncExploreUrl({ list: false });
  };

  const applyVenueFilter = (next: VenueListFilterKey) => {
    setVenueFilter(next);
    clearSelection();
    const syncedMap = venueFilterToMapFilter(next);
    if (syncedMap && syncedMap !== mapFilter) {
      setMapFilter(syncedMap);
      setActivityFilter(mapFilterToActivityListFilter(syncedMap));
      setPanel(syncedMap === 'shops' ? 'shops' : 'venues');
      syncExploreUrl({
        filter: syncedMap,
        activityFilter: mapFilterToActivityListFilter(syncedMap),
        panel: syncedMap === 'shops' ? 'shops' : 'venues',
        list: listOpen,
      });
      return;
    }
    syncExploreUrl({ list: listOpen });
  };

  const applyActivityDate = (next: string | null) => {
    const parsed = next ? parseExploreActivityDate(next) : null;
    setActivityDate(parsed);
    clearSelection();
    syncExploreUrl({ activityDate: parsed, list: listOpen });
  };

  const showListPanel = listOpen;
  const sidebarPanel: ExplorePanel = isDesktop
    ? panel === 'venues'
      ? 'venues'
      : mapFilterToPanel(mapFilter)
    : panel;

  const contextualMapFilters = useMemo(() => {
    const tab = isDesktop
      ? desktopBrowseTab
      : panel === 'venues'
        ? 'venues'
        : 'activities';
    const allowed = MAP_FILTERS_BY_BROWSE_TAB[tab];
    return MAP_FILTER_PILLS.filter((pill) => allowed.includes(pill.key));
  }, [isDesktop, desktopBrowseTab, panel]);

  const desktopFilterKeys = useMemo(
    () => contextualMapFilters.map((pill) => pill.key),
    [contextualMapFilters]
  );

  const browseFilterKeys = useMemo((): MapFilterKey[] => {
    if (isDesktop) return desktopFilterKeys;
    const tab = panel === 'venues' ? 'venues' : 'activities';
    return [...MAP_FILTERS_BY_BROWSE_TAB[tab]];
  }, [isDesktop, desktopFilterKeys, panel]);

  const applyVenueRegions = (next: string[]) => {
    setVenueRegions(next);
    clearSelection();
    syncExploreUrl({ venueRegions: next, list: listOpen });
  };

  const placesMode = isDesktop ? desktopBrowseTab === 'venues' : panel === 'venues';

  return {
    mapFilter,
    setMapFilter,
    activityFilter,
    setActivityFilter,
    panel,
    listOpen,
    setListOpen,
    query,
    setQuery,
    venueFilter,
    venueRegions,
    desktopBrowseTab,
    searchExpanded,
    setSearchExpanded,
    activityDate,
    applyActivityDate,
    syncExploreUrl,
    applyMapFilter,
    applyDesktopBrowseTab,
    applyActivityFilter,
    applyPanel,
    applyVenueFilter,
    openBrowse,
    closeListPanel,
    showListPanel,
    sidebarPanel,
    desktopFilterKeys,
    browseFilterKeys,
    placesMode,
    applyVenueRegions,
  };
};
