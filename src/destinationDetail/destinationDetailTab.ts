export const DESTINATION_DETAIL_TAB_QUERY = 'tab';

export const DESTINATION_DETAIL_TABS = ['overview', 'places', 'activities'] as const;
export type DestinationDetailTabId = (typeof DESTINATION_DETAIL_TABS)[number];

export const parseDestinationDetailTabParam = (value: string | null | undefined): DestinationDetailTabId => {
  if (value === 'places' || value === 'activities') return value;
  return 'overview';
};

export const DESTINATION_DETAIL_TAB_LABELS: Record<DestinationDetailTabId, string> = {
  overview: 'Overview',
  places: 'Places',
  activities: 'Activities',
};
