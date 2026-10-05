import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/index';
import { useAuth } from '../context/AuthContext';
import { activityGroupChatPath } from '../utils/activityGroupChatNav';

type ChatStatus = {
  groupId: string | null;
  membershipId: string | null;
  isMember: boolean;
  canLeave: boolean;
};

export const useActivityCrewChatAction = (activityId: string, groupChatId?: string | null) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.getActivityGroupChatStatus(activityId);
      setStatus(res.data);
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Could not load crew chat.');
    } finally {
      setLoading(false);
    }
  }, [activityId, user]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const joinChat = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.joinActivityGroupChat(activityId);
      setStatus(res.data);
      if (res.data.groupId) {
        navigate(activityGroupChatPath(res.data.groupId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join crew chat.');
    } finally {
      setBusy(false);
    }
  }, [activityId, navigate]);

  const openChat = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const knownGroupId = groupChatId ?? status?.groupId;
      if (status?.isMember && knownGroupId) {
        navigate(activityGroupChatPath(knownGroupId));
        return;
      }
      await joinChat();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open crew chat.');
    } finally {
      setBusy(false);
    }
  }, [groupChatId, joinChat, navigate, status?.groupId, status?.isMember]);

  const leaveChat = useCallback(async () => {
    if (!window.confirm('Leave this crew chat? You can rejoin anytime while you’re still on the outing.')) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.leaveActivityGroupChat(activityId);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not leave crew chat.');
    } finally {
      setBusy(false);
    }
  }, [activityId, loadStatus]);

  const chatAvailable = Boolean(status?.groupId || groupChatId);
  const isMember = status?.isMember ?? false;

  return {
    user,
    loading,
    busy,
    error,
    status,
    chatAvailable,
    isMember,
    openChat,
    joinChat,
    leaveChat,
    reload: loadStatus,
  };
};
