/** Canonical org commerce console — legacy `/shop/manage` and `/agency/manage` redirect here. */
export const ORGANISATION_MANAGE_PATH = '/organisation/manage' as const;

export type OrganisationKind = 'agency' | 'shop';

export const organisationManagePath = (kind?: OrganisationKind): string =>
  kind ? `${ORGANISATION_MANAGE_PATH}?kind=${kind}` : ORGANISATION_MANAGE_PATH;

export const parseOrganisationKind = (value: string | null): OrganisationKind | null =>
  value === 'agency' || value === 'shop' ? value : null;
