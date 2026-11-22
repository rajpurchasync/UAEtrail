import { NotificationType } from '../domain/enums.js';
import { findAuthUserById } from '../lib/auth-users-store.js';
import { scheduleNotification } from './notifications.js';

export const notifyCommunityHostNewMember = async (input: {
  hostUserId: string;
  communityId: string;
  communityName: string;
  slug: string;
  memberUserId: string;
}): Promise<void> => {
  const member = await findAuthUserById(input.memberUserId);
  const who = member?.profile?.displayName?.trim() || member?.email || 'Someone';
  scheduleNotification(
    {
      userId: input.hostUserId,
      title: 'New community member',
      body: `${who} joined ${input.communityName}.`,
      type: NotificationType.SYSTEM,
      meta: {
        communityId: input.communityId,
        slug: input.slug,
        kind: 'community_member_joined',
      },
    },
    'community_host_new_member'
  );
};

export const notifyCommunityHostJoinRequest = async (input: {
  hostUserId: string;
  communityId: string;
  communityName: string;
  slug: string;
  applicantUserId: string;
}): Promise<void> => {
  const applicant = await findAuthUserById(input.applicantUserId);
  const who = applicant?.profile?.displayName?.trim() || applicant?.email || 'Someone';
  scheduleNotification(
    {
      userId: input.hostUserId,
      title: 'Community join request',
      body: `${who} asked to join ${input.communityName}. Review from your community page.`,
      type: NotificationType.SYSTEM,
      meta: {
        communityId: input.communityId,
        slug: input.slug,
        kind: 'community_join_request',
      },
    },
    'community_host_join_request'
  );
};

export const notifyCommunityMemberApproved = async (input: {
  memberUserId: string;
  communityName: string;
  slug: string;
  communityId: string;
}): Promise<void> => {
  scheduleNotification(
    {
      userId: input.memberUserId,
      title: 'You\'re in',
      body: `You were approved to join ${input.communityName}.`,
      type: NotificationType.SYSTEM,
      meta: {
        communityId: input.communityId,
        slug: input.slug,
        kind: 'community_join_approved',
      },
    },
    'community_member_approved'
  );
};