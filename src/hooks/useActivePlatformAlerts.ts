import { useEffect, useState } from 'react';
import type { PublicActiveAlertDTO } from '@uaetrail/shared-types';
import { getActivePlatformAlerts } from './publicPlatformAlertsClientApi';

export const useActivePlatformAlerts = (input: {
  enabled: boolean;
  lat: number | null | undefined;
  lng: number | null | undefined;
  radiusKm?: number;
  region?: string | null;
}): PublicActiveAlertDTO[] => {
  const [alerts, setAlerts] = useState<PublicActiveAlertDTO[]>([]);
  const lat = input.lat ?? null;
  const lng = input.lng ?? null;
  const region = input.region?.trim() || null;
  const radiusKm = input.radiusKm ?? 120;

  useEffect(() => {
    if (!input.enabled || lat == null || lng == null) {
      setAlerts([]);
      return;
    }
    let cancelled = false;
    void getActivePlatformAlerts({
      lat,
      lng,
      radiusKm,
      ...(region ? { region } : {}),
    })
      .then((res) => {
        if (!cancelled) setAlerts(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setAlerts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [input.enabled, lat, lng, radiusKm, region]);

  return alerts;
};
