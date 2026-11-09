import type {
  ActivityDetailDTO,
  ActivityParticipationDTO,
  ActivityPresentationDTO,
  ActivityViewerAccessDTO,
  MyActivityRequestDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';
import { getStoredSession, USER_STORAGE_KEY } from '../api/client';

export type PublicActivityDetailPayload = {
  activity: ActivityDetailDTO;
  viewerAccess: ActivityViewerAccessDTO | null;
  presentation: ActivityPresentationDTO | null;
  participation: ActivityParticipationDTO | null;
  myRequest: MyActivityRequestDTO | null;
};

/**
 * @param viewerUserId When set (from `useAuth`), load member overlay; when `null`, guest shell only.
 *   Do not use `getStoredSession()` alone — it can disagree with React auth and paint full detail for guests.
 */
export const fetchPublicActivityDetail = async (
  activityId: string,
  viewerUserId?: string | null
): Promise<PublicActivityDetailPayload> => {
  const shell = await api.getPublicActivityDetail(activityId);
  const storedUserId = (): string | null => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { id?: string };
      return typeof parsed.id === 'string' ? parsed.id : null;
    } catch {
      return null;
    }
  };
  const resolvedViewerId =
    viewerUserId !== undefined
      ? viewerUserId
      : getStoredSession()
        ? storedUserId()
        : null;
  const me = resolvedViewerId
    ? await api.getPublicActivityMeState(activityId).catch(() => null)
    : null;
  const res = me ?? shell;
  return {
    activity: res.data,
    viewerAccess: res.viewerAccess ?? shell.viewerAccess ?? null,
    presentation: res.presentation ?? null,
    participation: res.data.myParticipation ?? null,
    myRequest: res.data.myRequest ?? null,
  };
};
