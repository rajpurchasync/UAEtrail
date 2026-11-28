import { setActiveTenantId } from '../api/tenant';
import { OPERATOR_OVERVIEW_PATH, OPERATOR_PROFILE_PATH } from '../config/surfacePaths';

export type OperatorDeskProfileKind = 'agency' | 'shop';

/** Operator desk home — schedule + host tools (`/operator/overview`). */
export const operatorDeskOverviewPath = (): string => OPERATOR_OVERVIEW_PATH;

/** Select tenant then open the shared operator desk overview. */
export const primeOperatorDeskTenant = (tenantId: string): void => {
  const id = tenantId.trim();
  if (id) setActiveTenantId(id);
};

/** Operator desk public profile editor (`/operator/profile`). */
export const operatorDeskProfilePath = (kind?: OperatorDeskProfileKind): string =>
  kind ? `${OPERATOR_PROFILE_PATH}?kind=${encodeURIComponent(kind)}` : OPERATOR_PROFILE_PATH;

export const parseOperatorDeskProfileKind = (
  value: string | null
): OperatorDeskProfileKind | null =>
  value === 'agency' || value === 'shop' ? value : null;