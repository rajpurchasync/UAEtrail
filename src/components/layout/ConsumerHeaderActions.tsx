import { useAuth } from '../../context/AuthContext';
import { MobileMenuButton, type MobileMenuTone } from './MobileMenu';
import { ConsumerHubIconActions } from './ConsumerHubIconActions';
import { NotificationBellPopover } from './NotificationBellPopover';

type ConsumerHeaderActionsProps = {
  tone?: MobileMenuTone;
  className?: string;
  /** Bell styling — tab header vs desktop bar. */
  notificationVariant?: 'tab' | 'desktop';
  showOnDesktop?: boolean;
  /** Extra classes for the hamburger (e.g. `md:hidden` where the account menu takes over). */
  menuClassName?: string;
};

/** Chat · calendar · notifications + hamburger for consumer chrome. */
export const ConsumerHeaderActions = ({
  tone = 'default',
  className = '',
  notificationVariant = 'tab',
  showOnDesktop = true,
  menuClassName = '',
}: ConsumerHeaderActionsProps) => {
  const { user } = useAuth();

  return (
    <div className={`flex shrink-0 items-center gap-0.5 ${className}`}>
      {user ? (
        <ConsumerHubIconActions tone={tone} notificationVariant={notificationVariant} />
      ) : (
        <NotificationBellPopover triggerVariant={notificationVariant} tone={tone} />
      )}
      <MobileMenuButton tone={tone} showOnDesktop={showOnDesktop} className={menuClassName} />
    </div>
  );
};
