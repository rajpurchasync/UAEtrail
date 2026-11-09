import type { Router } from 'express';
import { registerActivityGuideRoutes } from './registerActivityGuideRoutes.js';
import { registerActivityJoinInviteRoutes } from './registerActivityJoinInviteRoutes.js';
import { registerBuddyRoutes } from './registerBuddyRoutes.js';
import { registerEntityFollowRoutes } from './registerEntityFollowRoutes.js';
import { registerFollowRoutes } from './registerFollowRoutes.js';
import { registerGroupRoutes } from './registerGroupRoutes.js';
import { registerHostApplicationRoutes } from './registerHostApplicationRoutes.js';
import {
  registerMeAccountSessionRoutes,
  registerMeActivityParticipationRoutes,
} from './registerMeEngagementRoutes.js';
import { registerMeSeekingPostRoutes } from './registerMeParticipantIntentRoutes.js';
import { registerMeBadgesRoutes } from './registerMeBadgesRoutes.js';
import { registerMeGoalsRoutes } from './registerMeGoalsRoutes.js';
import { registerMeVehiclesRoutes } from './registerMeVehiclesRoutes.js';
import { registerMeAvailabilityRoutes } from './registerMeAvailabilityRoutes.js';
import { registerMeMapPinsRoutes } from './registerMeMapPinsRoutes.js';
import { registerMeDiscoverOverlayRoutes } from './registerMeDiscoverOverlayRoutes.js';
import { registerMeWishlistRoutes } from './registerMeWishlistRoutes.js';
import { registerMeCoordinationAttentionRoutes } from './registerMeCoordinationAttentionRoutes.js';
import { registerMemberStatusRoutes } from './registerMemberStatusRoutes.js';
import { registerMeVerificationRoutes } from './registerMeVerificationRoutes.js';
import { registerMeSubmittedPlaceRoutes } from './registerMeSubmittedPlaceRoutes.js';
import { registerMeSubmissionRoutes } from './registerMeSubmissionRoutes.js';
import { registerMeFacilityRoutes } from './registerMeFacilityRoutes.js';
import { registerMemberDiscoveryRoutes } from './registerMemberDiscoveryRoutes.js';
import { registerNotificationRoutes } from './registerNotificationRoutes.js';
import { registerProfileRoutes } from './registerProfileRoutes.js';
import { registerMeParticipantHubRoutes } from './registerMeParticipantHubRoutes.js';

/** Verified-member routes (`requireAuth` + `requireVerifiedEmail` applied on the shell). */
export const composeUserMemberRoutes = (userRouter: Router): void => {
  registerMeActivityParticipationRoutes(userRouter);
  registerActivityJoinInviteRoutes(userRouter);
  registerActivityGuideRoutes(userRouter);

  registerProfileRoutes(userRouter);
  registerMeParticipantHubRoutes(userRouter);
  registerMemberDiscoveryRoutes(userRouter);
  registerNotificationRoutes(userRouter);
  registerBuddyRoutes(userRouter);
  registerFollowRoutes(userRouter);
  registerEntityFollowRoutes(userRouter);
  registerGroupRoutes(userRouter);
  registerHostApplicationRoutes(userRouter);

  registerMemberStatusRoutes(userRouter);
  registerMeVerificationRoutes(userRouter);
  registerMeAccountSessionRoutes(userRouter);
  registerMeSubmittedPlaceRoutes(userRouter);
  registerMeSubmissionRoutes(userRouter);
  registerMeFacilityRoutes(userRouter);
  registerMeSeekingPostRoutes(userRouter);
  registerMeBadgesRoutes(userRouter);
  registerMeGoalsRoutes(userRouter);
  registerMeVehiclesRoutes(userRouter);
  registerMeAvailabilityRoutes(userRouter);
  registerMeMapPinsRoutes(userRouter);
  registerMeDiscoverOverlayRoutes(userRouter);
  registerMeWishlistRoutes(userRouter);
  registerMeCoordinationAttentionRoutes(userRouter);
};
