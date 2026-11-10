import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from 'lucide-react';

export type WeatherCodeIconToken = {
  Icon: LucideIcon;
  iconClassName: string;
};

/** WMO weathercode → lucide icon + accent (Open-Meteo daily codes). */
export const weatherCodeIconToken = (code: number | null): WeatherCodeIconToken => {
  if (code == null || Number.isNaN(code)) {
    return { Icon: CloudSun, iconClassName: 'text-sky-400' };
  }
  if (code === 0) return { Icon: Sun, iconClassName: 'text-amber-500 dark:text-amber-400' };
  if (code <= 2) return { Icon: CloudSun, iconClassName: 'text-amber-500 dark:text-amber-300' };
  if (code === 3) return { Icon: Cloud, iconClassName: 'text-sky-600 dark:text-sky-300' };
  if (code <= 48) return { Icon: CloudFog, iconClassName: 'text-neutral-500 dark:text-neutral-400' };
  if (code <= 57) return { Icon: CloudRain, iconClassName: 'text-sky-600 dark:text-sky-300' };
  if (code <= 67) return { Icon: CloudRain, iconClassName: 'text-sky-700 dark:text-sky-400' };
  if (code <= 77) return { Icon: CloudSnow, iconClassName: 'text-sky-500 dark:text-sky-200' };
  if (code <= 82) return { Icon: CloudRain, iconClassName: 'text-indigo-600 dark:text-indigo-300' };
  if (code <= 86) return { Icon: CloudSnow, iconClassName: 'text-sky-500 dark:text-sky-200' };
  if (code <= 99) return { Icon: CloudLightning, iconClassName: 'text-violet-600 dark:text-violet-300' };
  return { Icon: CloudSun, iconClassName: 'text-sky-600 dark:text-sky-300' };
};

/** Shorter, friendlier labels for chip subtitles. */
export const openMeteoWeatherCodeChipLabel = (code: number | null): string => {
  if (code == null || Number.isNaN(code)) return 'Conditions';
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Storm';
  return 'Mixed';
};

export const formatChipPrimaryTemp = (tempMaxC: number | null, tempMinC: number | null): string | null => {
  if (tempMaxC != null && !Number.isNaN(tempMaxC)) return `${Math.round(tempMaxC)}°C`;
  if (tempMinC != null && !Number.isNaN(tempMinC)) return `${Math.round(tempMinC)}°C`;
  return null;
};
