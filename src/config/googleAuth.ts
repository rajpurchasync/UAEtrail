/** Google OAuth client id — kept out of the Sign-in button module so `/` does not parse GoogleLogin. */
export const getGoogleClientId = (): string =>
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? '';

export const isGoogleAuthEnabled = (): boolean => Boolean(getGoogleClientId());
