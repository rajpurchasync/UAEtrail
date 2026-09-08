export type ProfileCompletionItem = {
  key: string;
  label: string;
  done: boolean;
  action: 'edit' | 'avatar';
};

export const buildProfileCompletion = (input: {
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
}): { items: ProfileCompletionItem[]; percent: number } => {
  const items: ProfileCompletionItem[] = [
    {
      key: 'name',
      label: 'Add your display name',
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
