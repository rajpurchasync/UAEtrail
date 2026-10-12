import { useEffect, useState } from 'react';
import type { UserGenderWire } from '@uaetrail/shared-types';
import { fetchMeProfile } from './memberProfileApi';

/** Signed-in member gender from `/me/profile` (for client-side join gates). */
export const useViewerProfileGender = (userId: string | undefined) => {
  const [gender, setGender] = useState<UserGenderWire | null>(null);

  useEffect(() => {
    if (!userId) {
      setGender(null);
      return;
    }
    void fetchMeProfile()
      .then((profile) => setGender(profile.gender ?? null))
      .catch(() => setGender(null));
  }, [userId]);

  return gender;
};
