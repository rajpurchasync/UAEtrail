import { useCallback } from 'react';
import { DirectionsControl } from '../../../components/ui/DirectionsControl';

const GETTING_THERE_SECTION_ID = 'activity-detail-getting-there';

type Props = {
  text: string;
  lat: number | null;
  lng: number | null;
};

/** Meet / start lines in trail facts — directions when coords exist, else jump to Getting there map. */
export const ActivityFactMeetLocation = ({ text, lat, lng }: Props) => {
  const scrollToMap = useCallback(() => {
    document.getElementById(GETTING_THERE_SECTION_ID)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  if (lat != null && lng != null) {
    return (
      <span className="inline-flex flex-col items-start gap-0.5">
        <DirectionsControl
          lat={lat}
          lng={lng}
          variant="link"
          label={text}
          linkClassName="text-left text-sm font-semibold leading-snug text-emerald-800 underline decoration-emerald-300/90 underline-offset-2 hover:text-emerald-950 lg:text-[13px]"
          showAppPickerAffordance
          showLeadingIcon={false}
        />
        <button
          type="button"
          onClick={scrollToMap}
          className="text-[11px] font-semibold text-emerald-700 hover:underline"
        >
          Show on map
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={scrollToMap}
      className="text-left text-sm font-semibold leading-snug text-emerald-800 underline decoration-emerald-300/90 underline-offset-2 hover:text-emerald-950 lg:text-[13px]"
    >
      {text}
    </button>
  );
};
