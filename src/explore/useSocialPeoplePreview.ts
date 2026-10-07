import { useCallback, useEffect, useState } from 'react';
import type { SocialPeoplePreviewDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const useSocialPeoplePreview = (enabled: boolean) => {
  const [preview, setPreview] = useState<SocialPeoplePreviewDTO | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setPreview(null);
      return;
    }
    try {
      const response = await api.getSocialPeoplePreview();
      setPreview(response.data);
    } catch {
      setPreview(null);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { preview, refresh };
};
