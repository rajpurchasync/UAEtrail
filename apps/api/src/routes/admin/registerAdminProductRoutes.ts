import { ProductStatus } from '../../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../../lib/audit.js';
import { ApiError } from '../../lib/api-error.js';
import {
  findAdminProductById,
  listAdminProductsPaged,
  updateAdminProductStatus,
} from '../../lib/admin-store.js';
import { validate } from '../../middleware/validate.js';

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

      const where: {
        status?: ProductStatus;
        category?: string;
        discountPercent?: { gt: number };
      } = {};
      if (status) where.status = status.toLowerCase() === 'active' ? ProductStatus.ACTIVE : ProductStatus.INACTIVE;
      if (category) where.category = category;
      if (featured === 'true') where.discountPercent = { gt: 0 };

      const { items: products, total } = await listAdminProductsPaged({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      res.json({
        data: products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          images: p.images as string[],
          priceAed: p.priceAed,
          discountPercent: p.discountPercent,
          packagingInfo: p.packagingInfo,
          category: p.category,
          status: p.status.toLowerCase(),
          merchantId: p.merchantId,
          merchantName: p.merchant.shopName,
          createdAt: p.createdAt.toISOString(),
          featured: Boolean(p.discountPercent && p.discountPercent > 0),
        })),
        pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
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

        const product = await findAdminProductById(id);
        if (!product) throw new ApiError(404, 'product_not_found', 'Product not found.');

        const prismaStatus = status === 'active' ? ProductStatus.ACTIVE : ProductStatus.INACTIVE;
        await updateAdminProductStatus(id, prismaStatus);

        await createAuditLog({
          actorId: req.auth!.userId,
          action: `product.${status === 'active' ? 'approve' : 'suspend'}`,
          entityType: 'product',
          entityId: id,
        });

        res.json({ message: `Product ${status === 'active' ? 'approved' : 'suspended'}.` });
      } catch (error) {
        next(error);
      }
    }
  );
};
