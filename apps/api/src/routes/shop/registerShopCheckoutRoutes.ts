import type { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/api-error.js';
import { getStripe, isStripeConfigured } from '../../lib/stripe.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createShopOrderWithItems, setShopOrderStripeSession } from '../../services/shop-checkout-commands.js';
import { listActiveProductsByIds } from '../../services/shop-public-read.js';
import { checkoutSchema } from './shop-route-schemas.js';

/** Checkout config + Stripe session (`GET /shop/checkout/config`, `POST /shop/checkout`). */
export const registerShopCheckoutRoutes = (router: Router): void => {
  router.get('/checkout/config', (_req, res) => {
    res.json({ data: { stripeEnabled: isStripeConfigured() } });
  });

  router.post(
    '/checkout',
    requireAuth,
    requireVerifiedEmail,
    validate({ body: checkoutSchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof checkoutSchema>;
        const lineInputs =
          body.items && body.items.length > 0
            ? body.items
            : [{ productId: body.productId!, quantity: body.quantity }];

        const productIds = [...new Set(lineInputs.map((line) => line.productId))];
        const products = await listActiveProductsByIds(productIds);
        if (products.length !== productIds.length) {
          throw new ApiError(404, 'product_not_found', 'One or more products were not found.');
        }

        const productById = new Map(products.map((p) => [p.id, p]));
        const external = lineInputs.find((line) => productById.get(line.productId)?.externalUrl);
        if (external) {
          throw new ApiError(400, 'external_product', 'Cart contains a product that uses an external buy link.');
        }

        const orderLines = lineInputs.map((line) => {
          const product = productById.get(line.productId)!;
          return { product, quantity: line.quantity, unitPrice: product.priceAed };
        });
        const subtotalAed = orderLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
        const includeVat = body.includeVat !== false;
        const vatAed = includeVat ? Math.round(subtotalAed * 0.05) : 0;
        const totalAed = subtotalAed + vatAed;

        const stripe = await getStripe();

        const order = await createShopOrderWithItems({
          userId: req.auth!.userId,
          totalAed,
          items: orderLines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            unitPriceAed: line.unitPrice,
          })),
        });

        const cancelPath =
          orderLines.length === 1
            ? `/product/${orderLines[0].product.id}?checkout=cancelled`
            : '/shop?checkout=cancelled';

        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          success_url: `${env.APP_BASE_URL}/shop?checkout=success&order=${order.id}`,
          cancel_url: `${env.APP_BASE_URL}${cancelPath}`,
          client_reference_id: order.id,
          metadata: { orderId: order.id, userId: req.auth!.userId },
          line_items: [
            ...orderLines.map((line) => ({
              quantity: line.quantity,
              price_data: {
                currency: 'aed',
                unit_amount: line.unitPrice * 100,
                product_data: {
                  name: line.product.name,
                  description: line.product.description?.slice(0, 200) ?? undefined,
                  images: line.product.images.slice(0, 1),
                },
              },
            })),
            ...(vatAed > 0
              ? [
                  {
                    quantity: 1,
                    price_data: {
                      currency: 'aed',
                      unit_amount: vatAed * 100,
                      product_data: { name: 'VAT (5%)' },
                    },
                  },
                ]
              : []),
          ],
        });

        await setShopOrderStripeSession(order.id, session.id);

        res.json({ data: { sessionId: session.id, url: session.url } });
      } catch (error) {
        next(error);
      }
    }
  );
};
