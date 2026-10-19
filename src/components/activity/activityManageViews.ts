import { ACTIVITY_INVITE_FRIENDS_CTA } from '../../content/activityInviteCopy';
import { ACTIVITY_PARTICIPANTS_SECTION_LABEL } from '../../content/activityParticipantsCopy';

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
      return ACTIVITY_PARTICIPANTS_SECTION_LABEL;
    case 'invite':
      return ACTIVITY_INVITE_FRIENDS_CTA;
    case 'rideshare':
      return 'Rideshare';
    default:
      return activityTitle;
  }
};
