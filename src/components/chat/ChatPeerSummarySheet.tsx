import { UserRound } from 'lucide-react';
import { memberProfileLink } from '../../member/memberProfileLink';
import { profileReturnNavState } from '../../utils/profileReturnNav';
import { SecureAvatar } from '../ui/SecureAvatar';
import { ChatThreadSummarySheet } from './ChatThreadSummarySheet';

type ChatPeerSummarySheetProps = {
  open: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  chatReturnTo: string;
};

export const ChatPeerSummarySheet = ({
  open,
  onClose,
  userId,
  displayName,
  avatarUrl,
  chatReturnTo,
}: ChatPeerSummarySheetProps) => (
  <ChatThreadSummarySheet
    open={open}
    onClose={onClose}
    title={displayName}
    subtitle="Direct message"
    leading={
      <SecureAvatar src={avatarUrl} name={displayName} className="h-20 w-20 text-xl shadow-sm ring-2 ring-white" />
    }
    actions={[
      {
        label: 'View profile',
        icon: <UserRound className="h-4 w-4" aria-hidden />,
        variant: 'primary',
        to: memberProfileLink(userId),
        state: profileReturnNavState(chatReturnTo, 'Back to chat'),
      },
    ]}
  />
);
