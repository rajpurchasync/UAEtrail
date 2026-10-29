import { publishesActivityAsIndividual } from './activity-publisher-display.js';
import type { PublishingProfileKind } from './publishing-profile-kind.js';

export type ActivityGuideStatus = 'accepted' | 'pending';

/** Compact guide row on public activity / explore payloads — no bio or contact. */
export interface ActivityGuidePublicDTO {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

/** Host workspace row — pending invites stay off public pages. */
export interface ActivityGuideHostDTO extends ActivityGuidePublicDTO {
  status: ActivityGuideStatus;
}

export type ActivityPublisherChipKind = 'company' | 'person';

export type ActivityPublisherChip = {
  kind: ActivityPublisherChipKind;
  name: string;
  avatarUrl: string | null;
};

export type ActivityPublisherChipInput = {
  publishingProfileKind?: PublishingProfileKind | null;
  tenantName?: string | null;
  tenantLogoUrl?: string | null;
  hostName?: string | null;
  hostAvatar?: string | null;
  listHost?: string | null;
};

/** Community and pro-guide outings require extra guides to accept. Agencies assign without consent. */
export const activityGuideConsentRequired = (kind?: PublishingProfileKind | null): boolean =>
  publishesActivityAsIndividual(kind ?? 'community');

export const acceptedActivityGuides = <T extends { status?: ActivityGuideStatus }>(
  guides: readonly T[] | null | undefined
): T[] => (guides ?? []).filter((guide) => (guide.status ?? 'accepted') === 'accepted');

export const activityGuideCountLabel = (count: number): string =>
  count === 1 ? '1 guide' : `${count.toLocaleString()} guides`;

export const resolveActivityPublisherChip = (input: ActivityPublisherChipInput): ActivityPublisherChip => {
  const kind = input.publishingProfileKind ?? 'community';
  if (!publishesActivityAsIndividual(kind)) {
    const name =
      input.tenantName?.trim() || input.listHost?.trim() || input.hostName?.trim() || 'Tour operator';
    return {
      kind: 'company',
      name,
      avatarUrl: input.tenantLogoUrl?.trim() || input.hostAvatar?.trim() || null,
    };
  }
  return {
    kind: 'person',
    name: input.listHost?.trim() || input.hostName?.trim() || 'Host',
    avatarUrl: input.hostAvatar?.trim() || null,
  };
};
