import { useLocation } from 'react-router-dom';
import { ANDROID_INSTALL } from '../../content/androidInstall';
import { ANDROID_INSTALL_SETTINGS_HASH } from '../../config/phoneAppInstall';
import { usePhoneAppInstall } from '../../hooks/usePhoneAppInstall';
import { SettingsMenuGroup } from '../settings/SettingsMenuRow';
import { InstallGuideCard } from './InstallGuideCard';

type AndroidInstallSettingsSectionProps = {
  embedded?: boolean;
};

export const AndroidInstallSettingsSection = ({ embedded = false }: AndroidInstallSettingsSectionProps) => {
  const { hash } = useLocation();
  const { installed, isNativeShell, platform, androidGuide, installReady, promptInstall } = usePhoneAppInstall();

  const deepLinked = hash === ANDROID_INSTALL_SETTINGS_HASH;
  const visible = !isNativeShell && !installed && (platform === 'android' || deepLinked);

  if (!visible) return null;

  const card = (
    <InstallGuideCard
      id="android-install"
      settingsHash={ANDROID_INSTALL_SETTINGS_HASH}
      headline={ANDROID_INSTALL.headline}
      body={ANDROID_INSTALL.body}
      showStepsLabel={ANDROID_INSTALL.showSteps}
      guide={androidGuide}
      accent="emerald"
      defaultStepsOpen={platform === 'android'}
      installAction={
        installReady ? (
          <button
            type="button"
            onClick={() => {
              promptInstall();
            }}
            className="mt-3 w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white active:bg-emerald-700"
          >
            {ANDROID_INSTALL.installButton}
          </button>
        ) : null
      }
    />
  );

  if (embedded) return card;

  return <SettingsMenuGroup title={ANDROID_INSTALL.sectionTitle}>{card}</SettingsMenuGroup>;
};
