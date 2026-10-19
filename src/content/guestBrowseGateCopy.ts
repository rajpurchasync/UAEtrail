import {
  GUEST_GATE_OOPS_TITLE,
  guestJoinSheetBody,
  guestJoinSheetHeadline,
  type GuestJoinCopyInput,
} from './guestJoinCopy';

/** Where a guest hit a members-only surface. */
export type GuestBrowseGateIntent =
  | 'explore-browse'
  | 'explore-social'
  | 'explore-people-browse'
  | 'peek-details'
  | 'join-activity'
  | 'member-profile';

type GateCopy = { title: string; body: string };

const GATE_COPY: Record<Exclude<GuestBrowseGateIntent, 'join-activity'>, GateCopy> = {
  'explore-browse': {
    title: GUEST_GATE_OOPS_TITLE,
    body:
      'Join the community today to search the list, use filters, and open full details on every plan near you.',
  },
  'explore-social': {
    title: GUEST_GATE_OOPS_TITLE,
    body: 'Sign in to see who’s going, people you follow, and find a crew for your next outing.',
  },
  'explore-people-browse': {
    title: GUEST_GATE_OOPS_TITLE,
    body: 'Sign in to see who’s going, people you follow, and find a crew for your next outing.',
  },
  'peek-details': {
    title: GUEST_GATE_OOPS_TITLE,
    body:
      'Join the community today to meet hosts, say you’re going, save places you love, and message your crew before you head outside.',
  },
  'member-profile': {
    title: GUEST_GATE_OOPS_TITLE,
    body: 'Sign in to view member profiles and connect with people on upcoming outings.',
  },
};

export const guestBrowseGateCopy = (
  intent: GuestBrowseGateIntent,
  joinInput?: GuestJoinCopyInput
): GateCopy => {
  if (intent === 'join-activity' && joinInput) {
    return {
      title: guestJoinSheetHeadline(joinInput),
      body: guestJoinSheetBody(joinInput),
    };
  }
  if (intent === 'join-activity') {
    return GATE_COPY['peek-details'];
  }
  return GATE_COPY[intent];
};
