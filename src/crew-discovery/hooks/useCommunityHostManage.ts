import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addCommunityCoAdminByHost,
  approveCommunityMemberByHost,
  fetchCommunityHostManage,
  inviteCommunityMemberByHost,
  patchCommunityStatusByHost,
  removeCommunityCoAdminByHost,
  removeCommunityMemberByHost,
} from '@/hooks/communityDiscoverClientApi';
import { useAuth } from '@/context/AuthContext';
import { communityDetailQueryKey } from '@/crew-discovery/hooks/useCommunityDiscoverDetail';
import { meCommunitiesQueryKey } from '@/crew-discovery/hooks/useMeCommunityDiscoverList';

const hostManageQueryKey = (communityId: string) =>
  ['me', 'communities', 'host-manage', communityId] as const;

export const useCommunityHostManage = (communityId: string, enabled: boolean) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: hostManageQueryKey(communityId),
    enabled: enabled && Boolean(user),
    queryFn: () => fetchCommunityHostManage(communityId),
    staleTime: 15_000,
  });
};

export const useCommunityHostActions = (communityId: string, slug: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: hostManageQueryKey(communityId) });
    void queryClient.invalidateQueries({
      queryKey: communityDetailQueryKey(slug, user?.id ?? null),
    });
    void queryClient.invalidateQueries({ queryKey: meCommunitiesQueryKey });
    void queryClient.invalidateQueries({ queryKey: ['explore', 'communities'] });
  };

  const approve = useMutation({
    mutationFn: (userId: string) => approveCommunityMemberByHost(communityId, userId),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeCommunityMemberByHost(communityId, userId),
    onSuccess: invalidate,
  });

  const invite = useMutation({
    mutationFn: (email: string) => inviteCommunityMemberByHost(communityId, { email }),
    onSuccess: invalidate,
  });

  const addCoAdmin = useMutation({
    mutationFn: (userId: string) => addCommunityCoAdminByHost(communityId, userId),
    onSuccess: invalidate,
  });

  const removeCoAdmin = useMutation({
    mutationFn: (userId: string) => removeCommunityCoAdminByHost(communityId, userId),
    onSuccess: invalidate,
  });

  const setStatus = useMutation({
    mutationFn: (status: 'active' | 'suspended') => patchCommunityStatusByHost(communityId, status),
    onSuccess: invalidate,
  });

  return { approve, remove, invite, addCoAdmin, removeCoAdmin, setStatus };
};