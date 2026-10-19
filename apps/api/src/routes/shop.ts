import { Router } from 'express';
import { registerShopMerchantManageRoutes } from './shop/registerShopMerchantManageRoutes.js';
import { registerShopPublicRoutes } from './shop/registerShopPublicRoutes.js';

/** Public storefront and merchant/organisation profile manage (`/shop/*`). */
export const shopRouter = Router();

registerShopPublicRoutes(shopRouter);
registerShopMerchantManageRoutes(shopRouter);
