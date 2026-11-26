import { useCallback, useState } from 'react';
import {
  getExploreMapLocationPreference,
  saveExploreMapLocationPreference,
} from '../explore/exploreMapLocationPreference';
import { writeStoredViewerFix } from '../discovery/discoverySessionListHooks';

export type DeviceLocationFix = { lat: number; lng: number };

export const useExploreDeviceLocation = () => {
  const [fix, setFix] = useState<DeviceLocationFix | null>(() => {
    const pref = getExploreMapLocationPreference();
    if (pref.useDeviceLocation && pref.lastLat != null && pref.lastLng != null) {
      return { lat: pref.lastLat, lng: pref.lastLng };
    }
    return null;
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestDeviceLocation = useCallback((): Promise<DeviceLocationFix | null> => {
    if (!navigator.geolocation) {
      setError('Location is not available on this device.');
      return Promise.resolve(null);
    }

    setPending(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next = { lat: position.coords.latitude, lng: position.coords.longitude };
          setFix(next);
          saveExploreMapLocationPreference({
            useDeviceLocation: true,
            lastLat: next.lat,
            lastLng: next.lng,
          });
          writeStoredViewerFix(next.lat, next.lng);
          setPending(false);
          resolve(next);
        },
        () => {
          setError('Could not get your location.');
          setPending(false);
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 }
      );
    });
  }, []);

  const dismissLocationPrompt = useCallback(() => {
    saveExploreMapLocationPreference({ promptDismissed: true });
  }, []);

  const enableDeviceLocation = useCallback(async () => {
    saveExploreMapLocationPreference({ promptDismissed: true });
    return requestDeviceLocation();
  }, [requestDeviceLocation]);

  return {
    deviceFix: fix,
    pending,
    error,
    requestDeviceLocation,
    enableDeviceLocation,
    dismissLocationPrompt,
  };
};
