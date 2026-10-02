/** Router state when opening a member profile from another surface (e.g. group chat). */
export type ProfileReturnNavState = {
  from: string;
  backLabel?: string;
};

export const profileReturnNavState = (from: string, backLabel = 'Back'): ProfileReturnNavState => ({
  from,
  backLabel,
});

export const parseProfileReturnNavState = (state: unknown): ProfileReturnNavState | null => {
  if (!state || typeof state !== 'object') return null;
  const from = (state as ProfileReturnNavState).from;
  if (typeof from !== 'string' || !from.startsWith('/')) return null;
  const backLabel = (state as ProfileReturnNavState).backLabel;
  return {
    from,
    backLabel: typeof backLabel === 'string' && backLabel.trim() ? backLabel.trim() : undefined,
  };
};
