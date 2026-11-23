import { normalizePeopleSegment, type SocialPeopleSegmentWire } from '@uaetrail/shared-types';
import type { Router } from 'express';
import { z } from 'zod';
import { requireVerifiedEmail } from '../../middleware/auth.js';
import { paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import {
  loadMemberPeopleNetworkPreview,
  loadMemberPeopleNetworkRoster,
} from '../../services/member-people-engagement.js';
import { searchUsersForNewConversation } from '../../services/me-account-session-read.js';
import {
  listBrowsableMembersForViewer,
  loadMyProfileViewStats,
} from '../../services/member-discovery-me-read.js';
import { resolveMemberDiscoveryQuota } from '../../services/member-discovery-quota.js';
import { loadDiscoverCrewFeed } from '../../services/discover-crew-feed.js';
import { resolveMemberStatus } from '../../services/member-status.js';
import { userSearchSchema } from './schemas.js';

const memberBrowseQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(80).optional(),
});

const memberDiscoveryRosterQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(80).optional(),
  date: z.string().trim().max(32).optional(),
  omitDirectory: z.literal('1').optional(),
});

const peopleNetworkSegmentSchema = z.object({
  segment: z.enum(['all', 'buddies', 'followed', 'friends']).default('all'),
});

/** Member discovery — roster, directory, network, quota, search (MIG-ROUTING-CANON-P3). */
export const registerMemberDiscoveryRoutes = (router: Router): void => {
  router.get(
    '/me/member-discovery/roster',
    validate({ query: memberDiscoveryRosterQuerySchema }),
    async (req, res, next) => {
      try {
        const pg = memberDiscoveryRosterQuerySchema.parse(req.query);
        const { data, quota } = await loadDiscoverCrewFeed({
          viewerUserId: req.auth!.userId,
          userRole: req.auth!.role,
          datePresetRaw: pg.date,
          search: pg.q,
          skip: (pg.page - 1) * pg.pageSize,
          take: pg.pageSize,
          omitDirectory: pg.omitDirectory === '1',
        });
        res.setHeader('Deprecation', 'true');
        res.setHeader('Link', '</api/discover/crew>; rel="successor-version"');
        res.json({
          data: {
            friendsGoing: data.friendsGoing,
            hostsGoing: data.hostsGoing,
            availabilityOnMap: data.availabilityOnMap,
            followed: data.followed,
            directory: data.directory,
          },
          meta: { page: pg.page, pageSize: pg.pageSize, quota },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/member-discovery/quota', async (req, res, next) => {
    try {
      const viewerUserId = req.auth!.userId;
      const hostStatus = await resolveMemberStatus(viewerUserId);
      const data = await resolveMemberDiscoveryQuota(viewerUserId, hostStatus);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/me/member-discovery/browse',
    validate({ query: memberBrowseQuerySchema }),
    async (req, res, next) => {
      try {
        const pg = memberBrowseQuerySchema.parse(req.query);
        const viewerUserId = req.auth!.userId;
        const data = await listBrowsableMembersForViewer({
          viewerUserId,
          search: pg.q,
          skip: (pg.page - 1) * pg.pageSize,
          take: pg.pageSize,
        });

        res.json({ data, meta: { page: pg.page, pageSize: pg.pageSize } });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/me/member-discovery/search',
    validate({ query: userSearchSchema }),
    async (req, res, next) => {
      try {
        const { q } = req.query as z.infer<typeof userSearchSchema>;
        const data = await searchUsersForNewConversation({
          viewerUserId: req.auth!.userId,
          query: q,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/me/member-discovery/network/preview',
    requireVerifiedEmail,
    async (req, res, next) => {
      try {
        const data = await loadMemberPeopleNetworkPreview({
          viewerUserId: req.auth!.userId,
          userRole: req.auth!.role,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/me/member-discovery/network',
    requireVerifiedEmail,
    validate({ query: peopleNetworkSegmentSchema }),
    async (req, res, next) => {
      try {
        const { segment } = req.query as unknown as { segment: SocialPeopleSegmentWire };
        const data = await loadMemberPeopleNetworkRoster({
          viewerUserId: req.auth!.userId,
          userRole: req.auth!.role,
          segment: normalizePeopleSegment(segment),
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/profile-view-stats', async (req, res, next) => {
    try {
      const viewerUserId = req.auth!.userId;
      const hostStatus = await resolveMemberStatus(viewerUserId);
      const data = await loadMyProfileViewStats({ viewerUserId, hostStatus });
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
