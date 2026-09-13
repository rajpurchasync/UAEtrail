export type OrganisationKind = 'agency' | 'shop';

/** Canonical organisation management console. Legacy `/shop/manage` and `/agency/manage` redirect here. */
export const organisationManagePath = (kind?: OrganisationKind): string =>
  kind ? `/organisation/manage?kind=${kind}` : '/organisation/manage';

export const parseOrganisationKind = (value: string | null): OrganisationKind | null =>
  value === 'agency' || value === 'shop' ? value : null;
