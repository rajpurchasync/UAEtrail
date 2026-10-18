import type { MemberBrowseCardDTO } from '@uaetrail/shared-types';
import { USER_CITY_LABELS, type UserCity } from '../domain/user-profile.js';
import { listAuthUsers } from '../lib/auth-users-store.js';
import { normalizeProfileVisibility } from '../lib/media-access.js';

const isPublicMemberProfile = (profileVisibility: unknown): boolean => {
  const visibility = normalizeProfileVisibility(profileVisibility);
  return visibility === 'public';
};

/** Paginated directory of members with `profileVisibility: public` (Discover browse). */
export const listBrowsablePublicMembers = async (input: {
  excludeUserId: string;
  /** Buddies and self — never listed in Discover directory. */
  excludeUserIds?: ReadonlySet<string>;
  search?: string;
  skip: number;
  take: number;
}): Promise<MemberBrowseCardDTO[]> => {
  const exclude = input.excludeUserIds ?? new Set<string>([input.excludeUserId]);
  const users = await listAuthUsers({
    status: 'ACTIVE',
    search: input.search?.trim() || undefined,
    profileVisibility: 'public',
    skip: input.skip,
    take: input.take + 5,
  });

  return users
    .filter((user) => !exclude.has(user._id) && isPublicMemberProfile(user.profile?.profileVisibility))
    .slice(0, input.take)
    .map((user) => {
      const city = user.profile?.city;
      return {
        id: user._id,
        displayName: user.profile?.displayName ?? user.email.split('@')[0],
        avatarUrl: user.profile?.avatarUrl ?? null,
        city: city ? USER_CITY_LABELS[city as UserCity] ?? null : null,
      };
    });
};
