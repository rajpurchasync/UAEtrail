/**
 * Canonical product vocabulary — three axes (do not conflate):
 *
 * 1. **UI actor labels** — **Host** = individual on an outing; **Operator** = any publishing identity
 *    (community host, guide, shop, agency) at **`/operator/*`**; joiner copy still says Host / brand name.
 * 2. **Capabilities** — **Host** / **publish** (`GET /me/status` → `publish.*`, `canPublish`);
 *    not HTTP personas or duplicate `/me/publishing-*` routes.
 * 3. **Gates** — **`profileComplete`** to host/publish; **signed in** suffices to participate
 *    (RSVP, request to join, looking for company) without full profile.
 *
 * **BWL (backend wire)** is separate: `packages/shared-types/src/wire-lexicon.ts` — HTTP paths, JSON keys,
 * Mongo collections. Do not rename wire because UPL says Host; map in presentation layer only.
 * @see docs/SYSTEM_COHERENCE.md §8.8 · docs/MEMBER_MODEL.md § Naming vocabulary
 */

import type { PublishingProfileKind } from '@uaetrail/shared-types';

/** Individual leading this outing (consumer UI). */
export const ACTIVITY_HOST_NOUN_TITLE = 'Host';
export const ACTIVITY_HOST_NOUN_LOWER = 'host';

export const HOSTED_BY_LABEL = 'Hosted by';

export const HOSTING_LABEL = 'Hosting';

export const HOST_APPROVAL_REQUIRED = 'Host approval required to join';

export const HOST_FALLBACK_DISPLAY_NAME = ACTIVITY_HOST_NOUN_TITLE;

export type WorkspaceBrandKind = 'host' | 'guide' | 'agency' | 'shop';

export const normalizeWorkspaceBrandKind = (
  value?: string | null
): WorkspaceBrandKind | null => {
  if (!value) return null;
  const key = value.toLowerCase();
  if (key === 'community' || key === 'host') return 'host';
  if (key === 'individual' || key === 'guide' || key === 'pro_guide') return 'guide';
  if (key === 'agency' || key === 'partner' || key === 'hospitality') return 'agency';
  if (key === 'shop' || key === 'ecommerce') return 'shop';
  return null;
};

export const publishingProfileKindToDeskBrand = (
  kind: PublishingProfileKind
): WorkspaceBrandKind => {
  if (kind === 'community') return 'host';
  if (kind === 'pro_guide') return 'guide';
  if (kind === 'shop' || kind === 'ecommerce') return 'shop';
  if (kind === 'agency' || kind === 'hospitality' || kind === 'partner') return 'agency';
  return 'host';
};

/**
 * Management shell title — member SPA **`/operator/*`** (HTTP API stays `/publishing/*`).
 * Community hosts see community schedule on **`/operator/overview`** (`UPL_OPERATOR_DASHBOARD`).
 */
export const workspaceConsoleLabel = (kind?: WorkspaceBrandKind | null): string => {
  if (kind === 'host') return 'Hosting desk';
  if (kind === 'guide') return 'Guide desk';
  if (kind === 'agency') return 'Agency desk';
  if (kind === 'shop') return 'Shop desk';
  return 'Operator desk';
};

export const workspaceProfileLabel = (kind?: WorkspaceBrandKind | null): string => {
  if (kind === 'guide') return 'Guide profile';
  if (kind === 'agency') return 'Agency profile';
  if (kind === 'shop') return 'Shop profile';
  return 'Host profile';
};

export const workspacePublicProfileLabel = (kind?: WorkspaceBrandKind | null): string => {
  if (kind === 'guide') return 'member profile (Pro guide)';
  if (kind === 'agency') return 'agency profile';
  if (kind === 'shop') return 'shop profile';
  return 'member profile';
};

export const workspaceNotFoundLabel = (kind?: WorkspaceBrandKind | null): string => {
  if (kind === 'guide') return 'Guide not found';
  if (kind === 'agency') return 'Agency not found';
  if (kind === 'shop') return 'Shop not found';
  return 'Host not found';
};

export const workspaceSetupTitle = (kind?: WorkspaceBrandKind | null): string => {
  if (kind === 'guide') return 'Set up as a guide';
  if (kind === 'agency') return 'Set up your agency';
  if (kind === 'shop') return 'Set up your shop';
  return 'Set up hosting';
};

/** Activity form — tenant the activity is published under. */
export const workspacePublishingAsLabel = 'Publishing as';
