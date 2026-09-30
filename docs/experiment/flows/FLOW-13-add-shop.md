# FLOW-13 — Add · Shop (`add.shop`)

**Status:** Implemented (2026-10-01)  
**FAB:** Add → **Shops**  
**Code:** `contributeFlows/shop.ts` · `CreateContributeFlow` · `ContributeShopPreview.tsx`

**Community map info** — anyone signed in can add a nearby shop tip (not shop-owner onboarding or **Organisations** applications). Separate from **become-host** merchant profiles.

## Steps

| # | Step | Screen |
|---|------|--------|
| 1 | `title` | Shop name |
| 2 | `location` | **Location pin** (emirate + map) |
| 3 | `about` | About the shop |
| 4 | `shop_products` | **Product / service** description |
| 5 | `shop_keywords` | **Search keywords** (comma-separated) |
| 6 | `image` | Cover image (1) |
| 7 | `shop_delivery` | **Delivery** Yes/No · if Yes → distance (10–200 km) |
| 8 | `shop_phone` | Phone |
| 9 | `shop_email` | Email |
| 10 | `review` | Preview → Submit |

## Submit

`POST /me/locations` with `activityType: shop`, `status: draft` (same pipeline as trail/camp). Shop-specific fields are encoded server-side (`shopProductsServices`, keywords, delivery, contact).

**After submit:** Success sheet → **View pending** → `/shop/:id` (preview until admin approves in **Places**).

**Outdoor add flows:** [FLOW-10 hiking](./FLOW-10-add-hiking-trail.md) · [FLOW-12 camping](./FLOW-12-add-camping.md).
