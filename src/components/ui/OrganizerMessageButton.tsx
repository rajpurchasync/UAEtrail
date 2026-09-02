import { MessageSquare, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { messagesRouteForRole } from '../../utils/authRouting';

interface OrganizerMessageButtonProps {
  organizerUserId?: string | null;
  /** Trip/event context — enables inquiry messages before a join request exists. */
  activityId?: string | null;
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
  activityId,
  size = 'sm',
  className = '',
}: OrganizerMessageButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!organizerUserId) return null;
  if (user?.id === organizerUserId) return null;

  const messageOptions = activityId ? { activityId } : undefined;
  const messagePath = messagesRouteForRole(user?.role ?? 'visitor', organizerUserId, messageOptions);

  const handleGuestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigate('/signin', { state: { from: messagePath } });
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(messagePath);
  };

  if (!user) {
    return (
      <button
        type="button"
        onClick={handleGuestClick}
        aria-label="Sign in to message host"
        title="Sign in to message host"
        className={`inline-flex items-center justify-center rounded-full text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors shrink-0 ${sizeClasses[size]} ${className}`}
      >
        <LogIn className={iconSizes[size]} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleMessageClick}
      aria-label="Message host"
      title="Message host"
      className={`inline-flex items-center justify-center rounded-full text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition-colors shrink-0 ${sizeClasses[size]} ${className}`}
    >
      <MessageSquare className={iconSizes[size]} />
    </button>
  );
};
