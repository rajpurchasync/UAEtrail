export const ORGANISATION_PUBLIC_TAB_QUERY = 'tab';

export const ORGANISATION_PUBLIC_TABS = ['about', 'outings', 'contact'] as const;
export type OrganisationPublicDetailTabId = (typeof ORGANISATION_PUBLIC_TABS)[number];

export const parseOrganisationPublicDetailTabParam = (
  value: string | null | undefined
): OrganisationPublicDetailTabId => {
  if (value === 'outings' || value === 'contact') return value;
  return 'about';
};

export const ORGANISATION_PUBLIC_TAB_LABELS: Record<OrganisationPublicDetailTabId, string> = {
  about: 'About',
  outings: 'Outings',
  contact: 'Contact',
};
