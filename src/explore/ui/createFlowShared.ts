/**
 * Primitives shared across Plan hosting, Plan seeking, and Contribute wizards.
 * Import here — not from `organizeFlow.ts` (hosting-only engine).
 */

export type LocationPrecision = 'general' | 'specific';

export type TimeMode = 'flexible' | 'specific';

export type ActivityDifficulty = 'easy' | 'medium' | 'hard';

export const todayIso = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const buildDateOptions = (
  count = 14
): Array<{ iso: string; label: string; day: number }> => {
  const options: Array<{ iso: string; label: string; day: number }> = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  for (let index = 0; index < count; index += 1) {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    let label = date.toLocaleDateString('en-US', { weekday: 'short' });
    if (index === 0) label = 'Today';
    if (index === 1) label = 'Tmr';
    options.push({ iso, label, day: date.getDate() });
  }

  return options;
};

export const ACTIVITY_DIFFICULTY_OPTIONS: Array<{
  value: ActivityDifficulty;
  title: string;
  subtitle: string;
}> = [
  { value: 'easy', title: 'Easy', subtitle: 'Beginner friendly' },
  { value: 'medium', title: 'Medium', subtitle: 'For regulars' },
  { value: 'hard', title: 'Hard', subtitle: 'For professionals' },
];

export const resolveActivityDifficultyLabel = (difficulty: ActivityDifficulty): string =>
  ACTIVITY_DIFFICULTY_OPTIONS.find((option) => option.value === difficulty)?.title ?? difficulty;

/** @deprecated Use {@link resolveActivityDifficultyLabel}. */
export const resolveOrganizeDifficultyLabel = resolveActivityDifficultyLabel;
