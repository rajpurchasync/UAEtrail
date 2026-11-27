import { Router } from 'express';
import { registerShopMerchantManageRoutes } from './shop/registerShopMerchantManageRoutes.js';
import { registerShopPublicRoutes } from './shop/registerShopPublicRoutes.js';

/** Public storefront (`/shop/shops/:id`) and shop manage (`/shop/merchant/*`). */
export const shopRouter = Router();

registerShopPublicRoutes(shopRouter);
registerShopMerchantManageRoutes(shopRouter);
