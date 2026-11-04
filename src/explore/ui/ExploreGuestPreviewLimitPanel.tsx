import { useLocation } from 'react-router-dom';
import { GuestFeatureUnlockPanel } from './GuestFeatureUnlockPanel';

/** Search modal body when guest preview view limit is reached. */
export const ExploreGuestPreviewLimitPanel = () => {
  const location = useLocation();
  const authReturnPath = `${location.pathname}${location.search}`;

  return (
    <GuestFeatureUnlockPanel
      feature="preview-limit"
      presentation="inline"
      authReturnPath={authReturnPath}
    />
  );
};
