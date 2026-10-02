import { Bell, KeyRound, Shield } from 'lucide-react';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { PullToRefresh } from '../mobile/PullToRefresh';
import { SettingsMenuGroup, SettingsMenuRow } from '../settings/SettingsMenuRow';
import {
  PROFILE_SETTINGS_ACCOUNT_PATH,
  PROFILE_SETTINGS_NOTIFICATIONS_PATH,
  PROFILE_SETTINGS_PRIVACY_PATH,
} from '../../config/routingCatalog';
import { ProfileWishlistSettingsLink } from './ProfileWishlistSettingsLink';

type ProfileSettingsIndexProps = {
  onRefresh?: () => Promise<void>;
};

export const ProfileSettingsIndex = ({ onRefresh }: ProfileSettingsIndexProps) => {
  const content = (
    <div className="space-y-4 pb-nav-safe animate-fade-up">
      <SettingsMenuGroup>
        <SettingsMenuRow
          label="Account"
          to={PROFILE_SETTINGS_ACCOUNT_PATH}
          icon={KeyRound}
          subtitle="Email, password, sign out"
        />
        <SettingsMenuRow
          label="Privacy"
          to={PROFILE_SETTINGS_PRIVACY_PATH}
          icon={Shield}
          subtitle="Profile visibility and host profiles"
        />
        <SettingsMenuRow
          label="Notifications"
          to={PROFILE_SETTINGS_NOTIFICATIONS_PATH}
          icon={Bell}
          subtitle="Inbox and saved-map alerts"
        />
      </SettingsMenuGroup>
      <ProfileWishlistSettingsLink />
      <p className="px-1 text-xs text-neutral-500">
        Date of birth is set when you join and cannot be changed here. Update name, location, and speaks from Edit profile
        on your profile hub.
      </p>
    </div>
  );

  return (
    <ConsumerShell layout="stack" title="Settings" showJourney={false} back={{ fallbackTo: '/profile', label: 'Profile' }}>
      {onRefresh ? <PullToRefresh onRefresh={onRefresh}>{content}</PullToRefresh> : content}
    </ConsumerShell>
  );
};
