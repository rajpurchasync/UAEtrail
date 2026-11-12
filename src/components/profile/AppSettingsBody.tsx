import { Check } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { DesktopSettingsSectionId } from '../../config/desktopSettings';
import { ANDROID_INSTALL_SETTINGS_HASH, IOS_INSTALL_SETTINGS_HASH } from '../../config/phoneAppInstall';
import { usePhoneAppInstall } from '../../hooks/usePhoneAppInstall';
import { useMinWidthLg } from '../../hooks/useMinWidthLg';
import { ConsumerDetailSection } from '../../detail/shell/ConsumerDetailSection';
import type { ConsumerDetailSectionTone } from '../../detail/shell/consumerDetailSectionTones';
import { AccountSignOutButton } from '../account';
import { AndroidInstallSettingsSection } from '../pwa/AndroidInstallSettingsSection';
import { IosInstallSettingsSection } from '../pwa/IosInstallSettingsSection';
import { SettingsContentGroup } from '../settings/SettingsMenuRow';
import { DisplayPreferencesSection } from './DisplayPreferencesSection';
import { ProfileAccountSettingsSections } from './ProfileAccountSettingsSections';
import { ProfileFieldPrivacySection } from './ProfileFieldPrivacySection';
import { ProfileMapPresenceSection } from './ProfileMapPresenceSection';
import { ProfileSafetyForm } from './ProfileSafetyForm';
import { ProfileVerificationDocs } from './ProfileVerificationDocs';
import { ProfileVisibilitySection } from './ProfileVisibilitySection';
import { AppSettingsHubIndex } from './AppSettingsHubIndex';

const GuestBlock = ({ children, mobile }: { children: string; mobile?: boolean }) => (
  <p
    className={
      mobile
        ? 'text-sm leading-relaxed text-neutral-600'
        : 'rounded-xl border border-neutral-200/80 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-400'
    }
  >
    {children}
  </p>
);

const SettingsSection = ({
  mobile,
  title,
  tone,
  children,
}: {
  mobile: boolean;
  title: string;
  tone: ConsumerDetailSectionTone;
  children: ReactNode;
}) =>
  mobile ? (
    <SettingsContentGroup title={title}>{children}</SettingsContentGroup>
  ) : (
    <ConsumerDetailSection title={title} tone={tone} collapsible={false} defaultExpanded>
      {children}
    </ConsumerDetailSection>
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
  const mobile = !useMinWidthLg();

  if (!section) {
    return <AppSettingsHubIndex />;
  }
  const showIosInstall =
    !isNativeShell && !installed && (platform === 'ios' || hash === IOS_INSTALL_SETTINGS_HASH);
  const showAndroidInstall =
    !isNativeShell && !installed && (platform === 'android' || hash === ANDROID_INSTALL_SETTINGS_HASH);
  const showInstallSection = showIosInstall || showAndroidInstall;

  return (
    <div className={`pb-nav-safe ${mobile ? 'space-y-4' : 'space-y-3 pb-2 lg:space-y-4 lg:pb-10'}`}>
      {section === 'display' ? (
        <>
          <SettingsSection mobile={mobile} title="Display" tone="slate">
            <DisplayPreferencesSection compact />
          </SettingsSection>
          {showInstallSection ? (
            <SettingsSection mobile={mobile} title="Install app" tone="sky">
              <div className="space-y-3">
                {showIosInstall ? <IosInstallSettingsSection embedded /> : null}
                {showAndroidInstall ? <AndroidInstallSettingsSection embedded /> : null}
              </div>
            </SettingsSection>
          ) : null}
          <p className="px-1 text-xs text-neutral-500 dark:text-neutral-400">
            Date of birth is set when you join and cannot be changed here. Update name, location, and speaks from Edit
            profile on your profile hub.
          </p>
        </>
      ) : null}

      {section === 'account' ? (
        <SettingsSection mobile={mobile} title="Account" tone="emerald">
          {guest ? (
            <GuestBlock mobile={mobile}>Log in to change email, password, and sign-out options.</GuestBlock>
          ) : (
            <div className="space-y-3">
              <ProfileAccountSettingsSections
                embedded
                flush={mobile}
                email={user.email ?? ''}
                onEmailChanged={() => void refreshUser()}
                onDeleted={() => void signOut()}
              />
              <AccountSignOutButton onSignOut={() => void signOut()} />
            </div>
          )}
        </SettingsSection>
      ) : null}

      {section === 'privacy' ? (
        guest ? (
          <SettingsSection mobile={mobile} title="Privacy" tone="violet">
            <GuestBlock mobile={mobile}>Log in to control profile visibility and map presence.</GuestBlock>
          </SettingsSection>
        ) : (
          <>
            <SettingsSection mobile={mobile} title="Profile visibility" tone="violet">
              <ProfileVisibilitySection embedded />
            </SettingsSection>
            <SettingsSection mobile={mobile} title="Field visibility" tone="violet">
              <ProfileFieldPrivacySection embedded />
            </SettingsSection>
            <SettingsSection mobile={mobile} title="Publishing profiles" tone="indigo">
              <ProfileMapPresenceSection embedded />
            </SettingsSection>
          </>
        )
      ) : null}

      {section === 'safety' ? (
        <SettingsSection mobile={mobile} title="Safety & emergency" tone="rose">
          {guest ? (
            <GuestBlock mobile={mobile}>Log in to save medical notes and an emergency contact.</GuestBlock>
          ) : (
            <div className="space-y-3">
              {safetySaved ? (
                <p
                  role="status"
                  className={
                    mobile
                      ? 'flex items-center gap-2 text-sm font-medium text-emerald-800'
                      : 'flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800'
                  }
                >
                  <Check className="h-4 w-4" aria-hidden />
                  Safety profile saved.
                </p>
              ) : null}
              <ProfileSafetyForm
                embedded
                flush={mobile}
                className="space-y-3"
                onSaved={() => setSafetySaved(true)}
              />
              <ProfileVerificationDocs embedded flush={mobile} />
            </div>
          )}
        </SettingsSection>
      ) : null}
    </div>
  );
};
