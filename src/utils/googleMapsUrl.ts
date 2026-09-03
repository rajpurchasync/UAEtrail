const tryCoordPair = (lat: number, lng: number): { lat: number; lng: number } | null => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
};

/** Parse latitude/longitude from common Google Maps URL formats. */
export const parseGoogleMapsUrl = (url: string): { lat?: number; lng?: number } => {
  const trimmed = url.trim();
  if (!trimmed) return {};

  // Exact place marker in shared /place/ URLs: ...!3d25.09!4d55.12...
  const placeMatch = trimmed.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (placeMatch) {
    const pair = tryCoordPair(Number(placeMatch[1]), Number(placeMatch[2]));
    if (pair) return pair;
  }

  const atMatch = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const pair = tryCoordPair(Number(atMatch[1]), Number(atMatch[2]));
    if (pair) return pair;
  }

  const paramPatterns = [
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]center=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]destination=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of paramPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const pair = tryCoordPair(Number(match[1]), Number(match[2]));
      if (pair) return pair;
    }
  }

  return {};
};

export const isGoogleMapsUrl = (value: string): boolean =>
  /google\.com\/maps|maps\.google|goo\.gl\/maps|maps\.app\.goo\.gl/i.test(value.trim());

export const normalizeMapsLinkInput = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};
