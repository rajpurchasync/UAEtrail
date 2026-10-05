export type HostActivityManageSubview = 'overview' | 'participants' | 'invite' | 'rideshare';

/** Deep links may still use `checkin` — maps to participants roster. */
export type HostActivityManageInitialView = HostActivityManageSubview | 'checkin';

export const normalizeHostActivityManageView = (
  view: HostActivityManageInitialView
): HostActivityManageSubview => (view === 'checkin' ? 'participants' : view);

export const hostActivityManageSubviewTitle = (
  view: HostActivityManageSubview,
  activityTitle: string
): string => {
  switch (view) {
    case 'participants':
      return 'Participants';
    case 'invite':
      return 'Invite crew';
    case 'rideshare':
      return 'Rideshare';
    default:
      return activityTitle;
  }
};
