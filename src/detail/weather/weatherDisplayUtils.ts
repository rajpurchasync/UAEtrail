/** Open-Meteo WMO code → short label (subset). */
export const openMeteoWeatherCodeLabel = (code: number | null): string => {
  if (code == null || Number.isNaN(code)) return 'Conditions';
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Storm';
  return 'Mixed';
};

export const formatTempRange = (minC: number | null, maxC: number | null): string | null => {
  if (minC == null && maxC == null) return null;
  if (minC != null && maxC != null) return `${Math.round(minC)}°–${Math.round(maxC)}°C`;
  const v = minC ?? maxC;
  return v != null ? `${Math.round(v)}°C` : null;
};

export const gccTodayIsoDate = (): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

/** Round coords for stable external weather deep-links (≈11 m). */
const weatherCoord = (n: number): string => n.toFixed(4);

/**
 * Full-week / multi-day forecast for a pin (Yr / Norwegian Meteorological Institute).
 * Opens in a new tab from place-detail weather headline.
 */
export const externalWeatherWeekUrl = (lat: number, lng: number): string =>
  `https://www.yr.no/en/forecast/daily-table/${weatherCoord(lat)},${weatherCoord(lng)}`;

/**
 * Day graph for a pin + ISO calendar date (`YYYY-MM-DD`).
 * Opens from each forecast day chip.
 */
export const externalWeatherDayUrl = (lat: number, lng: number, isoDate: string): string =>
  `https://www.yr.no/en/forecast/graph/${weatherCoord(lat)},${weatherCoord(lng)}/${encodeURIComponent(isoDate)}`;
