import type { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  createSubmission,
  findSubmissionCandidates,
  secondSubmission,
} from '../../services/submission-commands.js';

const kindEnum = z.enum(['area', 'venue', 'trail', 'camp_spot', 'facility', 'edit']);

const candidatesQuery = z.object({
  kind: kindEnum,
  facilityType: z.string().max(40).optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  name: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  website: z.string().max(200).optional(),
});

const createBody = z.object({
  kind: kindEnum,
  facilityType: z.string().max(40).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  name: z.string().min(1).max(200),
  payload: z.record(z.string(), z.unknown()).default({}),
  candidates: z
    .array(
      z.object({
        id: z.string(),
        source: z.enum(['live', 'pending']),
        distanceM: z.number(),
        nameScore: z.number(),
        verdict: z.enum(['near_certain', 'possible']),
        name: z.string().optional(),
      })
    )
    .default([]),
  insisted: z.object({ reason: z.string().min(1).max(200), note: z.string().max(500).optional() }).optional(),
});

export const registerMeSubmissionRoutes = (router: Router): void => {
  router.get('/me/submissions/candidates', validate({ query: candidatesQuery }), async (req, res, next) => {
    try {
      const q = req.query as unknown as z.infer<typeof candidatesQuery>;
      const data = await findSubmissionCandidates({
        kind: q.kind,
        facilityType: q.facilityType as never,
        latitude: q.lat,
        longitude: q.lng,
        name: q.name,
        phone: q.phone,
        website: q.website,
      });
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post('/me/submissions', validate({ body: createBody }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof createBody>;
      const data = await createSubmission({
        userId: req.auth!.userId,
        kind: body.kind,
        facilityType: body.facilityType as never,
        latitude: body.latitude,
        longitude: body.longitude,
        name: body.name,
        payload: body.payload,
        candidates: body.candidates,
        insisted: body.insisted,
      });
      res.status(201).json({
        data: {
          id: data._id,
          kind: data.kind,
          status: data.status,
          name: body.name,
          candidates: data.candidates,
          createdAt: new Date(data.createdAt).toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/me/submissions/:id/second', validate({ params: z.object({ id: z.string().min(1) }) }), async (req, res, next) => {
    try {
      const data = await secondSubmission(String(req.params.id), req.auth!.userId);
      if (!data) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }
      res.json({ data: { id: data._id, seconded: data.seconded.length } });
    } catch (error) {
      next(error);
    }
  });
};
