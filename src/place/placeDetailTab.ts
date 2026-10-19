export const PLACE_DETAIL_TAB_QUERY = 'tab';

export const PLACE_DETAIL_TABS = ['overview', 'facts', 'transport', 'guide'] as const;
export type PlaceDetailTabId = (typeof PLACE_DETAIL_TABS)[number];

/** @deprecated Use PlaceDetailTabId — legacy name in PlaceDetailTabs exports */
export type LocationTab = PlaceDetailTabId;

const INBOUND_TAB_ALIASES: Record<string, PlaceDetailTabId> = {
  location: 'transport',
};

export const parsePlaceDetailTabParam = (value: string | null | undefined): PlaceDetailTabId => {
  if (!value) return 'overview';
  const normalized = INBOUND_TAB_ALIASES[value] ?? value;
  if (normalized === 'facts' || normalized === 'transport' || normalized === 'guide') return normalized;
  return 'overview';
};

export const PLACE_DETAIL_TAB_LABELS: Record<PlaceDetailTabId, string> = {
  overview: 'Overview',
  facts: 'Facts',
  transport: 'Transport',
  guide: 'Guide',
};
