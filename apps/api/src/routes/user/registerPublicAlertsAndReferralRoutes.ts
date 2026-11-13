import type { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { referralClickLimiter, viewLimiter } from '../../middleware/rate-limit-instances.js';
import { validate } from '../../middleware/validate.js';
import { listActivePlatformAlertsForContext } from '../../services/platform-alerts-read.js';
import { recordReferralClick } from '../../services/referral-click-write.js';

const activeAlertsQuerySchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
  radiusKm: z.coerce.number().gte(0.5).lte(500).optional().default(120),
  region: z.string().min(1).max(120).optional(),
});

const referralClickBodySchema = z.object({
  entityKind: z.literal('facility'),
  entityId: z.string().min(1).max(120),
  destinationUrl: z.string().url().max(2048),
  source: z.string().max(64).optional(),
});

/**
 * Public detail-surface support: active platform alerts (read) + partner referral click intake (write).
 * Admin CRUD: `registerAdminAlertRoutes` (`GET/POST /admin/alerts`, expire).
 */
export const registerPublicAlertsAndReferralRoutes = (router: Router): void => {
  router.get(
    '/alerts/active',
    optionalAuth,
    viewLimiter,
    validate({ query: activeAlertsQuerySchema }),
    async (req, res, next) => {
      try {
        const q = req.query as unknown as z.infer<typeof activeAlertsQuerySchema>;
        const data = await listActivePlatformAlertsForContext({
          lat: q.lat,
          lng: q.lng,
          radiusKm: q.radiusKm,
          region: q.region ?? null,
        });
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/referrals/click',
    optionalAuth,
    referralClickLimiter,
    validate({ body: referralClickBodySchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof referralClickBodySchema>;
        await recordReferralClick({
          entityKind: body.entityKind,
          entityId: body.entityId,
          destinationUrl: body.destinationUrl,
          source: body.source?.trim() || 'partner_link',
          viewerUserId: req.auth?.userId ?? null,
        });
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );
};
