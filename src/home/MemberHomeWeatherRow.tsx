import { Sun } from 'lucide-react';
import type { WeatherForecastResponseDTO } from '@uaetrail/shared-types';
import { useDisplayPreferences } from '../preferences/useDisplayPreferences';
import { MEMBER_HOME_CHOOSE_AREA } from './memberHomeCopy';
import { MEMBER_HOME_WEATHER_CHROME } from './memberHomeTheme';

type MemberHomeWeatherRowProps = {
  weather: WeatherForecastResponseDTO | null;
  placeLabel: string | null;
  loading?: boolean;
};

const formatTemp = (tempC: number, imperial: boolean): string => {
  if (imperial) return `${Math.round((tempC * 9) / 5 + 32)}°F`;
  return `${Math.round(tempC)}°C`;
};

export const MemberHomeWeatherRow = ({ weather, placeLabel, loading }: MemberHomeWeatherRowProps) => {
  const { units } = useDisplayPreferences();
  const temp =
    weather?.daily.tempMaxC != null
      ? formatTemp(weather.daily.tempMaxC, units === 'imperial')
      : null;
  const label = weather?.locationName?.trim() || placeLabel?.trim() || MEMBER_HOME_CHOOSE_AREA;
  const loadingPlace = loading && temp == null;

  return (
    <div className={MEMBER_HOME_WEATHER_CHROME}>
      <Sun className="h-3.5 w-3.5 shrink-0 text-amber-600/90" strokeWidth={2.2} aria-hidden />
      {temp != null ? (
        <>
          <span className="shrink-0 font-semibold text-neutral-800">{temp}</span>
          <span className="shrink-0 text-neutral-400" aria-hidden>
            ·
          </span>
          <span className="min-w-0 truncate font-medium text-neutral-500">{label}</span>
        </>
      ) : (
        <span className="min-w-0 truncate font-medium text-neutral-500">
          {loadingPlace ? `Loading weather · ${label}` : label}
        </span>
      )}
    </div>
  );
};
