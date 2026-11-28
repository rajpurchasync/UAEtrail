import type { PlaceLocality } from './place-search.js';

/** Human label at forecast coordinates (community / city — not outing marketing title). */
export const formatWeatherForecastLocationName = (locality: PlaceLocality | null): string | null => {
  if (!locality) return null;
  const parts: string[] = [];
  const push = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    if (parts.some((p) => p.toLowerCase() === trimmed.toLowerCase())) return;
    parts.push(trimmed);
  };
  push(locality.community);
  push(locality.city);
  return parts[0] ?? null;
};
