import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { setAdminProductStatus } from '../../services/admin-product-commands.js';
import { listAdminProductsPage } from '../../services/admin-product-read.js';

const idParamSchema = z.object({ id: z.string().min(1) });

const productListQuerySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const productStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
});

/** Platform admin shop product moderation (`/admin/products`). */
export const registerAdminProductRoutes = (adminRouter: Router): void => {
  adminRouter.get('/products', validate({ query: productListQuerySchema }), async (req, res, next) => {
    try {
      const { status, category, featured, page, pageSize } = req.query as unknown as z.infer<
        typeof productListQuerySchema
      >;
      const result = await listAdminProductsPage({ status, category, featured, page, pageSize });
      res.json({
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: Math.ceil(result.total / result.pageSize),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.patch(
    '/products/:id/status',
    validate({ params: idParamSchema, body: productStatusSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { status } = req.body as z.infer<typeof productStatusSchema>;
        const result = await setAdminProductStatus({
          actorId: req.auth!.userId,
          productId: id,
          status,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );
};
