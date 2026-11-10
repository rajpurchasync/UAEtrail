import { Bell, Monitor, ShieldCheck, User, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  MOBILE_SETTINGS_HUB_SECTIONS,
  SETTINGS_SURFACE_TITLE,
  type SettingsHubSectionId,
} from '../../config/settingsHub';
import { PROFILE_SETTINGS_PATH } from '../../config/routingCatalog';
import { mobileBackNavState } from '../../utils/mobileBackNav';
import { SettingsMenuGroup, SettingsMenuRow } from '../settings/SettingsMenuRow';

const SECTION_ICONS: Record<SettingsHubSectionId, LucideIcon> = {
  display: Monitor,
  account: User,
  privacy: Lock,
  notifications: Bell,
  safety: ShieldCheck,
};

/** Mobile `/settings` — section links only (no inline section bodies). */
export const AppSettingsHubIndex = () => {
  const { user } = useAuth();
  const guest = !user;
  const settingsChildBack = mobileBackNavState(PROFILE_SETTINGS_PATH, SETTINGS_SURFACE_TITLE);

  return (
    <div className="space-y-4 pb-nav-safe">
      <SettingsMenuGroup>
        {MOBILE_SETTINGS_HUB_SECTIONS.map((section) => {
          const needsAuth = section.requiresAuth === true;
          const disabled = guest && needsAuth;
          const subtitle =
            disabled && section.guestDescription ? section.guestDescription : section.description;
          return (
            <SettingsMenuRow
              key={section.id}
              label={section.label}
              to={disabled ? undefined : section.path}
              linkState={settingsChildBack}
              icon={SECTION_ICONS[section.id]}
              subtitle={subtitle}
              disabled={disabled}
            />
          );
        })}
      </SettingsMenuGroup>
    </div>
  );
};
