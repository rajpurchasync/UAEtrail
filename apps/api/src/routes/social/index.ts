import { Router } from 'express';
import { registerSocialPeopleRoutes } from './registerSocialPeopleRoutes.js';

/** Social graph reads — people roster on Explore (`/social/*`). */
export const socialGraphRouter = Router();

registerSocialPeopleRoutes(socialGraphRouter);
