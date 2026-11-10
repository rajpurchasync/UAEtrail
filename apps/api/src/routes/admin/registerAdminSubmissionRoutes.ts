import type { Router } from 'express';
import { z } from 'zod';
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
        data: rows.map((s) => ({
          id: s._id,
          kind: s.kind,
          facilityType: s.facilityType,
          status: s.status,
          name: s.payload.name ?? '',
          candidates: s.candidates,
          insisted: s.insisted,
          submittedBy: s.submittedBy,
          seconded: s.seconded.length,
          createdAt: new Date(s.createdAt).toISOString(),
        })),
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
