import type { Router } from 'express';
import { registerAccountLifecycleRoutes } from './registerAccountLifecycleRoutes.js';
import { registerExploreAvailabilityRoutes } from './registerExploreAvailabilityRoutes.js';
import { registerPublicActivityRoutes } from './registerPublicActivityRoutes.js';
import { registerPublicAlertsAndReferralRoutes } from './registerPublicAlertsAndReferralRoutes.js';
import { registerPublicAreaRoutes } from './registerPublicAreaRoutes.js';
import { registerPublicFacilityRoutes } from './registerPublicFacilityRoutes.js';
import { registerPublicMemberRoutes } from './registerPublicMemberRoutes.js';
import { registerPublicPlaceRoutes } from './registerPublicPlaceRoutes.js';
import { registerPublicTenantRoutes } from './registerPublicTenantRoutes.js';
import { registerReviewRoutes } from './registerReviewRoutes.js';
import { registerPublicWeatherRoutes } from './registerPublicWeatherRoutes.js';
import { registerPublicVitalsRoutes } from './registerPublicVitalsRoutes.js';
import { registerExploreCommunityRoutes } from './registerExploreCommunityRoutes.js';
import { registerDiscoverRecommendationsRoutes } from './registerDiscoverRecommendationsRoutes.js';

/** Guest + signed-out catalog reads, auth lifecycle, public reviews (before `requireAuth`). */
export const composeUserPublicRoutes = (userRouter: Router): void => {
  registerPublicPlaceRoutes(userRouter);
  registerPublicWeatherRoutes(userRouter);
  registerPublicVitalsRoutes(userRouter);
  registerPublicAlertsAndReferralRoutes(userRouter);
  registerPublicFacilityRoutes(userRouter);
  registerPublicAreaRoutes(userRouter);
  registerExploreAvailabilityRoutes(userRouter);
  registerExploreCommunityRoutes(userRouter);
  registerDiscoverRecommendationsRoutes(userRouter);
  registerPublicTenantRoutes(userRouter);
  registerPublicActivityRoutes(userRouter);
  registerAccountLifecycleRoutes(userRouter);
  registerPublicMemberRoutes(userRouter);
  registerReviewRoutes(userRouter);
};
