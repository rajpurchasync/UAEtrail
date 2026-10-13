import { useMemo } from 'react';
import type { ExploreBrowsePanelProps } from '../ui/ExploreBrowsePanel';
import type { ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import type { useExploreBrowseUrlState } from '../ui/useExploreBrowseUrlState';
import type { useExplorePublishedAreas } from '../useExplorePublishedAreas';

type Browse = ReturnType<typeof useExploreBrowseUrlState>;

export type ExploreBrowsePanelShared = Omit<
  ExploreBrowsePanelProps,
  'listItems' | 'mapPool' | 'onClose' | 'closePanelAriaLabel' | 'closeButtonVariant' | 'mobileSheetChrome'
>;

/** Shared props for desktop/mobile browse panels (R2 shell). */
export const useExploreBrowsePanelShared = (input: {
  isDesktop: boolean;
  mapLoading: boolean;
  myTripsMode: boolean;
  shopListSections: ExploreBrowsePanelShared['shopListSections'];
  browse: Browse;
  publishedAreas: ReturnType<typeof useExplorePublishedAreas>;
  onPickArea: (slug: string) => void;
  onOpenItem: (item: ExploreBrowsePanelProps['listItems'][number]) => void;
  searchScopeCounts: ExploreBrowsePanelShared['searchScopeCounts'];
  onSearchScopePick: (scope?: ExploreSearchScopeKey | null) => void;
  searchFocusNonce: number;
  buddyUserIds: Set<string> | undefined;
}): ExploreBrowsePanelShared =>
  useMemo(
    (): ExploreBrowsePanelShared => ({
      isDesktop: input.isDesktop,
      loading: input.mapLoading,
      myTripsMode: input.myTripsMode,
      shopListSections: input.shopListSections,
      desktopBrowseTab: input.browse.desktopBrowseTab,
      mapFilter: input.browse.mapFilter,
      browseFilterKeys: input.browse.browseFilterKeys,
      placesMode: input.browse.placesMode,
      onMapFilterChange: input.browse.applyMapFilter,
      activityDatePreset: input.browse.activityDatePreset,
      onActivityDatePresetChange: input.browse.applyActivityDatePreset,
      activityModeFilter: input.browse.activityModeFilter,
      onActivityModeFilterChange: input.browse.applyActivityModeFilter,
      publishedAreas: input.publishedAreas,
      onPickArea: input.onPickArea,
      venueRegions: input.browse.venueRegions,
      onVenueRegionsChange: input.browse.applyVenueRegions,
      onDesktopBrowseTabChange: input.browse.applyDesktopBrowseTab,
      panel: input.browse.panel,
      sidebarPanel: input.browse.sidebarPanel,
      onPanelChange: input.browse.applyPanel,
      buddySubtype: input.browse.buddySubtype,
      onBuddySubtypeChange: input.browse.applyBuddySubtype,
      outingTopic: input.browse.outingTopic,
      onOutingTopicChange: input.browse.applyOutingTopic,
      query: input.browse.query,
      onQueryChange: input.browse.setQuery,
      onQuerySync: () => input.browse.syncExploreUrl({ q: input.browse.query }),
      onClearQuery: () => {
        input.browse.setQuery('');
        input.browse.syncExploreUrl({ q: '' });
      },
      onOpenItem: input.onOpenItem,
      searchScopeCounts: input.searchScopeCounts,
      onSearchScopePick: input.onSearchScopePick,
      searchFocusNonce: input.searchFocusNonce,
      buddyUserIds: input.buddyUserIds,
    }),
    [
      input.isDesktop,
      input.mapLoading,
      input.myTripsMode,
      input.shopListSections,
      input.browse,
      input.publishedAreas,
      input.onPickArea,
      input.onOpenItem,
      input.searchScopeCounts,
      input.onSearchScopePick,
      input.searchFocusNonce,
      input.buddyUserIds,
    ]
  );
