import { ApiError } from '../lib/api-error.js';
import { findTenantActivityBasic } from '../lib/activities-store.js';
import { listActivityParticipantsWithUsers } from '../lib/activity-engagement-store.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import {
  hostVisibleMedicalSafety,
  medicalSafetyFieldsFromAuthProfile,
} from '../lib/member-medical-safety-profile.js';
import { hostJoinProfileSnippetForActivity } from '../lib/host-join-profile-snippet.js';
import { activityTimingHasEnded, mapHostParticipantToDto } from '../lib/participant-roster-dto.js';

export const loadTenantActivityParticipantRoster = async (tenantId: string, activityId: string) => {
  const activity = await findTenantActivityBasic(activityId, tenantId);
  if (!activity) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const eventDoc = await findActivityDocInMongo(activityId);
  const activityEnded = eventDoc
    ? activityTimingHasEnded(eventDoc.startAt, eventDoc.endAt ?? null)
    : false;
  const activityDisclosure = {
    requirements: eventDoc?.requirements ?? [],
    audience: eventDoc?.audience ?? null,
  };

  const participants = await listActivityParticipantsWithUsers(activityId);

  return {
    activityId,
    activityTitle: activity.title,
    capacity: activity.capacity,
    activityEnded,
    participants: participants.map((p) =>
      mapHostParticipantToDto(
        p,
        {
          displayName: p.user.profile?.displayName ?? p.user.email,
          email: p.user.email,
          phone: p.user.profile?.phone ?? null,
          avatarUrl: p.user.profile?.avatarUrl ?? null,
          medicalSafety: hostVisibleMedicalSafety(
            medicalSafetyFieldsFromAuthProfile(p.user.profile)
          ),
          joinProfile: hostJoinProfileSnippetForActivity(
            {
              dateOfBirth: (p.user.profile as { dateOfBirth?: string | null } | null)?.dateOfBirth ?? null,
              gender: (p.user.profile as { gender?: 'male' | 'female' | 'prefer_not_to_say' | null } | null)
                ?.gender ?? null,
            },
            activityDisclosure
          ),
        },
        activityEnded
      )
    ),
  };
};
