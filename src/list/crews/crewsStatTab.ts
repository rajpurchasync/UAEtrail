import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';

export type CrewsStatTab = 'buddies' | 'available' | 'everyone';

export const CREWS_STAT_TAB_LABELS: Record<CrewsStatTab, string> = {
  buddies: 'Buddies',
  available: 'Available',
  everyone: 'Everyone',
};

export const crewsStatTabFromSegment = (segment: PeopleBrowseTab): CrewsStatTab | null => {
  if (segment === 'hub') return null;
  if (segment === 'going') return 'buddies';
  if (segment === 'available' || segment === 'looking') return 'available';
  if (segment === 'connect') return 'everyone';
  return null;
};

export const segmentFromCrewsStatTab = (tab: CrewsStatTab): PeopleBrowseTab => {
  if (tab === 'buddies') return 'going';
  if (tab === 'available') return 'available';
  return 'connect';
};

export const crewsShowsGuidesRail = (segment: PeopleBrowseTab): boolean => segment === 'hub';
