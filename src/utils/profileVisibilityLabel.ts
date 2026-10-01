import type { UserProfile } from '../api/types';

export type ProfileVisibility = NonNullable<UserProfile['profileVisibility']>;

const LABELS: Record<ProfileVisibility, string> = {
  public: 'Public profile',
  group_members: 'Friends & groups',
  private: 'Private profile',
};

export const profileVisibilityLabel = (visibility: ProfileVisibility | null | undefined): string =>
  LABELS[visibility ?? 'public'];
