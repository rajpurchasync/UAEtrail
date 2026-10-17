import { Router } from 'express';
import { getVapidPublicKey } from '../lib/push.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { registerAccountLifecycleRoutes } from './user/registerAccountLifecycleRoutes.js';
import { registerBuddyRoutes } from './user/registerBuddyRoutes.js';
import { registerFollowRoutes } from './user/registerFollowRoutes.js';
import { registerEntityFollowRoutes } from './user/registerEntityFollowRoutes.js';
import { registerGroupRoutes } from './user/registerGroupRoutes.js';
import { registerHostApplicationRoutes } from './user/registerHostApplicationRoutes.js';
import {
  registerMeAccountSessionRoutes,
  registerMeActivityParticipationRoutes,
} from './user/registerMeEngagementRoutes.js';
import { registerActivityJoinInviteRoutes } from './user/registerActivityJoinInviteRoutes.js';
import { registerMeSeekingPostRoutes } from './user/registerMeParticipantIntentRoutes.js';
import { registerMeBadgesRoutes } from './user/registerMeBadgesRoutes.js';
import { registerMeGoalsRoutes } from './user/registerMeGoalsRoutes.js';
import { registerMeAvailabilityRoutes } from './user/registerMeAvailabilityRoutes.js';
import { registerExploreAvailabilityRoutes } from './user/registerExploreAvailabilityRoutes.js';
import { registerMeMapPinsRoutes } from './user/registerMeMapPinsRoutes.js';
import { registerMeDiscoverOverlayRoutes } from './user/registerMeDiscoverOverlayRoutes.js';
import { registerMeWishlistRoutes } from './user/registerMeWishlistRoutes.js';
import { registerMeCoordinationAttentionRoutes } from './user/registerMeCoordinationAttentionRoutes.js';
import { registerMemberStatusRoutes } from './user/registerMemberStatusRoutes.js';
import { registerMeSubmittedPlaceRoutes } from './user/registerMeSubmittedPlaceRoutes.js';
import { registerMeFacilityRoutes } from './user/registerMeFacilityRoutes.js';
import { registerNotificationRoutes } from './user/registerNotificationRoutes.js';
import { registerProfileRoutes } from './user/registerProfileRoutes.js';
import { registerPublicActivityRoutes } from './user/registerPublicActivityRoutes.js';
import { registerMemberDiscoveryRoutes } from './user/registerMemberDiscoveryRoutes.js';
import { registerPublicMemberRoutes } from './user/registerPublicMemberRoutes.js';
import { registerPublicPlaceRoutes } from './user/registerPublicPlaceRoutes.js';
import { registerPublicFacilityRoutes } from './user/registerPublicFacilityRoutes.js';
import { registerPublicAreaRoutes } from './user/registerPublicAreaRoutes.js';
import { registerPublicTenantRoutes } from './user/registerPublicTenantRoutes.js';
import { registerReviewRoutes } from './user/registerReviewRoutes.js';

export const userRouter = Router();

userRouter.get('/push/vapid-public-key', (_req, res) => {
  const key = getVapidPublicKey();
  res.json({ data: { publicKey: key } });
});

registerPublicPlaceRoutes(userRouter);
registerPublicFacilityRoutes(userRouter);
registerPublicAreaRoutes(userRouter);
registerExploreAvailabilityRoutes(userRouter);
registerPublicTenantRoutes(userRouter);
registerPublicActivityRoutes(userRouter);
registerAccountLifecycleRoutes(userRouter);
registerPublicMemberRoutes(userRouter);
registerReviewRoutes(userRouter);

userRouter.use(requireAuth, requireVerifiedEmail);

registerMeActivityParticipationRoutes(userRouter);
registerActivityJoinInviteRoutes(userRouter);

registerProfileRoutes(userRouter);
registerMemberDiscoveryRoutes(userRouter);
registerNotificationRoutes(userRouter);
registerBuddyRoutes(userRouter);
registerFollowRoutes(userRouter);
registerEntityFollowRoutes(userRouter);
registerGroupRoutes(userRouter);
registerHostApplicationRoutes(userRouter);

registerMemberStatusRoutes(userRouter);
registerMeAccountSessionRoutes(userRouter);
registerMeSubmittedPlaceRoutes(userRouter);
registerMeFacilityRoutes(userRouter);
registerMeSeekingPostRoutes(userRouter);
registerMeBadgesRoutes(userRouter);
registerMeGoalsRoutes(userRouter);
registerMeAvailabilityRoutes(userRouter);
registerMeMapPinsRoutes(userRouter);
registerMeDiscoverOverlayRoutes(userRouter);
registerMeWishlistRoutes(userRouter);
registerMeCoordinationAttentionRoutes(userRouter);
