import type { Router } from 'express';
import { z } from 'zod';
import { clearRefreshCookie } from '../../lib/auth-cookies.js';
import { requireAuth } from '../../middleware/auth.js';
import { sensitiveDataLimiter } from '../../middleware/rate-limit-instances.js';
import { validate } from '../../middleware/validate.js';
import { deleteUserAccount, getAccountDeletionInfo } from '../../services/account-deletion.js';
import { buildUserDataExport } from '../../services/data-export.js';

const deleteAccountSchema = z.object({
  password: z.string().min(1).optional(),
  confirmPhrase: z.literal('DELETE').optional(),
});

/** Account export and deletion (each route applies auth). */
export const registerAccountLifecycleRoutes = (router: Router): void => {
  router.get('/me/account/deletion-info', requireAuth, async (req, res, next) => {
    try {
      const info = await getAccountDeletionInfo(req.auth!.userId);
      res.json({ data: info });
    } catch (error) {
      next(error);
    }
  });

  router.get('/me/export', requireAuth, sensitiveDataLimiter, async (req, res, next) => {
    try {
      const data = await buildUserDataExport(req.auth!.userId);
      const filename = `uaetrail-export-${req.auth!.userId.slice(0, 8)}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(data, null, 2));
    } catch (error) {
      next(error);
    }
  });

  router.delete(
    '/me/account',
    requireAuth,
    sensitiveDataLimiter,
    validate({ body: deleteAccountSchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof deleteAccountSchema>;
        await deleteUserAccount(req.auth!.userId, body);
        clearRefreshCookie(res);
        res.json({ message: 'Your account has been deleted.' });
      } catch (error) {
        next(error);
      }
    }
  );
};
