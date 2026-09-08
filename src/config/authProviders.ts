import { Capacitor } from '@capacitor/core';
import { isGoogleAuthEnabled } from '../components/auth/GoogleSignInButton';

/**
 * Google sign-in is offered on web and Android native.
 * Hidden on native iOS (App Store 4.8) — iOS v1 uses email/password only.
 */
export const isGoogleSignInOffered = (): boolean => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    return false;
  }
  return isGoogleAuthEnabled();
};
