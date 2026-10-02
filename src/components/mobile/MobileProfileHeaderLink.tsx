import { Link, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PROFILE_PATH } from '../../config/routingCatalog';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { SecureAvatar } from '../ui/SecureAvatar';

const slotClass = 'touch-target-icon flex shrink-0 items-center justify-center justify-self-start';

/** Top-left profile avatar — matches explore map tab chrome. */
export const MobileProfileHeaderLink = ({ activeOnProfile = false }: { activeOnProfile?: boolean }) => {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const { href: signInHref } = buildSignInRedirect({ pathname, search });

  if (!user) {
    return (
      <Link to={signInHref} className={slotClass} aria-label="Sign in or sign up">
        <User className="h-6 w-6 text-gray-700" strokeWidth={2.25} />
      </Link>
    );
  }

  if (activeOnProfile) {
    return (
      <span className={slotClass} aria-current="page" aria-label="Profile">
        <SecureAvatar
          src={user.avatarUrl}
          name={user.displayName || user.email || 'Account'}
          className="h-10 w-10 text-xs ring-2 ring-emerald-500/80"
        />
      </span>
    );
  }

  return (
    <Link to={PROFILE_PATH} className={slotClass} aria-label="Profile">
      <SecureAvatar
        src={user.avatarUrl}
        name={user.displayName || user.email || 'Account'}
        className="h-10 w-10 text-xs"
      />
    </Link>
  );
};
