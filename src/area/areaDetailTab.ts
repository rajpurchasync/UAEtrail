export const AREA_DETAIL_TAB_QUERY = 'tab';

export const AREA_DETAIL_TABS = ['overview', 'places', 'activities'] as const;
export type AreaDetailTabId = (typeof AREA_DETAIL_TABS)[number];

export const parseAreaDetailTabParam = (value: string | null | undefined): AreaDetailTabId => {
  if (value === 'places' || value === 'activities') return value;
  return 'overview';
};

export const AREA_DETAIL_TAB_LABELS: Record<AreaDetailTabId, string> = {
  overview: 'Overview',
  places: 'Places',
  activities: 'Activities',
};
