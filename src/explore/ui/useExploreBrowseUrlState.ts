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

  const syncExploreUrl = useCallback(
    (next: SyncPatch) => {
      const params = new URLSearchParams(searchParams);
      const filterValue = next.filter ?? mapFilter;
      const activityFilterValue = next.activityFilter ?? activityFilter;
      const panelValue = next.panel ?? panel;
      const listValue = next.list ?? listOpen;
      const queryValue = next.q ?? query;
      const regionValue = next.venueRegions ?? venueRegions;

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
    [mapFilter, activityFilter, panel, listOpen, query, venueRegions, searchParams, setSearchParams]
  );

  useEffect(() => {
    const nextMapFilter = parseMapFilter(searchParams.get('filter'));
    const nextPanel = parseExplorePanel(searchParams.get('panel'));
    setMapFilter(nextMapFilter);
    setActivityFilter(parseActivityListFilter(searchParams.get('activity')));
    setVenueFilter(mapFilterToVenueListFilter(nextMapFilter));
    setPanel(nextPanel);
    setListOpen(parseListOpen(searchParams.get('list'), isDesktop));
    setQuery(searchParams.get('q') ?? '');
    setVenueRegions(parseVenueRegionsParam(searchParams));
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
    const syncedPanel = isDesktop
      ? desktopBrowseTab === 'venues'
        ? 'venues'
        : 'activities'
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
    syncExploreUrl({ panel: next, list: true });
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

  const showListPanel = listOpen;
  const sidebarPanel: ExplorePanel = isDesktop
    ? panel === 'venues'
      ? 'venues'
      : mapFilterToPanel(mapFilter)
    : panel;

  const contextualMapFilters = useMemo(() => {
    if (!isDesktop) return MAP_FILTER_PILLS;
    const allowed = MAP_FILTERS_BY_BROWSE_TAB[desktopBrowseTab];
    return MAP_FILTER_PILLS.filter((pill) => allowed.includes(pill.key));
  }, [isDesktop, desktopBrowseTab]);

  const desktopFilterKeys = useMemo(
    () => contextualMapFilters.map((pill) => pill.key),
    [contextualMapFilters]
  );

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
  };
};
