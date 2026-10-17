import { Router } from 'express';

/**
 * @deprecated People network reads moved to `registerMemberDiscoveryRoutes` (`/me/member-discovery/network*`).
 * Kept so importers do not break; no longer mounted on `apiRouter`.
 */
export const socialGraphRouter = Router();
