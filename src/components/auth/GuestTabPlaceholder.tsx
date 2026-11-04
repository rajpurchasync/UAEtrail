import type { GuestBrowseGateIntent } from '../../content/guestBrowseGateCopy';
import { guestBrowseGateIntentToFeatureKey } from '../../content/guestFeatureUnlockCopy';
import { GuestGatedSurfaceLayout } from './GuestGatedSurfaceLayout';

type GuestTabPlaceholderProps = {
  title: string;
  description?: string;
  intent?: GuestBrowseGateIntent;
};

/** Signed-out tab / plan hub — feature explainer rail, not a full auth page. */
export const GuestTabPlaceholder = ({
  title,
  intent = 'peek-details',
}: GuestTabPlaceholderProps) => (
  <GuestGatedSurfaceLayout title={title} feature={guestBrowseGateIntentToFeatureKey(intent)} />
);
