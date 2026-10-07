import type { PublishingProfileKind } from './publishing-profile-kind.js';

/** Follow a venue (place), host brand, or shop — outing alerts when something is published there. People use member follow (`/me/following`). */
export type EntityFollowKind = 'location' | 'tenant' | 'merchant';

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
    logoUrl?: string | null;
    brandProfileKind?: PublishingProfileKind;
  } | null;
  merchant?: { id: string; shopName: string; logo?: string | null } | null;
}

export interface EntityFollowCheckDTO {
  following: boolean;
  followId: string | null;
}
