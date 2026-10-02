import { Router } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../lib/audit.js';
import {
  CONTENT_REPORT_REASONS,
  CONTENT_REPORT_TARGET_TYPES,
  createContentReport,
} from '../lib/content-reports-store.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const reportSchema = z
  .object({
    targetType: z.enum(CONTENT_REPORT_TARGET_TYPES),
    targetId: z.string().min(1).max(120),
    reason: z.enum(CONTENT_REPORT_REASONS),
    details: z.string().max(1000).optional(),
  })
  .superRefine((body, ctx) => {
    if (body.reason === 'other' && !body.details?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add a note when reporting as Other.',
        path: ['details'],
      });
    }
  });

export const reportsRouter = Router();

reportsRouter.post('/', requireAuth, validate({ body: reportSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof reportSchema>;

    const { id } = await createContentReport({
      reporterUserId: req.auth!.userId,
      targetType: body.targetType,
      targetId: body.targetId,
      reason: body.reason,
      details: body.details,
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'content_report',
      entityType: body.targetType,
      entityId: body.targetId,
      metadata: {
        reportId: id,
        reason: body.reason,
        details: body.details?.trim() ?? null,
      },
    });

    res.status(201).json({
      message: 'Report submitted. Our team will review it shortly.',
    });
  } catch (error) {
    next(error);
  }
});
