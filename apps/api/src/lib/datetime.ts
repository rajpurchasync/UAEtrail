/** IANA timezone and UTC offset per GCC country code. */
const COUNTRY_TIMEZONE: Record<string, { tz: string; offset: string }> = {
  AE: { tz: 'Asia/Dubai', offset: '+04:00' },
  SA: { tz: 'Asia/Riyadh', offset: '+03:00' },
  OM: { tz: 'Asia/Muscat', offset: '+04:00' },
  QA: { tz: 'Asia/Qatar', offset: '+03:00' },
  BH: { tz: 'Asia/Bahrain', offset: '+03:00' },
  KW: { tz: 'Asia/Kuwait', offset: '+03:00' }
};

const resolve = (countryCode?: string) =>
  COUNTRY_TIMEZONE[countryCode?.toUpperCase() ?? 'AE'] ?? COUNTRY_TIMEZONE.AE;

/** Parse date+time entered by organizer in local country time → UTC Date. */
export const parseLocalDateTime = (date: string, time: string, countryCode = 'AE'): Date => {
  const { offset } = resolve(countryCode);
  return new Date(`${date}T${time}:00${offset}`);
};

/** Format stored UTC instant as local date/time for API responses. */
export const formatEventLocal = (
  instant: Date,
  countryCode = 'AE'
): { date: string; time: string } => {
  const { tz } = resolve(countryCode);
  const date = instant.toLocaleDateString('en-CA', { timeZone: tz });
  const time = instant.toLocaleTimeString('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return { date, time };
};
