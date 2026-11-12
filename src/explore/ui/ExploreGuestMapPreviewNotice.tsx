import { EXPLORE_MOBILE_MAP_CHROME } from '../../config/exploreTheme';
import { GuestCatalogPreviewBanner } from './GuestCatalogPreviewBanner';

type Props = {
  onDismiss: () => void;
};

/** Guest map catalog preview — same banner as list, positioned over the map. */
export const ExploreGuestMapPreviewNotice = ({ onDismiss }: Props) => (
  <div
    className={`pointer-events-none absolute inset-x-0 z-[3100] flex justify-center px-4 ${EXPLORE_MOBILE_MAP_CHROME.noticeTop} lg:top-[8.75rem]`}
  >
    <GuestCatalogPreviewBanner onDismiss={onDismiss} className="pointer-events-auto" />
  </div>
);
