/** Guide / community host ladder fields on `auth_users.profile` — not signup (`/welcome`). */
export type GuideProfileFields = {
  bio?: string | null;
  languages?: string | null;
  guideExperience?: string | null;
};

export const isGuideProfileComplete = (
  profile: GuideProfileFields | null | undefined
): boolean =>
  Boolean(
    profile?.bio?.trim() &&
      profile?.languages?.trim() &&
      profile?.guideExperience?.trim()
  );