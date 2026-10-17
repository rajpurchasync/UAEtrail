import { ProductStatus } from '../domain/enums.js';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { findAdminProductById, updateAdminProductStatus } from '../lib/admin-store.js';

export const setAdminProductStatus = async (input: {
  actorId: string;
  productId: string;
  status: 'active' | 'inactive';
}) => {
  const product = await findAdminProductById(input.productId);
  if (!product) {
    throw new ApiError(404, 'product_not_found', 'Product not found.');
  }

  const prismaStatus = input.status === 'active' ? ProductStatus.ACTIVE : ProductStatus.INACTIVE;
  await updateAdminProductStatus(input.productId, prismaStatus);

  await createAuditLog({
    actorId: input.actorId,
    action: `product.${input.status === 'active' ? 'approve' : 'suspend'}`,
    entityType: 'product',
    entityId: input.productId,
  });

  return { message: `Product ${input.status === 'active' ? 'approved' : 'suspended'}.` };
};
