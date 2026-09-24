const STORAGE_KEY = 'uaetrail.exploreMapLocation';

export type ExploreMapLocationPreference = {
  /** User opted in to device location for map centering. */
  useDeviceLocation: boolean;
  /** Soft prompt dismissed — do not show again until cleared. */
  promptDismissed: boolean;
  lastLat?: number;
  lastLng?: number;
  updatedAt?: number;
};

const readRaw = (): ExploreMapLocationPreference => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { useDeviceLocation: false, promptDismissed: false };
    const parsed = JSON.parse(raw) as Partial<ExploreMapLocationPreference>;
    return {
      useDeviceLocation: Boolean(parsed.useDeviceLocation),
      promptDismissed: Boolean(parsed.promptDismissed),
      lastLat: typeof parsed.lastLat === 'number' ? parsed.lastLat : undefined,
      lastLng: typeof parsed.lastLng === 'number' ? parsed.lastLng : undefined,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : undefined,
    };
  } catch {
    return { useDeviceLocation: false, promptDismissed: false };
  }
};

export const getExploreMapLocationPreference = (): ExploreMapLocationPreference => readRaw();

export const saveExploreMapLocationPreference = (
  patch: Partial<ExploreMapLocationPreference>
): ExploreMapLocationPreference => {
  const next = { ...readRaw(), ...patch, updatedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const shouldShowExploreLocationPrompt = (): boolean => {
  const pref = readRaw();
  return !pref.useDeviceLocation && !pref.promptDismissed;
};
