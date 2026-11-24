import type { MemberBrowseCardDTO } from '@uaetrail/shared-types';
import { USER_CITY_LABELS, type UserCity } from '../domain/user-profile.js';
import { listAuthUsers } from '../lib/auth-users-store.js';
import { normalizeProfileVisibility } from '../lib/media-access.js';
import {
  filterSubjectsVisibleInFindCrew,
  resolveCityLabelsForViewerBatch,
} from '../lib/find-crew-visibility-gate.js';

const isPublicMemberProfile = (profileVisibility: unknown): boolean => {
  const visibility = normalizeProfileVisibility(profileVisibility);
  return visibility === 'public';
};

/** Paginated directory of members with `profileVisibility: public` (Discover browse). */
export const listBrowsablePublicMembers = async (input: {
  excludeUserId: string | null;
  /** Buddies and self — never listed in Discover directory. */
  excludeUserIds?: ReadonlySet<string>;
  search?: string;
  skip: number;
  take: number;
}): Promise<MemberBrowseCardDTO[]> => {
  const exclude =
    input.excludeUserIds ??
    new Set(input.excludeUserId ? [input.excludeUserId] : undefined);
  // Over-fetch so find-crew visibility filtering still fills the page.
  const users = await listAuthUsers({
    status: 'ACTIVE',
    search: input.search?.trim() || undefined,
    profileVisibility: 'public',
    skip: input.skip,
    take: Math.max(input.take * 3, input.take + 15),
  });

  const candidates = users.filter(
    (user) => !exclude.has(user._id) && isPublicMemberProfile(user.profile?.profileVisibility)
  );
  const visibleIds = await filterSubjectsVisibleInFindCrew(candidates, input.excludeUserId ?? null);
  const visible = candidates.filter((user) => visibleIds.has(user._id)).slice(0, input.take);

  const cityByUserId = await resolveCityLabelsForViewerBatch(
    visible.map((user) => {
      const rawCity = user.profile?.city;
      const cityLabel = rawCity ? USER_CITY_LABELS[rawCity as UserCity] ?? null : null;
      return { subject: user, cityLabel };
    }),
    input.excludeUserId ?? null
  );

  return visible.map((user) => ({
    id: user._id,
    displayName: user.profile?.displayName ?? user.email.split('@')[0],
    avatarUrl: user.profile?.avatarUrl ?? null,
    city: cityByUserId.get(user._id) ?? null,
  }));
};
