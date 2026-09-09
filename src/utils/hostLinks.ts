/** Public host profile URL (tenant slug). */
export const hostProfilePath = (tenantSlug?: string | null): string | null =>
  tenantSlug ? `/operator/${tenantSlug}` : null;

/** Member profile for individuals without a public operator page. */
export const memberProfilePath = (userId?: string | null): string | null =>
  userId ? `/member/${userId}` : null;

/** Prefer operator page; fall back to member profile when no tenant slug. */
export const resolveHostProfilePath = (opts: {
  tenantSlug?: string | null;
  hostUserId?: string | null;
}): string | null => hostProfilePath(opts.tenantSlug) ?? memberProfilePath(opts.hostUserId);
