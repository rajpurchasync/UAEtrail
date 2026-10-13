import { Router } from 'express';
import { registerSocialReviewRoutes } from './social/registerSocialReviewRoutes.js';

export const socialRouter = Router();

registerSocialReviewRoutes(socialRouter);
