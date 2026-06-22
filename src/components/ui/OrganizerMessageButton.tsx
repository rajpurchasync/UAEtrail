import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { messagesRouteForRole } from '../../utils/authRouting';

interface OrganizerMessageButtonProps {
  organizerUserId?: string | null;
  /** Path to return to after sign-in (defaults to current location). */
  signInReturnTo?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-[18px] h-[18px]',
};

/** Message organizer — guests are sent to sign-in first. */
export const OrganizerMessageButton = ({
  organizerUserId,
  signInReturnTo,
  size = 'sm',
  className = '',
}: OrganizerMessageButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!organizerUserId) return null;
  if (user?.id === organizerUserId) return null;

  const messagePath = user
    ? messagesRouteForRole(user.role, organizerUserId)
    : `/messages?to=${organizerUserId}`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      navigate('/signin', {
        state: { from: signInReturnTo ?? messagePath },
      });
      return;
    }
    navigate(messagePath);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={user ? 'Message organizer' : 'Sign in to message organizer'}
      title={user ? 'Message organizer' : 'Sign in to message'}
      className={`inline-flex items-center justify-center rounded-full text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition-colors shrink-0 ${sizeClasses[size]} ${className}`}
    >
      <MessageSquare className={iconSizes[size]} />
    </button>
  );
};
