/** Public host profile URL (tenant slug). */
export const hostProfilePath = (tenantSlug?: string | null): string | null =>
  tenantSlug ? `/operator/${tenantSlug}` : null;
