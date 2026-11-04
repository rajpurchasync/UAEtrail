import { EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES } from '../explore/exploreBrowseTaxonomy';
import {
  GUEST_GATE_OOPS_TITLE,
  guestJoinSheetBody,
  guestJoinSheetHeadline,
  type GuestJoinCopyInput,
} from './guestJoinCopy';

/** Where a guest hit a members-only surface. */
export type GuestBrowseGateIntent =
  | 'plan-hub'
  | 'explore-social'
  | 'explore-people-browse'
  | 'peek-details'
  | 'preview-limit'
  | 'join-activity'
  | 'member-profile';

type GateCopy = { title: string; body: string };

const GATE_COPY: Record<Exclude<GuestBrowseGateIntent, 'join-activity'>, GateCopy> = {
  'plan-hub': {
    title: GUEST_GATE_OOPS_TITLE,
    body: 'Sign in to see what is next on your calendar, saved places, and outdoor goals.',
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
  'preview-limit': {
    title: 'Preview limit reached',
    body: `You’ve viewed ${EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES} plans on the map this visit. Join free or log in to open more outings and places, and to search the full catalog.`,
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
