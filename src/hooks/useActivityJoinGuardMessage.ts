import { useMemo } from 'react';
import { useViewerProfileGender } from './useViewerProfileGender';
import { useMemberStatus } from './useMemberStatus';
import { womenOnlyJoinMessageForActivity } from '../utils/activityWomenOnlyJoin';
import { medicalSafetyJoinGuardMessage } from '../utils/medicalSafetyJoinGate';

/** Women-only + medical safety gates before opening join / RSVP. */
export const useActivityJoinGuardMessage = (
  requirements: string[] | null | undefined,
  userId: string | null | undefined
): string | null => {
  const viewerGender = useViewerProfileGender(userId ?? undefined);
  const { medicalSafetyProfileComplete } = useMemberStatus();
  return useMemo(() => {
    const womenOnly = womenOnlyJoinMessageForActivity(requirements, viewerGender);
    if (womenOnly) return womenOnly;
    return medicalSafetyJoinGuardMessage(medicalSafetyProfileComplete);
  }, [requirements, viewerGender, medicalSafetyProfileComplete]);
};
