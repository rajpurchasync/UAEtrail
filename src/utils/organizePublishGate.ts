import {
  organizeEntitlementDenial,
  type HostStatusAudienceSnapshot,
  type HostTierFlags,
} from '@uaetrail/shared-types';
import { SIGNUP_PROFILE_WELCOME_PATH } from './signupProfileGate';
import { signInPathForReturn } from './authReturnContext';

export type OrganizePublishGateInput = {
  viewerUserId: string | null;
  hostStatus: HostStatusAudienceSnapshot | null;
  canPublish: boolean;
};

/** Build gate input from `useHostStatus` fields (single source with `organizeEntitlementDenial`). */
export const organizePublishGateInputFromHostGate = (args: {
  viewerUserId: string | null;
  signupProfileComplete: boolean;
  canPublish: boolean;
  isCommunityHost?: boolean;
  hostTiers?: HostTierFlags;
}): OrganizePublishGateInput => ({
  viewerUserId: args.viewerUserId,
  canPublish: args.canPublish,
  hostStatus:
    args.viewerUserId === null
      ? null
      : {
          signupProfileComplete: args.signupProfileComplete,
          isCommunityHost: args.isCommunityHost ?? false,
          hostTiers:
            args.hostTiers ?? {
              community: false,
              professional: false,
              business: false,
            },
        },
});

/** Redirect when Organize / publish is blocked — maps `organizeEntitlementDenial` to routes. */
export const organizePublishGateHref = (
  returnTo: string,
  input: OrganizePublishGateInput
): string => {
  const denial = organizeEntitlementDenial(input);
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
