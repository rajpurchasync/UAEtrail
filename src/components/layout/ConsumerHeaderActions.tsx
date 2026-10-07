import { useAuth } from '../../context/AuthContext';
import { MobileMenuButton, type MobileMenuTone } from './MobileMenu';
import { NotificationHeaderLink } from './NotificationHeaderLink';

type ConsumerHeaderActionsProps = {
  tone?: MobileMenuTone;
  className?: string;
  /** Bell styling — tab header vs desktop bar. */
  notificationVariant?: 'tab' | 'desktop';
  showOnDesktop?: boolean;
};

/** Hamburger menu + notifications (signed-in) for consumer chrome. */
export const ConsumerHeaderActions = ({
  tone = 'default',
  className = '',
  notificationVariant = 'tab',
  showOnDesktop = true,
}: ConsumerHeaderActionsProps) => {
  const { user } = useAuth();

  return (
    <div className={`flex shrink-0 items-center gap-0.5 ${className}`}>
      {user ? <NotificationHeaderLink variant={notificationVariant} /> : null}
      <MobileMenuButton tone={tone} showOnDesktop={showOnDesktop} />
    </div>
  );
};
