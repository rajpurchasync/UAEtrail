import type { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  listMyVerificationDocuments,
  submitVerificationDocument,
} from '../../services/verification-documents.js';

const bodySchema = z.object({
  docType: z.enum([
    'emirates_id',
    'passport',
    'trade_licence',
    'tourism_permit',
    'insurance',
    'first_aid',
    'guide_certification',
    'other',
  ]),
  fileKey: z.string().min(1).max(500).optional(),
});

/** Member trust docs — `POST/GET /me/verification-documents`. */
export const registerMeVerificationRoutes = (router: Router): void => {
  router.get('/me/verification-documents', async (req, res, next) => {
    try {
      const data = await listMyVerificationDocuments(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post('/me/verification-documents', validate({ body: bodySchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof bodySchema>;
      const data = await submitVerificationDocument({
        organizerId: req.auth!.userId,
        docType: body.docType,
        fileKey: body.fileKey,
      });
      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  });
};
