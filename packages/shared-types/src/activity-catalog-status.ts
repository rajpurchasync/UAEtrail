/**
 * Hosted activity catalog lifecycle — explicit state machine.
 *
 * Wire `ActivityStatus`: draft | published | cancelled | suspended.
 * Mongo/API enums may be SCREAMING — helpers normalize case.
 *
 * Mutations stay in `apps/api` (`activities-store`, `publishing-tenant-activity-commands`).
 * Host manage UI (peek sheet, detail hosting, publishing menu) projects from these
 * predicates — do not fork `status === 'published'` for host actions.
 */

export type ActivityCatalogStatus = 'draft' | 'published' | 'cancelled' | 'suspended';

export type ActivityCatalogAction =
  | 'publish'
  | 'edit'
  | 'suspend'
  | 'resume'
  | 'cancel'
  | 'delete_draft'
  | 'remove';

export const ACTIVITY_CATALOG_STATUSES = [
  'draft',
  'published',
  'cancelled',
  'suspended',
] as const satisfies readonly ActivityCatalogStatus[];

const ACTIVITY_CATALOG_STATUS_SET: ReadonlySet<string> = new Set(ACTIVITY_CATALOG_STATUSES);

export const normalizeActivityCatalogStatus = (status: string): string =>
  status.trim().toLowerCase();

export const isActivityCatalogStatus = (status: string | null | undefined): boolean => {
  if (!status) return false;
  return ACTIVITY_CATALOG_STATUS_SET.has(normalizeActivityCatalogStatus(status));
};

export const isPublishedActivityStatus = (status: string | null | undefined): boolean =>
  normalizeActivityCatalogStatus(status ?? '') === 'published';

export const isDraftActivityStatus = (status: string | null | undefined): boolean =>
  normalizeActivityCatalogStatus(status ?? '') === 'draft';

export const isSuspendedActivityStatus = (status: string | null | undefined): boolean =>
  normalizeActivityCatalogStatus(status ?? '') === 'suspended';

export const isCancelledActivityStatus = (status: string | null | undefined): boolean =>
  normalizeActivityCatalogStatus(status ?? '') === 'cancelled';

/**
 * Legal host actions from a catalog status. Matches publishing HTTP + store guards.
 * `remove` is the UI umbrella (draft → hard delete, published/suspended → cancel).
 */
export const activityCatalogAllows = (
  status: string | null | undefined,
  action: ActivityCatalogAction
): boolean => {
  const normalized = status ? normalizeActivityCatalogStatus(status) : '';
  switch (action) {
    case 'publish':
      return normalized === 'draft';
    case 'edit':
      return normalized === 'draft' || normalized === 'published';
    case 'suspend':
      return normalized === 'published';
    case 'resume':
      return normalized === 'suspended';
    case 'cancel':
      return normalized === 'published' || normalized === 'suspended';
    case 'delete_draft':
      return normalized === 'draft';
    case 'remove':
      return normalized === 'draft' || normalized === 'published' || normalized === 'suspended';
    default:
      return false;
  }
};

/** Confirm-dialog routing for the host remove control. */
export const resolveActivityCatalogRemoveKind = (
  status: string | null | undefined
): 'delete_draft' | 'cancel' | null => {
  if (activityCatalogAllows(status, 'delete_draft')) return 'delete_draft';
  if (activityCatalogAllows(status, 'cancel')) return 'cancel';
  return null;
};

export const activityCatalogDenialMessage = (
  action: Exclude<ActivityCatalogAction, 'remove' | 'cancel'>,
  status?: string | null
): string => {
  switch (action) {
    case 'publish':
      return 'Only draft activities can be published.';
    case 'suspend':
      return 'Only published activities can be suspended.';
    case 'resume':
      return 'Only suspended activities can be resumed.';
    case 'delete_draft':
      return 'Only draft activities can be deleted.';
    case 'edit': {
      const label = status ? normalizeActivityCatalogStatus(status) : 'that status';
      return `Cannot edit an activity that is ${label}.`;
    }
    default:
      return 'This outing cannot change status.';
  }
};
