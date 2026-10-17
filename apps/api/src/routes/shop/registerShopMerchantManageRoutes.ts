import type { Router } from 'express';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { OrderStatus, ProductStatus } from '../../domain/enums.js';
import { ApiError } from '../../lib/api-error.js';
import { scheduleExploreMapCacheInvalidation } from '../../lib/explore-map-cache-schedule.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createMerchantProduct,
  createMerchantProfileForUser,
  deactivateMerchantProductById,
  syncShopTenantFromMerchantProfile,
  updateManagedMerchantProfileById,
  updateMerchantOrderLineItemStatus,
  updateMerchantProductById,
} from '../../services/shop-merchant-commands.js';
import {
  getMerchantAnalytics,
  listManagedMerchantProfiles,
  listMerchantOrderLineItems,
  listMerchantProducts,
  userCanCreateShopProfile,
} from '../../services/shop-merchant-read.js';
import {
  assertMerchantProductAdmin,
  getManagedMerchantProfile,
  idParamSchema,
  merchantAnalyticsQuerySchema,
  merchantOrdersQuerySchema,
  merchantOrderStatusSchema,
  merchantProductsQuerySchema,
  merchantProfilePatchSchema,
  merchantProfileSchema,
  normalizeAnalyticsRange,
  orderIdParamSchema,
  productCreateSchema,
  productPatchSchema,
  serializeMerchantProfile,
  shopOrganisationManagePrefixes,
  shopScopeSchema,
  slugifyFilePart,
  toSharedOrderStatus,
  type ShopManageScope,
} from './shop-route-schemas.js';

/** Merchant + organisation manage (`/shop/merchant/*`, `/shop/organisation/*` profile aliases). */
export const registerShopMerchantManageRoutes = (router: Router): void => {
  shopOrganisationManagePrefixes.forEach((prefix) => {
    router.get(`${prefix}/stores`, requireAuth, requireVerifiedEmail, async (req, res, next) => {
      try {
        const stores = await listManagedMerchantProfiles(req.auth!.userId);
        res.json({ data: stores.map(serializeMerchantProfile) });
      } catch (error) {
        next(error);
      }
    });
  });

  shopOrganisationManagePrefixes.forEach((prefix) => {
    router.get(
      `${prefix}/profile`,
      requireAuth,
      requireVerifiedEmail,
      validate({ query: shopScopeSchema }),
      async (req, res, next) => {
        try {
          const scope = req.query as ShopManageScope;
          const profile = await getManagedMerchantProfile(req.auth!.userId, scope);
          if (!profile) throw new ApiError(404, 'profile_not_found', 'Shop profile not found. Create one first.');

          res.json({
            data: serializeMerchantProfile(profile),
          });
        } catch (error) {
          next(error);
        }
      }
    );
  });

  shopOrganisationManagePrefixes.forEach((prefix) => {
    router.post(
      `${prefix}/profile`,
      requireAuth,
      requireVerifiedEmail,
      validate({ body: merchantProfileSchema }),
      async (req, res, next) => {
        try {
          const userId = req.auth!.userId;
          if (!(await userCanCreateShopProfile(userId, req.auth!.role))) {
            throw new ApiError(
              403,
              'forbidden',
              'Shop profiles are created when your host application is approved, or by a platform administrator.'
            );
          }
          const body = req.body as z.infer<typeof merchantProfileSchema>;
          const profile = await createMerchantProfileForUser(userId, body);
          await syncShopTenantFromMerchantProfile(userId, profile);

          res.status(201).json({
            data: serializeMerchantProfile(profile),
          });
        } catch (error) {
          next(error);
        }
      }
    );
  });

  shopOrganisationManagePrefixes.forEach((prefix) => {
    router.patch(
      `${prefix}/profile`,
      requireAuth,
      requireVerifiedEmail,
      validate({ query: shopScopeSchema, body: merchantProfilePatchSchema }),
      async (req, res, next) => {
        try {
          const userId = req.auth!.userId;
          const scope = req.query as ShopManageScope;
          const existing = await getManagedMerchantProfile(userId, scope);
          if (!existing) throw new ApiError(404, 'profile_not_found', 'Shop profile not found.');

          const body = req.body as z.infer<typeof merchantProfilePatchSchema>;
          const updated = await updateManagedMerchantProfileById(userId, existing.id, body);
          await syncShopTenantFromMerchantProfile(userId, updated);
          scheduleExploreMapCacheInvalidation('shop.profile_map_cache');

          res.json({
            data: serializeMerchantProfile(updated),
          });
        } catch (error) {
          next(error);
        }
      }
    );
  });

  router.get(
    '/merchant/products',
    requireAuth,
    requireVerifiedEmail,
    validate({ query: merchantProductsQuerySchema }),
    async (req, res, next) => {
      try {
        const scope = req.query as unknown as z.infer<typeof merchantProductsQuerySchema>;
        const { page, pageSize } = scope;
        const profile = await getManagedMerchantProfile(req.auth!.userId, scope);
        if (!profile) throw new ApiError(404, 'profile_not_found', 'Shop profile not found.');

        const { items: products, total } = await listMerchantProducts({
          merchantId: profile.id,
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

        res.json({
          data: products.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            images: p.images,
            priceAed: p.priceAed,
            stockQuantity: p.stockQuantity,
            lowStockThreshold: p.lowStockThreshold,
            discountPercent: p.discountPercent,
            externalUrl: p.externalUrl,
            packagingInfo: p.packagingInfo,
            category: p.category,
            status: p.status.toLowerCase(),
            createdAt: p.createdAt.toISOString(),
          })),
          meta: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/merchant/products',
    requireAuth,
    requireVerifiedEmail,
    validate({ body: productCreateSchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof productCreateSchema>;
        const profile = await getManagedMerchantProfile(req.auth!.userId, {
          merchantId: body.merchantId,
          shopId: body.shopId,
        });
        if (!profile) throw new ApiError(404, 'profile_not_found', 'Create a shop profile first.');

        const product = await createMerchantProduct({
          merchantId: profile.id,
          name: body.name,
          description: body.description,
          images: body.images,
          priceAed: body.priceAed,
          stockQuantity: body.stockQuantity,
          lowStockThreshold: body.lowStockThreshold,
          discountPercent: body.discountPercent,
          externalUrl: body.externalUrl ?? null,
          packagingInfo: body.packagingInfo,
          category: body.category,
          status: body.status === 'active' ? ProductStatus.ACTIVE : ProductStatus.DRAFT,
        });

        res.status(201).json({
          data: {
            id: product.id,
            name: product.name,
            description: product.description,
            images: product.images,
            priceAed: product.priceAed,
            stockQuantity: product.stockQuantity,
            lowStockThreshold: product.lowStockThreshold,
            discountPercent: product.discountPercent,
            externalUrl: product.externalUrl,
            packagingInfo: product.packagingInfo,
            category: product.category,
            status: product.status.toLowerCase(),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.patch(
    '/merchant/products/:id',
    requireAuth,
    requireVerifiedEmail,
    validate({ params: idParamSchema, body: productPatchSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        await assertMerchantProductAdmin(req.auth!.userId, id);

        const body = req.body as z.infer<typeof productPatchSchema>;
        const updateData: Record<string, unknown> = { ...body };
        delete updateData.merchantId;
        delete updateData.shopId;
        if (body.status) {
          updateData.status = body.status === 'active' ? ProductStatus.ACTIVE : ProductStatus.DRAFT;
        }

        const updated = await updateMerchantProductById(id, updateData);

        res.json({
          data: {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            images: updated.images,
            priceAed: updated.priceAed,
            stockQuantity: updated.stockQuantity,
            lowStockThreshold: updated.lowStockThreshold,
            discountPercent: updated.discountPercent,
            packagingInfo: updated.packagingInfo,
            category: updated.category,
            status: updated.status.toLowerCase(),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/merchant/products/:id',
    requireAuth,
    requireVerifiedEmail,
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        await assertMerchantProductAdmin(req.auth!.userId, id);

        await deactivateMerchantProductById(id);

        res.json({ message: 'Product deactivated.' });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/merchant/orders',
    requireAuth,
    requireVerifiedEmail,
    validate({ query: merchantOrdersQuerySchema }),
    async (req, res, next) => {
      try {
        const scope = req.query as unknown as z.infer<typeof merchantOrdersQuerySchema>;
        const { page, pageSize } = scope;
        let merchantId = scope.merchantId ?? scope.shopId;

        if (scope.merchantId || scope.shopId || scope.tenantId) {
          const profile = await getManagedMerchantProfile(req.auth!.userId, scope);
          merchantId = profile?.id;
        }

        const { items, total } = await listMerchantOrderLineItems({
          adminId: req.auth!.userId,
          merchantId,
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

        res.json({
          data: items.map((item) => ({
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            quantity: item.quantity,
            totalAed: item.totalAed,
            status: toSharedOrderStatus(item.status),
            fulfillmentTrackingLink: item.fulfillmentTrackingLink,
            timestamp: item.timestamp.toISOString(),
            product: item.product,
          })),
          meta: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.patch(
    '/merchant/orders/:orderId/status',
    requireAuth,
    requireVerifiedEmail,
    validate({ params: orderIdParamSchema, body: merchantOrderStatusSchema }),
    async (req, res, next) => {
      try {
        const { orderId } = req.params as z.infer<typeof orderIdParamSchema>;
        const body = req.body as z.infer<typeof merchantOrderStatusSchema>;
        const updated = await updateMerchantOrderLineItemStatus({
          adminId: req.auth!.userId,
          orderLineItemId: orderId,
          status: body.status.toUpperCase() as OrderStatus,
          fulfillmentTrackingLink: body.fulfillmentTrackingLink,
        });

        res.json({
          data: {
            id: updated.id,
            orderId: updated.orderId,
            productId: updated.productId,
            quantity: updated.quantity,
            totalAed: updated.totalAed,
            status: toSharedOrderStatus(updated.status),
            fulfillmentTrackingLink: updated.fulfillmentTrackingLink,
            timestamp: updated.timestamp.toISOString(),
            product: updated.product,
          },
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Merchant order access denied.') {
          next(new ApiError(403, 'forbidden', 'You are not authorized to manage this order.'));
          return;
        }
        if (error instanceof Error && error.message === 'Order line item not found.') {
          next(new ApiError(404, 'order_not_found', 'Order not found.'));
          return;
        }
        next(error);
      }
    }
  );

  router.get(
    '/merchant/analytics/sales',
    requireAuth,
    requireVerifiedEmail,
    validate({ query: merchantAnalyticsQuerySchema }),
    async (req, res, next) => {
      try {
        const scope = req.query as unknown as z.infer<typeof merchantAnalyticsQuerySchema>;
        const { startDate, endDate, interval } = scope;
        let merchantId = scope.merchantId ?? scope.shopId;

        if (scope.merchantId || scope.shopId || scope.tenantId) {
          const profile = await getManagedMerchantProfile(req.auth!.userId, scope);
          merchantId = profile?.id;
        }

        const normalizedRange = normalizeAnalyticsRange(startDate, endDate);
        const analytics = await getMerchantAnalytics({
          adminId: req.auth!.userId,
          merchantId,
          startDate: normalizedRange.startDate,
          endDate: normalizedRange.endDate,
          interval,
        });

        res.json({
          data: {
            merchantId,
            merchantIds: analytics.merchantIds,
            startDate: normalizedRange.startDate.toISOString(),
            endDate: normalizedRange.endDate.toISOString(),
            interval,
            points: analytics.points,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/merchant/analytics/export',
    requireAuth,
    requireVerifiedEmail,
    validate({ query: merchantAnalyticsQuerySchema }),
    async (req, res, next) => {
      try {
        const scope = req.query as unknown as z.infer<typeof merchantAnalyticsQuerySchema>;
        const { startDate, endDate, interval } = scope;
        let merchantId = scope.merchantId ?? scope.shopId;
        const profile =
          scope.merchantId || scope.shopId || scope.tenantId
            ? await getManagedMerchantProfile(req.auth!.userId, scope)
            : null;
        if (profile) merchantId = profile.id;

        const normalizedRange = normalizeAnalyticsRange(startDate, endDate);
        const analytics = await getMerchantAnalytics({
          adminId: req.auth!.userId,
          merchantId,
          startDate: normalizedRange.startDate,
          endDate: normalizedRange.endDate,
          interval,
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Analytics');
        worksheet.columns = [
          { header: 'Period', key: 'bucket', width: 16 },
          { header: 'Sales (AED)', key: 'salesAed', width: 16 },
          { header: 'Clicks', key: 'clicks', width: 12 },
          { header: 'Orders', key: 'orderCount', width: 12 },
          { header: 'Units Sold', key: 'quantitySold', width: 12 },
        ];
        analytics.points.forEach((point) => {
          worksheet.addRow(point);
        });

        const namePart = slugifyFilePart(profile?.shopName ?? 'merchant-analytics');
        const filename = `${namePart}-${interval}-${normalizedRange.startDate.toISOString().slice(0, 10)}-${normalizedRange.endDate.toISOString().slice(0, 10)}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        next(error);
      }
    }
  );
};
