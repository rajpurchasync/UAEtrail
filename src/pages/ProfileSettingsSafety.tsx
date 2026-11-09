import { Navigate, useNavigate } from 'react-router-dom';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { ProfileSafetyForm } from '../components/profile/ProfileSafetyForm';
import { ProfileVerificationDocs } from '../components/profile/ProfileVerificationDocs';
import { useProfileHubBackChrome } from '../hooks/useProfileHubBackChrome';
import { useMinWidthLg } from '../hooks/useMinWidthLg';
import { desktopSettingsSectionPath } from '../config/desktopSettings';
import { navigateWithBackChrome } from '../utils/mobileBackNav';

export const ProfileSettingsSafety = () => {
  const backChrome = useProfileHubBackChrome();
  const navigate = useNavigate();
  const isDesktop = useMinWidthLg();

  if (isDesktop) return <Navigate to={desktopSettingsSectionPath('safety')} replace />;

  return (
    <ConsumerShell
      layout="stack"
      title="Safety & emergency"
      showJourney={false}
      back={backChrome}
    >
      <ProfileSafetyForm onSaved={() => navigateWithBackChrome(navigate, backChrome)} />
      <ProfileVerificationDocs />
    </ConsumerShell>
  );
};
