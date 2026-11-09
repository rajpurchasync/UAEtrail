import { ReactNode } from 'react';
import { ConsumerHeaderActions } from '../layout/ConsumerHeaderActions';
import { MobileProfileHeaderIdentity } from './MobileProfileHeaderIdentity';

type MobileConsumerIdentityBarProps = {
  /** Override leading slot (e.g. back button on profile sub-routes). */
  leading?: ReactNode;
  profileActive?: boolean;
  center?: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

/** Shared top row — avatar · name · location · trailing actions (list, explore tab, plan, chat). */
export const MobileConsumerIdentityBar = ({
  leading,
  profileActive = false,
  center,
  trailing = <ConsumerHeaderActions showOnDesktop={false} className="shrink-0" />,
  className = '',
}: MobileConsumerIdentityBarProps) => (
  <div
    data-consumer-identity-row
    className={`min-h-12 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 ${className}`.trim()}
  >
    <div className="col-start-1 min-w-0 justify-self-start">
      {leading ?? <MobileProfileHeaderIdentity activeOnProfile={profileActive} />}
    </div>

    {center ? (
      <div className="pointer-events-auto col-start-2 shrink-0 justify-self-center">{center}</div>
    ) : null}

    <div className="col-start-3 justify-self-end shrink-0">{trailing}</div>
  </div>
);
