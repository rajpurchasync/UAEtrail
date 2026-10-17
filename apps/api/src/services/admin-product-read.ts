import { ProductStatus } from '../domain/enums.js';
import { listAdminProductsPaged } from '../lib/admin-store.js';

export const listAdminProductsPage = async (input: {
  status?: string;
  category?: string;
  featured?: 'true' | 'false';
  page: number;
  pageSize: number;
}) => {
  const where: {
    status?: ProductStatus;
    category?: string;
    discountPercent?: { gt: number };
  } = {};
  if (input.status) {
    where.status = input.status.toLowerCase() === 'active' ? ProductStatus.ACTIVE : ProductStatus.INACTIVE;
  }
  if (input.category) where.category = input.category;
  if (input.featured === 'true') where.discountPercent = { gt: 0 };

  const { items: products, total } = await listAdminProductsPaged({
    where,
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  });

  return {
    total,
    page: input.page,
    pageSize: input.pageSize,
    items: products.map((p) => ({
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
  };
};
