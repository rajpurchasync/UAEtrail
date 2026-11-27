import { OPERATOR_PROFILE_PATH } from '../config/surfacePaths';

/** Inbound bookmark only — UI is `/operator/profile`. */
export const ORGANISATION_MANAGE_PATH = '/organisation/manage' as const;

export type OrganisationKind = 'agency' | 'shop';

/** Operator desk profile editor (absorbs legacy `/organisation/manage`). */
export const operatorDeskProfilePath = (kind?: OrganisationKind): string =>
  kind ? `${OPERATOR_PROFILE_PATH}?kind=${kind}` : OPERATOR_PROFILE_PATH;

/** @deprecated Use {@link operatorDeskProfilePath} — path kept for inbound rewrite only. */
export const organisationManagePath = operatorDeskProfilePath;

export const parseOrganisationKind = (value: string | null): OrganisationKind | null =>
  value === 'agency' || value === 'shop' ? value : null;
