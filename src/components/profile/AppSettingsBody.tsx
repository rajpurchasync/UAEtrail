import { Check } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { DesktopSettingsSectionId } from '../../config/desktopSettings';
import { ANDROID_INSTALL_SETTINGS_HASH, IOS_INSTALL_SETTINGS_HASH } from '../../config/phoneAppInstall';
import { usePhoneAppInstall } from '../../hooks/usePhoneAppInstall';
import { ConsumerDetailSection } from '../../detail/shell/ConsumerDetailSection';
import { AccountSignOutButton } from '../account';
import { AndroidInstallSettingsSection } from '../pwa/AndroidInstallSettingsSection';
import { IosInstallSettingsSection } from '../pwa/IosInstallSettingsSection';
import { DisplayPreferencesSection } from './DisplayPreferencesSection';
import { ProfileAccountSettingsSections } from './ProfileAccountSettingsSections';
import { ProfileFieldPrivacySection } from './ProfileFieldPrivacySection';
import { ProfileMapPresenceSection } from './ProfileMapPresenceSection';
import { ProfileSafetyForm } from './ProfileSafetyForm';
import { ProfileVerificationDocs } from './ProfileVerificationDocs';
import { ProfileVisibilitySection } from './ProfileVisibilitySection';
import { AppSettingsHubIndex } from './AppSettingsHubIndex';

const GuestBlock = ({ children }: { children: string }) => (
  <p className="rounded-xl border border-neutral-200/80 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-400">
    {children}
  </p>
);

type AppSettingsBodyProps = {
  /** Omit on mobile hub index; set on desktop panels and mobile child routes. */
  section?: DesktopSettingsSectionId;
};

export const AppSettingsBody = ({ section }: AppSettingsBodyProps) => {
  const { user, signOut, refreshUser } = useAuth();
  const { hash } = useLocation();
  const { installed, isNativeShell, platform } = usePhoneAppInstall();
  const [safetySaved, setSafetySaved] = useState(false);
  const guest = !user;

  if (!section) {
    return <AppSettingsHubIndex />;
  }
  const showIosInstall =
    !isNativeShell && !installed && (platform === 'ios' || hash === IOS_INSTALL_SETTINGS_HASH);
  const showAndroidInstall =
    !isNativeShell && !installed && (platform === 'android' || hash === ANDROID_INSTALL_SETTINGS_HASH);
  const showInstallSection = showIosInstall || showAndroidInstall;

  return (
    <div className="space-y-3 pb-2 lg:space-y-4 lg:pb-10">
      {section === 'display' ? (
        <>
          <ConsumerDetailSection title="Display" tone="slate" collapsible={false} defaultExpanded>
            <DisplayPreferencesSection compact />
          </ConsumerDetailSection>
          {showInstallSection ? (
            <ConsumerDetailSection title="Install app" tone="sky" collapsible={false} defaultExpanded={false}>
              <div className="space-y-3">
                {showIosInstall ? <IosInstallSettingsSection embedded /> : null}
                {showAndroidInstall ? <AndroidInstallSettingsSection embedded /> : null}
              </div>
            </ConsumerDetailSection>
          ) : null}
          <p className="px-1 text-xs text-neutral-500 dark:text-neutral-400">
            Date of birth is set when you join and cannot be changed here. Update name, location, and speaks from Edit
            profile on your profile hub.
          </p>
        </>
      ) : null}

      {section === 'account' ? (
        <ConsumerDetailSection title="Account" tone="emerald" collapsible={false} defaultExpanded>
          {guest ? (
            <GuestBlock>Log in to change email, password, and sign-out options.</GuestBlock>
          ) : (
            <div className="space-y-3">
              <ProfileAccountSettingsSections
                embedded
                email={user.email ?? ''}
                onEmailChanged={() => void refreshUser()}
                onDeleted={() => void signOut()}
              />
              <AccountSignOutButton onSignOut={() => void signOut()} />
            </div>
          )}
        </ConsumerDetailSection>
      ) : null}

      {section === 'privacy' ? (
        guest ? (
          <ConsumerDetailSection title="Privacy" tone="violet" collapsible={false} defaultExpanded>
            <GuestBlock>Log in to control profile visibility and map presence.</GuestBlock>
          </ConsumerDetailSection>
        ) : (
          <>
            <ConsumerDetailSection title="Profile visibility" tone="violet" collapsible={false} defaultExpanded>
              <ProfileVisibilitySection embedded />
            </ConsumerDetailSection>
            <ConsumerDetailSection title="Field visibility" tone="violet" collapsible={false} defaultExpanded>
              <ProfileFieldPrivacySection embedded />
            </ConsumerDetailSection>
            <ConsumerDetailSection title="Publishing profiles" tone="indigo" collapsible={false} defaultExpanded>
              <ProfileMapPresenceSection embedded />
            </ConsumerDetailSection>
          </>
        )
      ) : null}

      {section === 'safety' ? (
        <ConsumerDetailSection title="Safety & emergency" tone="rose" collapsible={false} defaultExpanded>
          {guest ? (
            <GuestBlock>Log in to save medical notes and an emergency contact.</GuestBlock>
          ) : (
            <div className="space-y-3">
              {safetySaved ? (
                <p
                  role="status"
                  className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
                >
                  <Check className="h-4 w-4" aria-hidden />
                  Safety profile saved.
                </p>
              ) : null}
              <ProfileSafetyForm embedded className="space-y-3" onSaved={() => setSafetySaved(true)} />
              <ProfileVerificationDocs embedded />
            </div>
          )}
        </ConsumerDetailSection>
      ) : null}
    </div>
  );
};
