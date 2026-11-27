/** Router location state for contextual mobile back chrome. */
export type MobileBackNavState = {
  from: string;
  backLabel?: string;
};

export const mobileBackNavState = (from: string, backLabel = 'Back'): MobileBackNavState => ({
  from,
  backLabel,
});