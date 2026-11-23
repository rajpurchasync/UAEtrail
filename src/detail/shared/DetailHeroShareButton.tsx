import type { ActivityShareInput } from '../../utils/activityShare';
import { ShareButton } from '../../components/ui/ShareButton';
import type { ShareSheetSurface } from '../../content/shareSheetCopy';

type DetailHeroShareButtonProps = {
  title: string;
  text?: string;
  path?: string;
  stackAboveModals?: boolean;
  canSendFriendInvites?: boolean;
  activityShare?: ActivityShareInput | null;
  gateShareUntilSignedIn?: () => void;
  shareSurface?: ShareSheetSurface;
};

/** Icon-only share on consumer detail photo heroes — no circular bg (matches wishlist on hero). */
export const DetailHeroShareButton = ({
  stackAboveModals = true,
  ...props
}: DetailHeroShareButtonProps) => (
  <ShareButton {...props} iconOnly bare stackAboveModals={stackAboveModals} />
);
