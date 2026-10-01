import type { MemberGoalActivityFilter } from '@uaetrail/shared-types';

export const goalActivityLabel = (filter: MemberGoalActivityFilter, plural = true): string => {
  if (filter === 'hiking') return plural ? 'hikes' : 'hike';
  if (filter === 'camping') return plural ? 'camps' : 'camp';
  return plural ? 'outings' : 'outing';
};

export const goalActivityLabelTitle = (filter: MemberGoalActivityFilter): string => {
  if (filter === 'hiking') return 'Hiking';
  if (filter === 'camping') return 'Camping';
  return 'Any outing';
};

export const GOAL_ACTIVITY_SEGMENTS: { value: MemberGoalActivityFilter; label: string }[] = [
  { value: 'hiking', label: 'Hiking' },
  { value: 'camping', label: 'Camping' },
  { value: 'all_outings', label: 'Any outing' },
];

/** @deprecated Use GOAL_ACTIVITY_SEGMENTS */
export const GOAL_ACTIVITY_OPTIONS = GOAL_ACTIVITY_SEGMENTS.map((s) => ({
  value: s.value,
  label: s.label === 'Any outing' ? 'Other activities' : s.label,
}));

export const GOAL_QUICK_TARGETS = [4, 6, 8, 10, 12] as const;

export const todayIsoDateLocal = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const defaultGoalTargetDate = (): string => {
  const y = new Date().getFullYear();
  return `${y}-12-31`;
};

export const maxGoalTargetDate = (): string => {
  const y = new Date().getFullYear() + 2;
  return `${y}-12-31`;
};

export const formatGoalDeadlineLabel = (targetDate: string): string => {
  const [y, m, d] = targetDate.split('-').map((part) => parseInt(part, 10));
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatGoalHeadline = (
  filter: MemberGoalActivityFilter,
  targetCount: number,
  targetDate: string
): string => `${targetCount} ${goalActivityLabel(filter)} by ${formatGoalDeadlineLabel(targetDate)}`;

export type GoalPreset = {
  activityFilter: MemberGoalActivityFilter;
  targetCount: number;
  targetDate: string;
  title: string;
  subtitle: string;
};

export const buildGoalPresets = (targetDate: string): GoalPreset[] => {
  const by = formatGoalDeadlineLabel(targetDate);
  return [
    {
      activityFilter: 'hiking',
      targetCount: 8,
      targetDate,
      title: `8 hikes by ${by}`,
      subtitle: 'A steady rhythm until your deadline',
    },
    {
      activityFilter: 'camping',
      targetCount: 6,
      targetDate,
      title: `6 camps by ${by}`,
      subtitle: 'More nights under the stars',
    },
    {
      activityFilter: 'all_outings',
      targetCount: 12,
      targetDate,
      title: `12 outings by ${by}`,
      subtitle: 'Hikes, camps, and whatever gets you outside',
    },
  ];
};
