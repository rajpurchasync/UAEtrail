import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { requirePlatformMasterAdmin } from '../../middleware/require-platform-master-admin.js';
import { grantPlatformAdminRole, revokePlatformAdminRole } from '../../lib/platform-master-admin.js';

const idParamSchema = z.object({ id: z.string().min(1) });

const grantPlatformAdminSchema = z.object({
  email: z.string().email(),
});

/**
 * Platform staff provisioning — master admin only.
 * `POST /admin/platform-admins` · `DELETE /admin/platform-admins/:id`
 */
export const registerAdminPlatformStaffRoutes = (adminRouter: Router): void => {
  adminRouter.post(
    '/platform-admins',
    requirePlatformMasterAdmin,
    validate({ body: grantPlatformAdminSchema }),
    async (req, res, next) => {
      try {
        const { email } = req.body as z.infer<typeof grantPlatformAdminSchema>;
        const result = await grantPlatformAdminRole({
          actorUserId: req.auth!.userId,
          targetEmail: email,
        });
        res.status(201).json({ data: result, message: 'Platform admin access granted.' });
      } catch (error) {
        next(error);
      }
    }
  );

  adminRouter.delete(
    '/platform-admins/:id',
    requirePlatformMasterAdmin,
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        await revokePlatformAdminRole({
          actorUserId: req.auth!.userId,
          targetUserId: id,
        });
        res.json({ message: 'Platform admin access removed.' });
      } catch (error) {
        next(error);
      }
    }
  );
};
