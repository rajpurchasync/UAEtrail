import { useCallback, useEffect, useState } from 'react';
import type { SocialPeopleSegment, SocialPeopleDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

type UseSocialPeopleArgs = {
  enabled: boolean;
  segment: SocialPeopleSegment;
};

export const useSocialPeople = ({ enabled, segment }: UseSocialPeopleArgs) => {
  const [data, setData] = useState<SocialPeopleDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.getSocialPeople(segment);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load people.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, segment]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    people: data?.people ?? [],
    loading,
    error,
    refresh,
  };
};
