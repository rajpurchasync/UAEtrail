import type { MemberGoalActivityFilter, MemberMapPinActivityType } from '@uaetrail/shared-types';

export const defaultPinTypeForGoalFilter = (
  filter: MemberGoalActivityFilter
): MemberMapPinActivityType => {
  if (filter === 'camping') return 'camp';
  if (filter === 'hiking') return 'hike';
  return 'hike';
};

export const goalCountModeLabel = (mode: 'join' | 'host'): string =>
  mode === 'host' ? 'Hosting' : 'Joining & logs';

export const goalProgressHint = (mode: 'join' | 'host'): string =>
  mode === 'host'
    ? 'Counts outings you host on UAE Trail — you can host when you’re ready.'
    : 'Counts outings you log here and visited pins on My Map (including check-ins).';
