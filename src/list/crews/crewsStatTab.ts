import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';

export type CrewsStatTab = 'friends' | 'available' | 'everyone';

export const CREWS_STAT_TAB_LABELS: Record<CrewsStatTab, string> = {
  friends: 'Friends',
  available: 'Available',
  everyone: 'Everyone',
};

export const crewsStatTabFromSegment = (segment: PeopleBrowseTab): CrewsStatTab | null => {
  if (segment === 'hub') return null;
  if (segment === 'going') return 'friends';
  if (segment === 'available' || segment === 'looking') return 'available';
  if (segment === 'connect') return 'everyone';
  return null;
};

export const segmentFromCrewsStatTab = (tab: CrewsStatTab): PeopleBrowseTab => {
  if (tab === 'friends') return 'going';
  if (tab === 'available') return 'available';
  return 'connect';
};

export const crewsShowsGuidesRail = (segment: PeopleBrowseTab): boolean => segment === 'hub';
