import { useCallback, useState } from 'react';
import { sendMemberBuddyRequest } from '../hooks/memberPeopleClientApi';

type UseMemberPersonBuddyRequestArgs = {
  onSuccess?: () => void;
};

/** Shared add-friend action for member people cards (panel + list discover). */
export const useMemberPersonBuddyRequest = ({ onSuccess }: UseMemberPersonBuddyRequestArgs = {}) => {
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const sendBuddyRequest = useCallback(
    async (userId: string) => {
      setBusyUserId(userId);
      setActionError(null);
      setNotice(null);
      try {
        await sendMemberBuddyRequest(userId);
        setNotice('Buddy request sent.');
        onSuccess?.();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Could not send request.');
      } finally {
        setBusyUserId(null);
      }
    },
    [onSuccess]
  );

  return {
    busyUserId,
    notice,
    actionError,
    sendBuddyRequest,
    clearFeedback: () => {
      setNotice(null);
      setActionError(null);
    },
  };
};
