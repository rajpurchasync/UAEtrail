/** Combined hosting hub modes — community buddy outings vs Pro/operator workspace. */
export type HostingSurfaceMode = 'community' | 'workspace';

const STORAGE_KEY = 'uaetrail.hostingSurfaceMode';

export const readStoredHostingMode = (): HostingSurfaceMode | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'community' || raw === 'workspace') return raw;
  } catch {
    /* private mode */
  }
  return null;
};

export const writeStoredHostingMode = (mode: HostingSurfaceMode): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* private mode */
  }
};
