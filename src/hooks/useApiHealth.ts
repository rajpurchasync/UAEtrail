import { useQuery } from '@tanstack/react-query';

export const apiHealthQueryKey = ['api', 'health'] as const;

const probeApiReady = async (): Promise<boolean> => {
  const response = await fetch('/health/ready', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`API health check failed (${response.status})`);
  }
  return true;
};

/** Polls API readiness so the UI can warn when the backend is down. */
export const useApiHealth = () =>
  useQuery({
    queryKey: apiHealthQueryKey,
    queryFn: probeApiReady,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    retry: 1,
    staleTime: 15_000,
  });
