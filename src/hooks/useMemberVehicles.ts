import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpsertMemberVehicleInput } from '@uaetrail/shared-types';
import { memberVehiclesApi } from '../api/domains/memberVehicles';

export const memberVehiclesQueryKey = ['me', 'vehicles'] as const;

export const useMemberVehicles = () =>
  useQuery({
    queryKey: memberVehiclesQueryKey,
    queryFn: async () => {
      const res = await memberVehiclesApi.list();
      return res.data;
    },
    staleTime: 30_000,
  });

export const useMemberVehicleMutations = () => {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: memberVehiclesQueryKey });

  const create = useMutation({
    mutationFn: (input: UpsertMemberVehicleInput) => memberVehiclesApi.create(input).then((r) => r.data),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpsertMemberVehicleInput }) =>
      memberVehiclesApi.update(id, input).then((r) => r.data),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => memberVehiclesApi.delete(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
};
