import { useState } from 'react';
import { GuestCatalogPreviewBanner } from '../../discovery/discoveryPortExploreGuest';
import {
  readExploreGuestMapPreviewDismissed,
  writeExploreGuestMapPreviewDismissed,
} from '../../discovery/discoveryPortExploreGuestWire';

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
