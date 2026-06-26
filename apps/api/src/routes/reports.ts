import { Router } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../lib/audit.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const reportSchema = z.object({
  targetType: z.enum(['user', 'message', 'post', 'review', 'reply']),
  targetId: z.string().min(1).max(120),
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'scam', 'other']),
  details: z.string().max(1000).optional()
});

export const reportsRouter = Router();

reportsRouter.post('/', requireAuth, validate({ body: reportSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof reportSchema>;

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'content_report',
      entityType: body.targetType,
      entityId: body.targetId,
      metadata: {
        reason: body.reason,
        details: body.details ?? null
      }
    });

    res.status(201).json({
      message: 'Report submitted. Our team will review it shortly.'
    });
  } catch (error) {
    next(error);
  }
});
