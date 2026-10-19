import {
  hostPublishEntitlementDenial,
  type HostStatusAudienceSnapshot,
  type HostTierFlags,
} from '@uaetrail/shared-types';
import { SIGNUP_PROFILE_WELCOME_PATH } from './signupProfileGate';
import { signInPathForReturn } from './authReturnContext';

export type HostPublishGateInput = {
  viewerUserId: string | null;
  hostStatus: HostStatusAudienceSnapshot | null;
  canPublish: boolean;
};

/** Build gate input from `useMemberStatus` fields (single source with `hostPublishEntitlementDenial`). */
export const memberPublishGateInputFromMemberStatus = (args: {
  viewerUserId: string | null;
  profileComplete: boolean;
  canPublish: boolean;
  isCommunityHost?: boolean;
  hostTiers?: HostTierFlags;
}): HostPublishGateInput => ({
  viewerUserId: args.viewerUserId,
  canPublish: args.canPublish,
  hostStatus:
    args.viewerUserId === null
      ? null
      : {
          profileComplete: args.profileComplete,
          isCommunityHost: args.isCommunityHost ?? false,
          hostTiers:
            args.hostTiers ?? {
              community: false,
              professional: false,
              business: false,
            },
        },
});

/** Redirect when Host / publish is blocked — maps `hostPublishEntitlementDenial` to routes. */
export const memberPublishGateHref = (
  returnTo: string,
  input: HostPublishGateInput
): string => {
  const denial = hostPublishEntitlementDenial(input);
  const safeReturn = returnTo || '/explore';
  const redirect = returnTo ? `?redirect=${encodeURIComponent(returnTo)}` : '';

  if (!denial) {
    return safeReturn;
  }

  switch (denial.gateReason) {
    case 'sign_in':
      return signInPathForReturn(safeReturn);
    case 'profile_required':
      return `${SIGNUP_PROFILE_WELCOME_PATH}${redirect}`;
    case 'upgrade_required':
      return `/profile${redirect}`;
    default:
      return `/profile${redirect}`;
  }
};
