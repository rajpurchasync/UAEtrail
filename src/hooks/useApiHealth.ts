import { useQuery } from '@tanstack/react-query';

export const apiHealthQueryKey = ['api', 'health'] as const;

const HEALTH_FRESH_MS = 60_000;
const HEALTH_OK_KEY = 'uaetrail.api-health-ok-at';

const lastHealthOkAt = (): number => {
  try {
    return Number(sessionStorage.getItem(HEALTH_OK_KEY) || 0);
  } catch {
    return 0;
  }
};

const probeApiReady = async (): Promise<boolean> => {
  if (Date.now() - lastHealthOkAt() < HEALTH_FRESH_MS) return true;
  const response = await fetch('/health/ready', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    try {
      sessionStorage.removeItem(HEALTH_OK_KEY);
    } catch {
      /* storage unavailable */
    }
    throw new Error(`API health check failed (${response.status})`);
  }
  try {
    sessionStorage.setItem(HEALTH_OK_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
  return true;
};

/** Polls API readiness so the UI can warn when the backend is down. */
export const useApiHealth = () =>
  useQuery({
    queryKey: apiHealthQueryKey,
    queryFn: probeApiReady,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
    staleTime: HEALTH_FRESH_MS,
  });
