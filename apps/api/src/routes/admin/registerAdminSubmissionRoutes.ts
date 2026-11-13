import type { Router } from 'express';
import { z } from 'zod';
import type { AdminSubmissionDTO } from '@uaetrail/shared-types';
import { validate } from '../../middleware/validate.js';
import { listPendingSubmissions, reviewSubmission } from '../../services/submission-commands.js';

const reviewBody = z.object({
  action: z.enum(['approve', 'reject', 'merge']),
  reason: z.string().max(400).optional(),
  mergedInto: z.string().max(80).optional(),
});

export const registerAdminSubmissionRoutes = (router: Router): void => {
  router.get('/submissions', async (_req, res, next) => {
    try {
      const rows = await listPendingSubmissions();
      res.json({
        data: rows.map((s): AdminSubmissionDTO => {
          const payload = s.payload ?? {};
          return {
            id: s._id,
            kind: s.kind,
            facilityType: s.facilityType,
            status: s.status,
            name: typeof payload.name === 'string' ? payload.name : '',
            description: typeof payload.description === 'string' ? payload.description : null,
            latitude: typeof payload.latitude === 'number' ? payload.latitude : null,
            longitude: typeof payload.longitude === 'number' ? payload.longitude : null,
            images: Array.isArray(payload.images)
              ? payload.images.filter((u): u is string => typeof u === 'string')
              : [],
            proposedAreaName:
              typeof payload.proposedAreaName === 'string' ? payload.proposedAreaName : null,
            candidates: s.candidates,
            insisted: s.insisted
              ? {
                  reason: s.insisted.reason,
                  note: s.insisted.note,
                  at: new Date(s.insisted.at).toISOString(),
                }
              : undefined,
            submittedBy: s.submittedBy,
            seconded: s.seconded.length,
            createdAt: new Date(s.createdAt).toISOString(),
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/submissions/:id/review',
    validate({ params: z.object({ id: z.string().min(1) }), body: reviewBody }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof reviewBody>;
        const data = await reviewSubmission({
          id: String(req.params.id),
          reviewerId: req.auth!.userId,
          action: body.action,
          reason: body.reason,
          mergedInto: body.mergedInto,
        });
        res.json({ data: { id: data._id, status: data.status, targetId: data.targetId } });
      } catch (error) {
        next(error);
      }
    }
  );
};
