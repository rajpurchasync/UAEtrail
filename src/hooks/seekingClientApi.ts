import type {
  ParticipantIntentDTO,
  ParticipantIntentJoinRequestDTO,
  ParticipantIntentJoinRequestViewDTO,
  ParticipantIntentKind,
} from '@uaetrail/shared-types';
import type { QueryClient } from '@tanstack/react-query';
import { api } from '../api/index';
import { mySeekingPostsQueryKey } from './clientQueryKeys';

export const invalidateMySeekingPostsQueries = (queryClient: QueryClient): void => {
  void queryClient.invalidateQueries({ queryKey: mySeekingPostsQueryKey() });
};

export const fetchSeekingPostJoinRequests = async (
  postId: string
): Promise<ParticipantIntentJoinRequestViewDTO[]> => {
  const res = await api.listSeekingPostJoinRequests(postId);
  return res.data;
};

export const approveSeekingPostJoinRequest = async (
  postId: string,
  requestId: string
): Promise<void> => {
  await api.approveSeekingPostJoinRequest(postId, requestId);
};

export const rejectSeekingPostJoinRequest = async (
  postId: string,
  requestId: string
): Promise<void> => {
  await api.rejectSeekingPostJoinRequest(postId, requestId);
};

export type UpdateSeekingPostPayload = Partial<{
  kind: ParticipantIntentKind;
  title: string;
  date: string | null;
  time: string | null;
  preferredArea: string | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: 'general' | 'specific';
  toLatitude: number | null;
  toLongitude: number | null;
  partySize: number;
  comment: string;
}>;

export const updateSeekingPost = async (
  postId: string,
  payload: UpdateSeekingPostPayload
): Promise<void> => {
  await api.updateSeekingPost(postId, payload);
};

export const cancelSeekingPost = async (postId: string): Promise<ParticipantIntentDTO> => {
  const res = await api.cancelSeekingPost(postId);
  return res.data;
};

export type CreateSeekingPostPayload = {
  kind: ParticipantIntentKind;
  title: string;
  date?: string | null;
  time?: string | null;
  preferredArea?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationPrecision?: 'general' | 'specific';
  toLatitude?: number | null;
  toLongitude?: number | null;
  partySize: number;
  comment: string;
  areaId?: string | null;
};

export const createSeekingPost = async (
  payload: CreateSeekingPostPayload
): Promise<ParticipantIntentDTO> => {
  const res = await api.createSeekingPost(payload);
  return res.data;
};

export const createSeekingPostJoinRequest = async (
  postId: string,
  payload?: { note?: string }
): Promise<void> => {
  await api.createSeekingPostJoinRequest(postId, payload);
};

export const fetchMySeekingPostJoinRequest = async (
  postId: string
): Promise<ParticipantIntentJoinRequestDTO | null> => {
  const res = await api.getMySeekingPostJoinRequest(postId);
  return res.data ?? null;
};

export const linkSeekingPostToActivity = async (
  postId: string,
  activityId: string
): Promise<void> => {
  await api.linkSeekingPostToActivity(postId, activityId);
};
