import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { MAP_CONFIG, readExploreMapStyle, EXPLORE_MAP_STYLE_STORAGE_KEY, type ExploreMapStyle } from '../../config/platform';
import { useExploreDeviceLocation } from '../../hooks/useExploreDeviceLocation';
import { shouldOpenExploreLocationPromptFromWelcome } from '../exploreWelcomeNavigation';

type UseExploreMapViewportArgs = {
  user: { id: string } | null | undefined;
  locationState: unknown;
  pathname: string;
  search: string;
  navigate: NavigateFunction;
};

export const useExploreMapViewport = ({
  user,
  locationState,
  pathname,
  search,
  navigate,
}: UseExploreMapViewportArgs) => {
  const [recenterTo, setRecenterTo] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [exploreMapStyle, setExploreMapStyle] = useState<ExploreMapStyle>(() => readExploreMapStyle());
  const mapCenteredRef = useRef(false);

  const {
    deviceFix,
    pending: locatingDevice,
    enableDeviceLocation,
    dismissLocationPrompt,
    requestDeviceLocation,
  } = useExploreDeviceLocation();

  const toggleExploreMapStyle = useCallback(() => {
    setExploreMapStyle((current) => {
      const next: ExploreMapStyle = current === 'satellite' ? 'map' : 'satellite';
      try {
        window.localStorage.setItem(EXPLORE_MAP_STYLE_STORAGE_KEY, next);
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }, []);

  const handleFocusMapLocation = useCallback((coords: { lat: number; lng: number }) => {
    setRecenterTo(null);
    window.requestAnimationFrame(() => {
      setRecenterTo(coords);
    });
  }, []);

  const exploreMapCenter = useMemo(() => {
    if (deviceFix) return deviceFix;
    return MAP_CONFIG.exploreDefaultCenter;
  }, [deviceFix]);

  useEffect(() => {
    if (mapCenteredRef.current) return;
    mapCenteredRef.current = true;
    handleFocusMapLocation(exploreMapCenter);
  }, [exploreMapCenter, handleFocusMapLocation]);

  useEffect(() => {
    if (user && shouldOpenExploreLocationPromptFromWelcome(locationState)) {
      setLocationPromptOpen(true);
      navigate({ pathname, search }, { replace: true, state: null });
    }
  }, [user, locationState, navigate, pathname, search]);

  const handleAllowMapLocation = () => {
    void enableDeviceLocation().then((fix) => {
      setLocationPromptOpen(false);
      if (fix) handleFocusMapLocation(fix);
    });
  };

  const handleLocateMe = () => {
    void requestDeviceLocation().then((fix) => {
      if (fix) handleFocusMapLocation(fix);
    });
  };

  const dismissLocationPromptUi = () => {
    dismissLocationPrompt();
    setLocationPromptOpen(false);
  };

  return {
    recenterTo,
    exploreMapStyle,
    toggleExploreMapStyle,
    exploreMapCenter,
    handleFocusMapLocation,
    locationPromptOpen,
    locatingDevice,
    handleAllowMapLocation,
    handleLocateMe,
    dismissLocationPromptUi,
  };
};
