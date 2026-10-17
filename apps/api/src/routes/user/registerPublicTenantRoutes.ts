import type { Router } from 'express';
import { loadPublicTenantProfileBySlug } from '../../services/tenant-public-read.js';

/** Public tenant profile by slug (agency · partner storefronts). */
export const registerPublicTenantRoutes = (router: Router): void => {
  router.get('/tenants/:slug', async (req, res, next) => {
    try {
      const { slug } = req.params;
      const data = await loadPublicTenantProfileBySlug(slug);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
