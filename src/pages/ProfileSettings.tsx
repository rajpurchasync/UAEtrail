import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setStoredSession } from '../api/client';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useParticipantHubData } from '../hooks/useParticipantHubData';
import { accountRouteByRole } from '../utils/authRouting';
import { ProfileSettingsView } from '../components/profile/ProfileSettingsView';

export const ProfileSettings = () => {
  const { user, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { profile, groups, pastTripsCount, unreadNotifications, reload } = useParticipantHubData();
  const [savedItemsCount, setSavedItemsCount] = useState(0);
  const [rewardPoints, setRewardPoints] = useState<number | null>(null);
  const [trailPointsEligible, setTrailPointsEligible] = useState(true);
  const [roleSwitching, setRoleSwitching] = useState(false);

  useEffect(() => {
    if (!user) return;
    void api.getMeFavorites().then((res) => {
      setSavedItemsCount(res.data.filter((item) => Boolean(item.locationId) || Boolean(item.productId)).length);
    }).catch(() => undefined);
    void api.getMyRewards().then((res) => {
      setRewardPoints(res.data.points);
      setTrailPointsEligible(res.data.trailPointsEligible !== false);
    }).catch(() => undefined);
  }, [user]);

  const canSwitchToVisitor =
    user?.role === 'platform_admin' ||
    user?.role === 'merchant_admin' ||
    user?.role === 'tenant_owner' ||
    user?.role === 'tenant_admin' ||
    user?.role === 'tenant_guide';
  const canSwitchBack = user?.role === 'participant' && Boolean(profile.switchedFromRole);

  const switchRole = async (target: 'participant' | 'original') => {
    setRoleSwitching(true);
    try {
      const res = await api.switchMeRole(target);
      setStoredSession(res.tokens);
      await refreshUser();
      await reload();
      navigate(accountRouteByRole(res.data.role as Parameters<typeof accountRouteByRole>[0]), { replace: true });
    } finally {
      setRoleSwitching(false);
    }
  };

  return (
    <ProfileSettingsView
      unreadNotifications={unreadNotifications}
      savedItemsCount={savedItemsCount}
      pastTripsCount={pastTripsCount}
      groupsCount={groups.length}
      rewardPoints={rewardPoints}
      trailPointsEligible={trailPointsEligible}
      canSwitchToVisitor={canSwitchToVisitor}
      canSwitchBack={canSwitchBack}
      switchedFromRole={profile.switchedFromRole}
      roleSwitching={roleSwitching}
      onSwitchRole={(target: 'participant' | 'original') => void switchRole(target)}
      onSignOut={() => void signOut()}
    />
  );
};
