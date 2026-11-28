import type { ViewerFix } from './placeDistance';

export type ViewerGeolocationFailure = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

export type ViewerGeolocationResult =
  | { ok: true; fix: ViewerFix }
  | { ok: false; code: ViewerGeolocationFailure };

const attempt = (options: PositionOptions): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

const mapGeoError = (error: GeolocationPositionError): ViewerGeolocationFailure => {
  if (error.code === error.PERMISSION_DENIED) return 'denied';
  if (error.code === error.TIMEOUT) return 'timeout';
  return 'unavailable';
};

let inFlight: Promise<ViewerGeolocationResult> | null = null;

/** Desktop browsers only show the allow prompt after a user gesture — check state when available. */
export const readGeolocationPermission = async (): Promise<PermissionState | 'unknown'> => {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) return 'unknown';
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    return 'unknown';
  }
};

/**
 * Call only from a click/tap handler — not on page load (desktop Chrome blocks silent prompts).
 * One device read at a time — avoids parallel getCurrentPosition failures.
 */
export const requestViewerGeolocationFix = (): Promise<ViewerGeolocationResult> => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({ ok: false, code: 'unsupported' });
  }
  if (inFlight) return inFlight;

  inFlight = (async (): Promise<ViewerGeolocationResult> => {
    const strategies: PositionOptions[] = [
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
      { enableHighAccuracy: false, timeout: 25_000, maximumAge: 120_000 },
    ];
    let lastFailure: ViewerGeolocationFailure = 'unavailable';
    for (const options of strategies) {
      try {
        const position = await attempt(options);
        if (!Number.isFinite(position.coords.latitude) || !Number.isFinite(position.coords.longitude)) {
          lastFailure = 'unavailable';
          continue;
        }
        return {
          ok: true,
          fix: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        };
      } catch (error) {
        lastFailure = mapGeoError(error as GeolocationPositionError);
        if (lastFailure === 'denied') break;
      }
    }
    return { ok: false, code: lastFailure };
  })();

  return inFlight.finally(() => {
    inFlight = null;
  });
};