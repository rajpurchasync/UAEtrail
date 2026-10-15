import type { Express } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { findPublishedActivityWithPreviewsById } from '../lib/activities-store.js';
import { buildActivityDto } from '../lib/mappers.js';
import { buildActivityRedactedDetail } from '../lib/activity-redacted-detail.js';
import {
  buildActivityOgDescription,
  buildActivityOgHtml,
  buildPrivateActivityOgHtml,
} from '../lib/activity-og-page.js';
import { buildActivitiesSitemapXml } from '../lib/activity-sitemap.js';
import { buildActivityViewerAccess } from '../services/activity-viewer-access.js';

const activityIdParamSchema = z.object({
  id: z.string().min(1),
});

export const registerOgRoutes = (app: Express): void => {
  app.get('/og/activity/:id', async (req, res, next) => {
    try {
      const parsed = activityIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(404).type('text/html').send('Not found');
        return;
      }

      const { id } = parsed.data;
      const event = await findPublishedActivityWithPreviewsById(id);
      if (!event) {
        res.status(404).type('text/html').send('Not found');
        return;
      }

      const access = await buildActivityViewerAccess({
        viewerUserId: null,
        activity: {
          id: event.id,
          tenantId: event.tenantId,
          hostId: event.hostId,
          createdById: event.createdById,
          joinMode: event.joinMode,
          requirements: event.requirements,
        },
      });

      const siteOrigin = env.APP_BASE_URL.replace(/\/$/, '');

      if (
        access.joinMode === 'private' ||
        access.level === 'denied' ||
        access.gateReason === 'invite_only'
      ) {
        res.status(200).type('text/html; charset=utf-8').send(buildPrivateActivityOgHtml(siteOrigin));
        return;
      }

      const activity =
        access.exposure === 'full' ? buildActivityDto(event) : buildActivityRedactedDetail(event);

      res
        .status(200)
        .type('text/html; charset=utf-8')
        .send(
          buildActivityOgHtml({
            siteOrigin,
            activity,
            description: buildActivityOgDescription(activity),
            canonicalPath: `/activity/${activity.id}`,
            indexable: true,
          })
        );
    } catch (error) {
      next(error);
    }
  });

  app.get('/sitemap-activities.xml', async (_req, res, next) => {
    try {
      const siteOrigin = env.APP_BASE_URL.replace(/\/$/, '');
      const xml = await buildActivitiesSitemapXml(siteOrigin);
      res.status(200).type('application/xml; charset=utf-8').send(xml);
    } catch (error) {
      next(error);
    }
  });
};
