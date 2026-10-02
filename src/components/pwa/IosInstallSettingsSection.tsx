import { useLocation } from 'react-router-dom';
import { IOS_INSTALL } from '../../content/iosInstall';
import { IOS_INSTALL_SETTINGS_HASH } from '../../config/phoneAppInstall';
import { usePhoneAppInstall } from '../../hooks/usePhoneAppInstall';
import { SettingsMenuGroup } from '../settings/SettingsMenuRow';
import { InstallGuideCard } from './InstallGuideCard';

export const IosInstallSettingsSection = () => {
  const { hash } = useLocation();
  const { installed, isNativeShell, platform, iosGuide } = usePhoneAppInstall();

  const deepLinked = hash === IOS_INSTALL_SETTINGS_HASH;
  const visible = !isNativeShell && !installed && (platform === 'ios' || deepLinked);

  if (!visible) return null;

  return (
    <SettingsMenuGroup title={IOS_INSTALL.sectionTitle}>
      <InstallGuideCard
        id="ios-install"
        settingsHash={IOS_INSTALL_SETTINGS_HASH}
        headline={IOS_INSTALL.headline}
        body={IOS_INSTALL.body}
        showStepsLabel={IOS_INSTALL.showSteps}
        guide={iosGuide}
        accent="sky"
        defaultStepsOpen={platform === 'ios'}
      />
    </SettingsMenuGroup>
  );
};
