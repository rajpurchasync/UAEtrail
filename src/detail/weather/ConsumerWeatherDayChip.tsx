import type { WeatherDailySnapshotDTO } from '@uaetrail/shared-types';
import { formatExploreCalendarDateShort } from '@uaetrail/shared-types';
import {
  formatChipPrimaryTemp,
  openMeteoWeatherCodeChipLabel,
  weatherCodeIconToken,
} from './weatherCodeIcon';
import {
  WEATHER_DAY_CHIP_CONDITION,
  WEATHER_DAY_CHIP_LABEL,
  WEATHER_DAY_CHIP_META,
  WEATHER_DAY_CHIP_SHELL,
} from './weatherChipStyles';

type ChipProps = {
  date: string;
  daily: WeatherDailySnapshotDTO | null;
  unavailable?: boolean;
  isToday?: boolean;
};

const rainHint = (daily: WeatherDailySnapshotDTO | null): string | null => {
  const p = daily?.precipProbabilityMax;
  if (p == null || Number.isNaN(p) || p <= 0) return null;
  if (p >= 100) return 'Rain';
  return `${Math.round(p)}% rain`;
};

const tempSpanHint = (daily: WeatherDailySnapshotDTO): string | null => {
  const { tempMinC, tempMaxC } = daily;
  if (tempMinC == null || tempMaxC == null || Number.isNaN(tempMinC) || Number.isNaN(tempMaxC)) {
    return null;
  }
  const lo = Math.round(tempMinC);
  const hi = Math.round(tempMaxC);
  if (lo === hi) return null;
  return `${lo}–${hi}°`;
};

export const ConsumerWeatherDayChip = ({ date, daily, unavailable, isToday }: ChipProps) => {
  const dateLabel = formatExploreCalendarDateShort(date) ?? date;
  const dayLabel = isToday ? 'Today' : dateLabel;

  if (unavailable) {
    return (
      <li className={WEATHER_DAY_CHIP_SHELL} aria-label={`${dayLabel}: forecast not available`}>
        <p className={WEATHER_DAY_CHIP_LABEL}>{dayLabel}</p>
        <p className={`mt-1.5 ${WEATHER_DAY_CHIP_META}`}>Not available yet</p>
      </li>
    );
  }

  if (!daily) {
    return (
      <li className={WEATHER_DAY_CHIP_SHELL} aria-label={`${dayLabel}: no forecast`}>
        <p className={WEATHER_DAY_CHIP_LABEL}>{dayLabel}</p>
        <p className={`mt-1.5 ${WEATHER_DAY_CHIP_META}`}>No data</p>
      </li>
    );
  }

  const { Icon, iconClassName } = weatherCodeIconToken(daily.weatherCode);
  const temp = formatChipPrimaryTemp(daily.tempMaxC, daily.tempMinC);
  const condition = openMeteoWeatherCodeChipLabel(daily.weatherCode);
  const rain = rainHint(daily);
  const span = tempSpanHint(daily);
  const footnote = [rain, span].filter(Boolean).join(' · ');

  return (
    <li
      className={WEATHER_DAY_CHIP_SHELL}
      aria-label={[dayLabel, temp, condition, footnote].filter(Boolean).join(', ')}
    >
      <p className={WEATHER_DAY_CHIP_LABEL}>{dayLabel}</p>
      <div className="mt-1 flex items-center gap-1">
        <Icon className={`h-5 w-5 shrink-0 ${iconClassName}`} aria-hidden strokeWidth={2} />
        <p className="text-base font-bold leading-none tabular-nums tracking-tight text-neutral-900 dark:text-white">
          {temp ?? '—'}
        </p>
      </div>
      <p className={`${WEATHER_DAY_CHIP_CONDITION} line-clamp-2`}>{condition}</p>
      {footnote ? <p className={`mt-0.5 ${WEATHER_DAY_CHIP_META}`}>{footnote}</p> : null}
    </li>
  );
};
