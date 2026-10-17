import { Router } from 'express';
import { registerShopCheckoutRoutes } from './shop/registerShopCheckoutRoutes.js';
import { registerShopMerchantManageRoutes } from './shop/registerShopMerchantManageRoutes.js';
import { registerShopPublicRoutes } from './shop/registerShopPublicRoutes.js';

/** Public catalog, checkout, and merchant/organisation manage (`/shop/*`). */
export const shopRouter = Router();

registerShopPublicRoutes(shopRouter);
registerShopCheckoutRoutes(shopRouter);
registerShopMerchantManageRoutes(shopRouter);
