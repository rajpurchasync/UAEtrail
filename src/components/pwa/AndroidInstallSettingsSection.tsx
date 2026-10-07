import { useLocation } from 'react-router-dom';
import { ANDROID_INSTALL } from '../../content/androidInstall';
import { ANDROID_INSTALL_SETTINGS_HASH } from '../../config/phoneAppInstall';
import { usePhoneAppInstall } from '../../hooks/usePhoneAppInstall';
import { SettingsMenuGroup } from '../settings/SettingsMenuRow';
import { InstallGuideCard } from './InstallGuideCard';

export const AndroidInstallSettingsSection = () => {
  const { hash } = useLocation();
  const { installed, isNativeShell, platform, androidGuide } = usePhoneAppInstall();

  const deepLinked = hash === ANDROID_INSTALL_SETTINGS_HASH;
  const visible = !isNativeShell && !installed && (platform === 'android' || deepLinked);

  if (!visible) return null;

  return (
    <SettingsMenuGroup title={ANDROID_INSTALL.sectionTitle}>
      <InstallGuideCard
        id="android-install"
        settingsHash={ANDROID_INSTALL_SETTINGS_HASH}
        headline={ANDROID_INSTALL.headline}
        body={ANDROID_INSTALL.body}
        showStepsLabel={ANDROID_INSTALL.showSteps}
        guide={androidGuide}
        accent="emerald"
        defaultStepsOpen={platform === 'android'}
      />
    </SettingsMenuGroup>
  );
};
