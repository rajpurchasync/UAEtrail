import type { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  acceptMyGroupInvite,
  createMyGroupKidMember,
  createMySocialGroup,
  deleteMySocialGroup,
  inviteToMyGroup,
  markMyGroupWallRead,
  patchMyGroupMember,
  postToMyGroupWall,
  removeMyGroupMember,
  toggleMyGroupWallReaction,
  updateMyGroupChatSettings,
  updateMyGroupKidMember,
} from '../../services/social-groups-me-commands.js';
import {
  listMyGroupWallMessages,
  listMyGroupsWithChatPreview,
  loadMyGroupDetail,
} from '../../services/social-groups-me-read.js';
import {
  acceptInviteSchema,
  createGroupSchema,
  createKidSchema,
  patchKidSchema,
  createWallPostSchema,
  groupIdParamSchema,
  groupInviteSchema,
  groupMembershipIdParamSchema,
  groupMembershipPatchSchema,
  groupSettingsPatchSchema,
  groupWallListQuerySchema,
  groupWallMessageIdParamSchema,
  groupWallReactionSchema,
} from './schemas.js';

export const registerGroupRoutes = (router: Router): void => {
  router.get('/me/groups', async (req, res, next) => {
    try {
      const data = await listMyGroupsWithChatPreview(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post('/me/groups', validate({ body: createGroupSchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof createGroupSchema>;
      const group = await createMySocialGroup(req.auth!.userId, body);
      res.status(201).json({ data: group });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/me/groups/:groupId', validate({ params: groupIdParamSchema }), async (req, res, next) => {
    try {
      const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
      const data = await deleteMySocialGroup(groupId, req.auth!.userId);
      res.json({ message: 'Group permanently deleted.', data });
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    '/me/groups/:groupId',
    validate({ params: groupIdParamSchema, body: groupSettingsPatchSchema }),
    async (req, res, next) => {
      try {
        const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
        const body = req.body as z.infer<typeof groupSettingsPatchSchema>;
        const data = await updateMyGroupChatSettings(groupId, req.auth!.userId, body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/groups/:groupId', validate({ params: groupIdParamSchema }), async (req, res, next) => {
    try {
      const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
      const data = await loadMyGroupDetail(groupId, req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/me/groups/:groupId/invites',
    validate({ params: groupIdParamSchema, body: groupInviteSchema }),
    async (req, res, next) => {
      try {
        const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
        const body = req.body as z.infer<typeof groupInviteSchema>;
        const { invite, inviteLink } = await inviteToMyGroup(groupId, req.auth!.userId, body);
        res.status(201).json({ data: invite, inviteLink });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post('/me/group-invites/accept', validate({ body: acceptInviteSchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof acceptInviteSchema>;
      const data = await acceptMyGroupInvite(req.auth!.userId, body);
      res.json({ message: 'Invite accepted.', data });
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    '/me/groups/:groupId/members/:membershipId',
    validate({ params: groupMembershipIdParamSchema, body: groupMembershipPatchSchema }),
    async (req, res, next) => {
      try {
        const { groupId, membershipId } = req.params as z.infer<typeof groupMembershipIdParamSchema>;
        const body = req.body as z.infer<typeof groupMembershipPatchSchema>;
        const data = await patchMyGroupMember(groupId, membershipId, req.auth!.userId, body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/me/groups/:groupId/members/:membershipId',
    validate({ params: groupMembershipIdParamSchema }),
    async (req, res, next) => {
      try {
        const { groupId, membershipId } = req.params as z.infer<typeof groupMembershipIdParamSchema>;
        const data = await removeMyGroupMember(groupId, membershipId, req.auth!.userId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/groups/:groupId/kids',
    validate({ params: groupIdParamSchema, body: createKidSchema }),
    async (req, res, next) => {
      try {
        const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
        const body = req.body as z.infer<typeof createKidSchema>;
        const data = await createMyGroupKidMember(groupId, req.auth!.userId, body);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.patch(
    '/me/groups/:groupId/kids/:membershipId',
    validate({ params: groupMembershipIdParamSchema, body: patchKidSchema }),
    async (req, res, next) => {
      try {
        const { groupId, membershipId } = req.params as z.infer<typeof groupMembershipIdParamSchema>;
        const body = req.body as z.infer<typeof patchKidSchema>;
        const data = await updateMyGroupKidMember(groupId, membershipId, req.auth!.userId, body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/me/groups/:groupId/wall',
    validate({ params: groupIdParamSchema, query: groupWallListQuerySchema }),
    async (req, res, next) => {
      try {
        const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
        const query = req.query as z.infer<typeof groupWallListQuerySchema>;
        const { messages, hasMoreOlder } = await listMyGroupWallMessages(groupId, req.auth!.userId, query);
        res.json({ data: messages, meta: { hasMoreOlder } });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post('/me/groups/:groupId/wall/read', validate({ params: groupIdParamSchema }), async (req, res, next) => {
    try {
      const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
      const data = await markMyGroupWallRead(groupId, req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/me/groups/:groupId/wall/:messageId/reactions',
    validate({ params: groupWallMessageIdParamSchema, body: groupWallReactionSchema }),
    async (req, res, next) => {
      try {
        const { groupId, messageId } = req.params as z.infer<typeof groupWallMessageIdParamSchema>;
        const body = req.body as z.infer<typeof groupWallReactionSchema>;
        const data = await toggleMyGroupWallReaction(groupId, messageId, req.auth!.userId, body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/groups/:groupId/wall',
    validate({ params: groupIdParamSchema, body: createWallPostSchema }),
    async (req, res, next) => {
      try {
        const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
        const body = req.body as z.infer<typeof createWallPostSchema>;
        const data = await postToMyGroupWall(groupId, req.auth!.userId, body);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
