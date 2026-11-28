import { useCallback, useState } from 'react';
import {
  getExploreMapLocationPreference,
  saveExploreMapLocationPreference,
} from '../discovery/discoveryPortExploreMapClient';
import { writeStoredViewerFix } from '../discovery/discoveryPortListBrowseHooks';
import { requestViewerGeolocationFix } from '../list/browse/viewerGeolocation';

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
    setPending(true);
    setError(null);
    return requestViewerGeolocationFix().then((result) => {
      if (!result.ok) {
        setError('Could not get your location.');
        setPending(false);
        return null;
      }
      const next = result.fix;
      setFix(next);
      saveExploreMapLocationPreference({
        useDeviceLocation: true,
        lastLat: next.lat,
        lastLng: next.lng,
      });
      writeStoredViewerFix(next.lat, next.lng);
      setPending(false);
      return next;
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
