import type { PublishingProfileKind } from './publishing-profile-kind.js';

/** Follow a venue (place), host brand, or shop — outing alerts when something is published there. People use member follow (`/me/following`). */
export type EntityFollowKind = 'location' | 'tenant' | 'shop';

/** Mongo `entity_follows.kind` — `merchant` rows normalize to {@link EntityFollowKind} `shop` on read. */
export type EntityFollowKindStored = EntityFollowKind | 'merchant';

export const normalizeEntityFollowKind = (kind: EntityFollowKindStored): EntityFollowKind =>
  kind === 'merchant' ? 'shop' : kind;

export interface EntityFollowDTO {
  id: string;
  kind: EntityFollowKind;
  targetId: string;
  createdAt: string;
  location?: { id: string; name: string; images: string[] } | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    ownerUserId?: string | null;
    logoUrl?: string | null;
    brandProfileKind?: PublishingProfileKind;
  } | null;
  shop?: { id: string; shopName: string; logo?: string | null } | null;
}

export interface EntityFollowCheckDTO {
  following: boolean;
  followId: string | null;
}
