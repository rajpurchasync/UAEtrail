import type { Router } from 'express';
import { registerAccountLifecycleRoutes } from './registerAccountLifecycleRoutes.js';
import { registerExploreAvailabilityRoutes } from './registerExploreAvailabilityRoutes.js';
import { registerPublicActivityRoutes } from './registerPublicActivityRoutes.js';
import { registerPublicAreaRoutes } from './registerPublicAreaRoutes.js';
import { registerPublicFacilityRoutes } from './registerPublicFacilityRoutes.js';
import { registerPublicMemberRoutes } from './registerPublicMemberRoutes.js';
import { registerPublicPlaceRoutes } from './registerPublicPlaceRoutes.js';
import { registerPublicTenantRoutes } from './registerPublicTenantRoutes.js';
import { registerReviewRoutes } from './registerReviewRoutes.js';

/** Guest + signed-out catalog reads, auth lifecycle, public reviews (before `requireAuth`). */
export const composeUserPublicRoutes = (userRouter: Router): void => {
  registerPublicPlaceRoutes(userRouter);
  registerPublicFacilityRoutes(userRouter);
  registerPublicAreaRoutes(userRouter);
  registerExploreAvailabilityRoutes(userRouter);
  registerPublicTenantRoutes(userRouter);
  registerPublicActivityRoutes(userRouter);
  registerAccountLifecycleRoutes(userRouter);
  registerPublicMemberRoutes(userRouter);
  registerReviewRoutes(userRouter);
};
