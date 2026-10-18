import { MessageSquare, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MESSAGES_PATH, messagesToUserPath } from '../../config/routingCatalog';
import { signInPathForReturn } from '../../utils/authReturnContext';

export interface MessageMemberButtonProps {
  memberUserId?: string | null;
  /** @deprecated Use `memberUserId` (map from wire `hostUserId` at the call site). */
  hostUserId?: string | null;
  /** Optional outing context — `?activity=` on `/messages`. */
  activityId?: string | null;
  size?: 'sm' | 'md';
  className?: string;
  /** Accessible name — parent supplies context (“Message host”, “Contact shop”, …). */
  messageLabel?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-[18px] h-[18px]',
};

const buildMessagePath = (memberUserId: string, activityId?: string | null): string => {
  if (!activityId) {
    return messagesToUserPath(memberUserId);
  }
  const params = new URLSearchParams({ to: memberUserId, activity: activityId });
  return `${MESSAGES_PATH}?${params.toString()}`;
};

/** Icon control: open `/messages` DM with a member. */
export const MessageMemberButton = ({
  memberUserId,
  hostUserId,
  activityId,
  size = 'sm',
  className = '',
  messageLabel = 'Message',
}: MessageMemberButtonProps) => {
  const peerId = memberUserId ?? hostUserId;
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!peerId) return null;
  if (user?.id === peerId) return null;

  const messagePath = buildMessagePath(peerId, activityId);
  const guestLabel = `Log in to ${messageLabel.toLowerCase()}`;

  const handleGuestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(signInPathForReturn(messagePath));
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
        aria-label={guestLabel}
        title={guestLabel}
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
      aria-label={messageLabel}
      title={messageLabel}
      className={`inline-flex items-center justify-center rounded-full text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition-colors shrink-0 ${sizeClasses[size]} ${className}`}
    >
      <MessageSquare className={iconSizes[size]} />
    </button>
  );
};
