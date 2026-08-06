import { Link, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { accountRouteByRole } from '../../utils/authRouting';
import { getInitials } from '../../utils/userDisplay';

interface ProfileAvatarLinkProps {
  tone?: 'default' | 'light';
  className?: string;
}

export const ProfileAvatarLink = ({ tone = 'default', className = '' }: ProfileAvatarLinkProps) => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const baseClass =
    tone === 'light'
      ? 'text-white bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25'
      : 'text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100';

  const destination = user ? accountRouteByRole(user.role) : '/signin';

  return (
    <Link
      to={destination}
      state={user ? undefined : { from: pathname }}
      className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full transition-colors active:scale-95 overflow-hidden ${baseClass} ${className}`}
      aria-label={user ? 'Open profile' : 'Sign in'}
    >
      {user ? (
        user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="h-full w-full flex items-center justify-center font-bold text-sm">
            {getInitials(user.displayName, user.email)}
          </span>
        )
      ) : (
        <User className="w-5 h-5" strokeWidth={2.2} />
      )}
    </Link>
  );
};