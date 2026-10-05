import { Router } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../../lib/audit.js';
import { ApiError } from '../../lib/api-error.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import { GROUPS_PATH } from '../../lib/member-routes.js';
import { notifyUserAdminAction } from '../../services/admin-notifications.js';
import {
  getSocialGroupAdminDetail,
  listAllSocialGroupsAdmin,
  updateGroupStatus,
} from '../../lib/social-groups-store.js';

const idParamSchema = z.object({ id: z.string().min(1) });

const suspendCommentSchema = z.object({
  comment: z.string().trim().max(500).optional(),
});

const requireSuspendComment = (
  data: { comment?: string },
  isSuspend: boolean,
  ctx: z.RefinementCtx
): void => {
  if (isSuspend && (!data.comment || data.comment.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Comment is required when suspending.',
      path: ['comment'],
    });
  }
};

const groupStatusSchema = suspendCommentSchema
  .extend({
    status: z.enum(['active', 'suspended']),
  })
  .superRefine((data, ctx) => requireSuspendComment(data, data.status === 'suspended', ctx));

const groupListQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  type: z.enum(['family', 'friends']).optional(),
});

/** Platform admin social group list, detail, and suspend/activate (`/admin/groups/*`). */
export const registerAdminGroupRoutes = (adminRouter: Router): void => {
  adminRouter.get('/groups', validate({ query: groupListQuerySchema }), async (req, res, next) => {
    try {
      const query = req.query as unknown as z.infer<typeof groupListQuerySchema>;
      const pg = paginationSchema.parse({ page: query.page, pageSize: query.pageSize });
      const { skip, take } = { skip: (pg.page - 1) * pg.pageSize, take: pg.pageSize };
      const { data, total } = await listAllSocialGroupsAdmin({
        skip,
        take,
        search: query.search,
        type: query.type,
      });

      res.json(
        paginatedResponse(
          data.map((group) => ({
            ...group,
            createdAt: group.createdAt.toISOString(),
            updatedAt: group.updatedAt.toISOString(),
          })),
          total,
          pg
        )
      );
    } catch (error) {
      next(error);
    }
  });

  adminRouter.get('/groups/:id', validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const detail = await getSocialGroupAdminDetail(id);
      if (!detail) {
        throw new ApiError(404, 'group_not_found', 'Group not found.');
      }

      res.json({
        data: {
          group: {
            ...detail.group,
            createdAt: detail.group.createdAt.toISOString(),
            updatedAt: detail.group.updatedAt.toISOString(),
          },
          admin: detail.admin,
          members: detail.members.map((member) => ({
            ...member,
            createdAt: member.createdAt.toISOString(),
          })),
          invites: detail.invites.map((invite) => ({
            ...invite,
            acceptedAt: invite.acceptedAt?.toISOString() ?? null,
            expiresAt: invite.expiresAt.toISOString(),
            createdAt: invite.createdAt.toISOString(),
            updatedAt: invite.updatedAt.toISOString(),
          })),
          stats: detail.stats,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.patch(
    '/groups/:id/status',
    validate({ params: idParamSchema, body: groupStatusSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { status, comment } = req.body as z.infer<typeof groupStatusSchema>;

        const detail = await getSocialGroupAdminDetail(id);
        if (!detail) {
          throw new ApiError(404, 'group_not_found', 'Group not found.');
        }

        const updated = await updateGroupStatus(id, status);
        if (!updated) {
          throw new ApiError(404, 'group_not_found', 'Group not found.');
        }

        await createAuditLog({
          actorId: req.auth!.userId,
          action: `group.${status === 'active' ? 'activate' : 'suspend'}`,
          entityType: 'group',
          entityId: id,
          metadata: comment ? { comment } : undefined,
        });

        if (detail.admin) {
          await notifyUserAdminAction({
            userId: detail.admin.id,
            title: status === 'active' ? 'Group reactivated' : 'Group suspended',
            body:
              status === 'active'
                ? `Your group "${detail.group.name}" is active again.`
                : comment
                  ? `Your group "${detail.group.name}" has been suspended. Reason: ${comment}`
                  : `Your group "${detail.group.name}" has been suspended by an administrator.`,
            reason: comment,
            meta: {
              kind: status === 'active' ? 'group_reactivated' : 'group_suspended',
              groupId: id,
              path: GROUPS_PATH,
            },
          });
        }

        res.json({ message: `Group ${status === 'active' ? 'activated' : 'suspended'}.` });
      } catch (error) {
        next(error);
      }
    }
  );
};
