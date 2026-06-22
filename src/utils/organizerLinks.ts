/** Public organizer profile URL (tenant slug). */
export const organizerProfilePath = (tenantSlug?: string | null): string | null =>
  tenantSlug ? `/operator/${tenantSlug}` : null;
