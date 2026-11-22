import {
  UserPlus,
  Users,
  UsersRound,
  UserCheck,
} from 'lucide-react';
import {
  GROUPS_PATH,
  socialFollowingPath,
  socialFriendsPath,
  socialRequestsPath,
} from '../../config/routingCatalog';
import {
  PRODUCT_FRIENDS_SURFACE_LABEL,
  PRODUCT_GROUPS_SURFACE_LABEL,
  PRODUCT_MY_CREW_SURFACE_TITLE,
} from '../../content/productNorthStar';
import { mobileBackNavState } from '../../utils/mobileBackNav';
import { SettingsMenuGroup, SettingsMenuRow } from '../settings/SettingsMenuRow';
import { BUDDIES_PATH } from '../../config/surfacePaths';

/** Back state when opening Social child screens from the hub. */
export const socialHubBackState = () =>
  mobileBackNavState(BUDDIES_PATH, PRODUCT_MY_CREW_SURFACE_TITLE);

type SocialHubIndexProps = {
  /** Pending friend requests — shown as a badge on Friend requests. */
  requestCount?: number;
};

/**
 * My Crews landing — Settings-style menu only (no tab bars).
 * Child screens: Friends, Requests, Following, Groups.
 */
export const SocialHubIndex = ({ requestCount = 0 }: SocialHubIndexProps) => {
  const back = socialHubBackState();

  return (
    <div className="space-y-4">
      <SettingsMenuGroup>
        <SettingsMenuRow
          label={PRODUCT_FRIENDS_SURFACE_LABEL}
          subtitle="People you're connected with"
          to={socialFriendsPath()}
          linkState={back}
          icon={Users}
        />
        <SettingsMenuRow
          label="Friend requests"
          subtitle="Incoming and sent"
          to={socialRequestsPath()}
          linkState={back}
          icon={UserPlus}
          badge={requestCount > 0 ? requestCount : undefined}
        />
        <SettingsMenuRow
          label="Following"
          subtitle="Hosts you follow for new outings"
          to={socialFollowingPath()}
          linkState={back}
          icon={UserCheck}
        />
        <SettingsMenuRow
          label={PRODUCT_GROUPS_SURFACE_LABEL}
          subtitle="Communities + family & friends teams"
          to={GROUPS_PATH}
          linkState={back}
          icon={UsersRound}
        />
      </SettingsMenuGroup>
    </div>
  );
};