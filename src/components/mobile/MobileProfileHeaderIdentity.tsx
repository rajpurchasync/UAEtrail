import { User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PROFILE_PATH } from '../../config/routingCatalog';
import { resolveMemberCityLabel } from '../../constants/userProfileOptions';
import { useMeProfile } from '../../hooks/useMeProfile';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { SecureAvatar } from '../ui/SecureAvatar';

type MobileProfileHeaderIdentityProps = {
  activeOnProfile?: boolean;
};

/** Profile avatar with display name + city — compact list / discovery chrome. */
export const MobileProfileHeaderIdentity = ({ activeOnProfile = false }: MobileProfileHeaderIdentityProps) => {
  const { user } = useAuth();
  const { profile } = useMeProfile(Boolean(user));
  const { pathname, search } = useLocation();
  const { href: signInHref } = buildSignInRedirect({ pathname, search });

  if (!user) {
    return (
      <Link
        to={signInHref}
        className="flex shrink-0 items-center py-0.5 active:opacity-90"
        aria-label="Sign in or sign up"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 ring-1 ring-neutral-200/80">
          <User className="h-5 w-5 text-neutral-600" strokeWidth={2.25} aria-hidden />
        </span>
      </Link>
    );
  }

  const displayName = profile?.displayName?.trim() || user.displayName || user.email?.split('@')[0] || 'Explorer';
  const cityLabel = resolveMemberCityLabel(profile?.city);
  const locationLine = cityLabel ?? 'Add your city';

  const identityText = (
    <span className="min-w-0 text-left">
      <span className="block truncate text-base font-semibold leading-tight text-neutral-900">{displayName}</span>
      <span className="mt-0.5 block min-w-0 truncate text-[0.8125rem] font-medium text-neutral-500">{locationLine}</span>
    </span>
  );

  const avatar = (
    <SecureAvatar
      src={user.avatarUrl}
      name={displayName}
      className={`h-10 w-10 shrink-0 text-[11px] ${activeOnProfile ? 'ring-2 ring-emerald-500/80' : ''}`}
    />
  );

  if (activeOnProfile) {
    return (
      <div className="flex min-w-0 items-center gap-3 py-0.5" aria-current="page">
        {avatar}
        {identityText}
      </div>
    );
  }

  return (
    <Link to={PROFILE_PATH} className="flex min-w-0 items-center gap-3 py-0.5 active:opacity-90" aria-label="Profile">
      {avatar}
      {identityText}
    </Link>
  );
};
