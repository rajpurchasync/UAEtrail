import { useState } from 'react';
import {
  GuestCatalogPreviewBanner,
  readExploreGuestMapPreviewDismissed,
  writeExploreGuestMapPreviewDismissed,
} from '../../discovery/discoveryPortExploreGuestPreview';

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
