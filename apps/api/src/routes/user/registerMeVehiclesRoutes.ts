import type { Router } from 'express';
import { z } from 'zod';
import { MEMBER_VEHICLE_COLORS } from '@uaetrail/shared-types';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createMyMemberVehicle,
  deleteMyMemberVehicle,
  updateMyMemberVehicle,
} from '../../services/me-vehicles-commands.js';
import { listMyMemberVehicles } from '../../services/me-vehicles-read.js';

const vehicleBodySchema = z.object({
  make: z.string().min(1).max(40),
  model: z.string().min(1).max(40),
  color: z.enum(MEMBER_VEHICLE_COLORS),
  year: z.number().int().min(1990).max(2100),
  plateNumber: z.string().min(2).max(15),
});

const idParamSchema = z.object({ id: z.string().min(1) });

export const registerMeVehiclesRoutes = (router: Router): void => {
  router.get('/me/vehicles', requireAuth, async (req, res, next) => {
    try {
      const data = await listMyMemberVehicles(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/me/vehicles',
    requireAuth,
    validate({ body: vehicleBodySchema }),
    async (req, res, next) => {
      try {
        const data = await createMyMemberVehicle(req.auth!.userId, req.body);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.patch(
    '/me/vehicles/:id',
    requireAuth,
    validate({ params: idParamSchema, body: vehicleBodySchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const data = await updateMyMemberVehicle(req.auth!.userId, id, req.body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/me/vehicles/:id',
    requireAuth,
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        await deleteMyMemberVehicle(req.auth!.userId, id);
        res.json({ data: null });
      } catch (error) {
        next(error);
      }
    }
  );
};
