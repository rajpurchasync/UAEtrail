import { useState } from 'react';
import { GuestCatalogPreviewBanner } from '../../explore/ui/GuestCatalogPreviewBanner';
import {
  readExploreGuestMapPreviewDismissed,
  writeExploreGuestMapPreviewDismissed,
} from '../../explore/guestMapPreviewPolicy';

type Props = {
  className?: string;
};

/** Standalone `/list` — same guest preview banner as the map. */
export const ListGuestCatalogPreviewNotice = ({ className = '' }: Props) => {
  const [dismissed, setDismissed] = useState(readExploreGuestMapPreviewDismissed);

  if (dismissed) return null;

  return (
    <GuestCatalogPreviewBanner
      className={`mx-auto ${className}`}
      onDismiss={() => {
        writeExploreGuestMapPreviewDismissed();
        setDismissed(true);
      }}
    />
  );
};
