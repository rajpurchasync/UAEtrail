import { APP_SETTINGS_SAFETY_PATH } from '../config/surfacePaths';

export const medicalSafetyJoinGuardMessage = (medicalSafetyProfileComplete: boolean): string | null => {
  if (medicalSafetyProfileComplete) return null;
  return `Add your blood group, medical conditions (or N/A), and emergency contact in App settings → Safety (${APP_SETTINGS_SAFETY_PATH}) before joining an outing.`;
};
