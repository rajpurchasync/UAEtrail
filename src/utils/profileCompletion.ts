import type { UserCountryCode, UserGender } from '../constants/userProfileOptions';

export type ProfileCompletionItem = {
  key: string;
  label: string;
  done: boolean;
  action: 'edit' | 'avatar' | 'settings';
};

export const buildProfileCompletion = (input: {
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: UserGender | null;
  countryCode?: UserCountryCode | null;
  city?: import('../constants/userProfileOptions').UserCity | null;
  languages?: string | null;
}): { items: ProfileCompletionItem[]; percent: number } => {
  const items: ProfileCompletionItem[] = [
    {
      key: 'name',
      label: 'Add your name',
      done: Boolean(input.displayName?.trim()),
      action: 'edit',
    },
    {
      key: 'photo',
      label: 'Add a profile photo',
      done: Boolean(input.avatarUrl?.trim()),
      action: 'avatar',
    },
    {
      key: 'age',
      label: 'Add your date of birth',
      done: Boolean(input.dateOfBirth?.trim()),
      action: 'edit',
    },
    {
      key: 'gender',
      label: 'Add your gender',
      done: Boolean(input.gender),
      action: 'edit',
    },
    {
      key: 'country',
      label: "Add where you're based",
      done: Boolean(input.countryCode || input.city),
      action: 'edit',
    },
    {
      key: 'languages',
      label: 'Add languages you speak',
      done: Boolean(input.languages?.trim()),
      action: 'edit',
    },
    {
      key: 'bio',
      label: 'Write a short bio',
      done: Boolean(input.bio?.trim()),
      action: 'edit',
    },
    {
      key: 'phone',
      label: 'Add your phone number',
      done: Boolean(input.phone?.trim()),
      action: 'edit',
    },
  ];

  const doneCount = items.filter((item) => item.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  return { items, percent };
};
