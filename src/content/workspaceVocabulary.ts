/**
 * Canonical product vocabulary — three axes (do not conflate):
 *
 * 1. **UI actor labels** — **Host** = individual leading an outing; **Operator** = agency/shop
 *    brand or management workspace (not a member “role” on `/me/*`).
 * 2. **Capabilities** — **Organize** / **publish** (`GET /me/status` → `publish.*`, `canPublish`);
 *    not HTTP personas or duplicate `/me/publishing-*` routes.
 * 3. **Gates** — **`profileComplete`** to organize/publish; **signed in** suffices to participate
 *    (RSVP, request to join, demand) without full profile.
 *
 * Architecture/API: phasing out `host` paths and `Host*` wire names (`/operator/*`, `/me/status`).
 * @see docs/MEMBER_MODEL.md § Naming vocabulary
 */

/** Individual leading this outing (consumer UI). */
export const ACTIVITY_HOST_NOUN_TITLE = 'Host';
export const ACTIVITY_HOST_NOUN_LOWER = 'host';

export const HOSTED_BY_LABEL = 'Hosted by';

/** @deprecated Prefer {@link ACTIVITY_HOST_NOUN_TITLE} for individual; kept for gradual copy migration. */
export const ORGANIZER_NOUN_TITLE = 'Organizer';
/** @deprecated Prefer {@link ACTIVITY_HOST_NOUN_LOWER}. */
export const ORGANIZER_NOUN_LOWER = 'organizer';
/** @deprecated */
export const ORGANIZER_PLURAL_TITLE = 'Organizers';

export const ORGANIZING_LABEL = 'Organizing';
/** @deprecated Prefer {@link HOSTED_BY_LABEL}. */
export const ORGANIZED_BY_LABEL = 'Organized by';

export const ORGANIZER_APPROVAL_REQUIRED =
  'Organizer approval required to join';

export const ORGANIZER_FALLBACK_DISPLAY_NAME = ORGANIZER_NOUN_TITLE;

export type WorkspaceBrandKind = 'guide' | 'agency' | 'shop';

export const normalizeWorkspaceBrandKind = (
  value?: string | null
): WorkspaceBrandKind | null => {
  if (!value) return null;
  const key = value.toLowerCase();
  if (key === 'individual' || key === 'guide') return 'guide';
  if (key === 'agency') return 'agency';
  if (key === 'shop') return 'shop';
  return null;
};

/** Management shell title (`/operator/*` routes). */
export const workspaceConsoleLabel = (kind?: WorkspaceBrandKind | null): string => {
  if (kind === 'guide') return 'Guide workspace';
  if (kind === 'agency') return 'Operator workspace';
  if (kind === 'shop') return 'Operator workspace';
  return 'Organizer workspace';
};

export const workspaceProfileLabel = (kind?: WorkspaceBrandKind | null): string => {
  if (kind === 'guide') return 'Guide profile';
  if (kind === 'agency') return 'Agency profile';
  if (kind === 'shop') return 'Shop profile';
  return 'Organizer profile';
};

export const workspacePublicProfileLabel = (kind?: WorkspaceBrandKind | null): string => {
  if (kind === 'guide') return 'public guide profile';
  if (kind === 'agency') return 'public agency profile';
  if (kind === 'shop') return 'public shop profile';
  return 'public organizer profile';
};

export const workspaceNotFoundLabel = (kind?: WorkspaceBrandKind | null): string => {
  if (kind === 'guide') return 'Guide not found';
  if (kind === 'agency') return 'Agency not found';
  if (kind === 'shop') return 'Shop not found';
  return 'Organizer not found';
};

export const workspaceSetupTitle = (kind?: WorkspaceBrandKind | null): string => {
  if (kind === 'guide') return 'Set up as a guide';
  if (kind === 'agency') return 'Set up your agency';
  if (kind === 'shop') return 'Set up your shop';
  return 'Set up as an organizer';
};

/** Activity form — tenant the activity is published under. */
export const workspacePublishingAsLabel = 'Publishing as';
