import { Router } from 'express';
import { registerShopPublicRoutes } from './shop/registerShopPublicRoutes.js';

/** Public shop read (`/shop/shops/:id`) — manage via `/workspace/shop-profile` + `x-tenant-id`. */
export const shopRouter = Router();

registerShopPublicRoutes(shopRouter);
