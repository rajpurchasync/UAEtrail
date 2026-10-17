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

/** @deprecated Use {@link invalidateMySeekingPostsQueries}. */
export const invalidateMyParticipantIntentsQueries = invalidateMySeekingPostsQueries;

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

/** @deprecated Use {@link createSeekingPost}. */
export const createParticipantIntent = createSeekingPost;

/** @deprecated Use {@link updateSeekingPost}. */
export const updateParticipantIntent = updateSeekingPost;

/** @deprecated Use {@link cancelSeekingPost}. */
export const cancelParticipantIntent = cancelSeekingPost;

/** @deprecated Use {@link fetchSeekingPostJoinRequests}. */
export const fetchParticipantIntentJoinRequests = fetchSeekingPostJoinRequests;

/** @deprecated Use {@link approveSeekingPostJoinRequest}. */
export const approveParticipantIntentJoinRequest = approveSeekingPostJoinRequest;

/** @deprecated Use {@link rejectSeekingPostJoinRequest}. */
export const rejectParticipantIntentJoinRequest = rejectSeekingPostJoinRequest;

/** @deprecated Use {@link createSeekingPostJoinRequest}. */
export const createParticipantIntentJoinRequest = createSeekingPostJoinRequest;

/** @deprecated Use {@link fetchMySeekingPostJoinRequest}. */
export const fetchMyParticipantIntentJoinRequest = fetchMySeekingPostJoinRequest;

/** @deprecated Use {@link linkSeekingPostToActivity}. */
export const linkParticipantIntentToActivity = linkSeekingPostToActivity;

/** @deprecated Use {@link UpdateSeekingPostPayload}. */
export type UpdateParticipantIntentPayload = UpdateSeekingPostPayload;

/** @deprecated Use {@link CreateSeekingPostPayload}. */
export type CreateParticipantIntentPayload = CreateSeekingPostPayload;
