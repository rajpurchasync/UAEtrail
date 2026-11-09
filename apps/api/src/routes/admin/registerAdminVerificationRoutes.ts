import type { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  listPendingVerificationDocuments,
  reviewVerificationDocument,
} from '../../services/verification-documents.js';

export const registerAdminVerificationRoutes = (router: Router): void => {
  router.get('/verification-documents', async (_req, res, next) => {
    try {
      const data = await listPendingVerificationDocuments();
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    '/verification-documents/:id',
    validate({
      params: z.object({ id: z.string().min(1) }),
      body: z.object({ status: z.enum(['accepted', 'rejected']) }),
    }),
    async (req, res, next) => {
      try {
        const data = await reviewVerificationDocument({
          id: String(req.params.id),
          reviewerId: req.auth!.userId,
          status: (req.body as { status: 'accepted' | 'rejected' }).status,
        });
        if (!data) {
          res.status(404).json({ error: 'Document not found' });
          return;
        }
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
