export type ActivityManageSubview = 'overview' | 'participants' | 'invite' | 'rideshare';

/** Deep links may still use `checkin` — maps to participants roster. */
export type ActivityManageInitialView = ActivityManageSubview | 'checkin';

export const normalizeActivityManageView = (
  view: ActivityManageInitialView
): ActivityManageSubview => (view === 'checkin' ? 'participants' : view);

export const activityManageSubviewTitle = (
  view: ActivityManageSubview,
  activityTitle: string
): string => {
  switch (view) {
    case 'participants':
      return 'View participants';
    case 'invite':
      return 'Invite crew';
    case 'rideshare':
      return 'Rideshare';
    default:
      return activityTitle;
  }
};

/** @deprecated Use {@link activityManageSubviewTitle}. */
export const hostActivityManageSubviewTitle = activityManageSubviewTitle;
