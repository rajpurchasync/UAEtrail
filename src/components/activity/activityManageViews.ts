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

/** @deprecated Use {@link ActivityManageInitialView}. */
export type ActivityManageInitialView = ActivityManageInitialView;
/** @deprecated Use {@link ActivityManageSubview}. */
export type ActivityManageSubview = ActivityManageSubview;
/** @deprecated Use {@link normalizeActivityManageView}. */
export const normalizeActivityManageView = normalizeActivityManageView;
/** @deprecated Use {@link activityManageSubviewTitle}. */
export const hostActivityManageSubviewTitle = activityManageSubviewTitle;
