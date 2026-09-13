/** Public organisation profile URL (tenant slug). */
export const organisationProfilePath = (tenantSlug?: string | null): string | null =>
  tenantSlug ? `/operator/${tenantSlug}` : null;

/** @deprecated Use organisationProfilePath */
export const hostProfilePath = organisationProfilePath;

/** Member profile for individuals without a public operator page. */
export const memberProfilePath = (userId?: string | null): string | null =>
  userId ? `/member/${userId}` : null;

/** Domain alias — prefer in new code. Same URL as {@link memberProfilePath}. */
export const personProfilePath = memberProfilePath;

/** Prefer operator page; fall back to member profile when no tenant slug. */
export const resolveOrganisationProfilePath = (opts: {
  tenantSlug?: string | null;
  hostUserId?: string | null;
}): string | null => organisationProfilePath(opts.tenantSlug) ?? memberProfilePath(opts.hostUserId);

/** @deprecated Use resolveOrganisationProfilePath */
export const resolveHostProfilePath = resolveOrganisationProfilePath;
