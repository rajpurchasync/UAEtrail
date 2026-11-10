import { useMemo } from 'react';
import { ConsumerWeatherMultiDayBlock } from '../../detail/weather/ConsumerWeatherMultiDayBlock';
import {
  PLACE_DETAIL_FORECAST_DAYS,
  nextIsoDaysFromToday,
} from '../../detail/weather/weatherDateRange';
import { CONSUMER_DETAIL_PANEL, CONSUMER_DETAIL_SECTION_TITLE } from '../../activity/detail/templates/activityConsumerDetailSectionStyles';

type Props = {
  lat: number;
  lng: number;
  /** Defaults to the next 7 days (Asia/Dubai). */
  dates?: string[];
  /** Shown above chips — usually the place / area / facility display name. */
  forecastForName?: string;
  sectionId?: string;
  className?: string;
  /** Omit outer section + title when wrapped in `ConsumerDetailSection`. */
  embedded?: boolean;
};

/**
 * Multi-day forecast for static locations (place, area hub, venue, trail, camp, facility).
 */
export const PlaceDetailWeatherSection = ({
  lat,
  lng,
  dates,
  forecastForName,
  sectionId = 'place-detail-weather',
  className = '',
  embedded = false,
}: Props) => {
  const forecastDates = useMemo(
    () => (dates?.length ? dates : nextIsoDaysFromToday(PLACE_DETAIL_FORECAST_DAYS)),
    [dates]
  );

  const panel = (
    <div
      className={`${CONSUMER_DETAIL_PANEL.logistics} min-w-0 dark:border-sky-900/45 dark:from-sky-950/25 dark:via-neutral-900 dark:to-neutral-950`}
    >
      <ConsumerWeatherMultiDayBlock
        lat={lat}
        lng={lng}
        dates={forecastDates}
        variant="compact"
        forecastForName={forecastForName}
      />
    </div>
  );

  if (embedded) {
    return <div className={`min-w-0 ${className}`}>{panel}</div>;
  }

  return (
    <section
      id={sectionId}
      aria-label="Weather"
      className={`scroll-mt-[max(0.5rem,env(safe-area-inset-top))] ${className}`}
    >
      <h2 className={`mb-2 ${CONSUMER_DETAIL_SECTION_TITLE}`}>Weather</h2>
      {panel}
    </section>
  );
};
