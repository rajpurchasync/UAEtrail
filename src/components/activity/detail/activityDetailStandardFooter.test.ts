import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_CTA_MESSAGE_HOST,
  ACTIVITY_CTA_OPEN_CHAT,
  ACTIVITY_PEEK_MANAGE_LABEL,
} from '../../../content/activityParticipationCopy';
import { ACTIVITY_DETAIL_TAB_FOOTER_SHARE_OUTING } from '../../../content/activityDetailCopy';
import { resolveActivityDetailStandardFooter } from './activityDetailFooterSlots';

const open = { kind: 'open' as const };

describe('resolveActivityDetailStandardFooter', () => {
  it('uses the same not-going pair on every outing', () => {
    const footer = resolveActivityDetailStandardFooter({
      isHost: false,
      joinUiState: open,
      joinLabel: "I'm going",
    });
    expect(footer.mode).toBe('open');
    expect(footer.left.label).toBe("I'm going");
    expect(footer.left.action).toBe('request_join');
    expect(footer.right.label).toBe(ACTIVITY_CTA_MESSAGE_HOST);
    expect(footer.right.action).toBe('message_host');
  });

  it('keeps Invite and Cancel beside Message host when pending', () => {
    const footer = resolveActivityDetailStandardFooter({
      isHost: false,
      joinUiState: { kind: 'pending', requestId: 'r1', status: 'pending' },
      joinLabel: 'Request to join',
      canManageParticipation: true,
    });
    expect(footer.mode).toBe('pending');
    expect(footer.left.action).toBe('participant_invite');
    expect(footer.center?.action).toBe('participant_withdraw');
    expect(footer.right.label).toBe(ACTIVITY_CTA_MESSAGE_HOST);
  });

  it('uses Open chat, Invite friends, and Withdraw when you are going', () => {
    const footer = resolveActivityDetailStandardFooter({
      isHost: false,
      joinUiState: { kind: 'confirmed', requestId: 'r1' },
      joinLabel: "I'm going",
      canManageParticipation: true,
      viewerLevel: 'participant',
    });
    expect(footer.mode).toBe('joined');
    expect(footer.left.label).toBe(ACTIVITY_CTA_OPEN_CHAT);
    expect(footer.center?.label).toBe('Invite Friends');
    expect(footer.center?.action).toBe('participant_invite');
    expect(footer.right.action).toBe('participant_withdraw');
  });

  it('uses Share outing and Manage for the host on every outing', () => {
    const footer = resolveActivityDetailStandardFooter({
      isHost: true,
      joinUiState: open,
      joinLabel: "I'm going",
      viewerLevel: 'host',
    });
    expect(footer.mode).toBe('host');
    expect(footer.left.label).toBe(ACTIVITY_DETAIL_TAB_FOOTER_SHARE_OUTING);
    expect(footer.right.label).toBe(ACTIVITY_PEEK_MANAGE_LABEL);
  });

  it('does not treat invite-only join_request as a pending request', () => {
    const footer = resolveActivityDetailStandardFooter({
      isHost: false,
      joinUiState: open,
      joinLabel: 'Request to join',
      viewerLevel: 'join_request',
    });
    expect(footer.mode).toBe('open');
    expect(footer.left.action).toBe('request_join');
  });

  it('does not change the pair when the outing is full', () => {
    const footer = resolveActivityDetailStandardFooter({
      isHost: false,
      joinUiState: open,
      joinLabel: 'Request to join',
      joinFull: true,
    });
    expect(footer.left.label).toBe('Request to join');
    expect(footer.left.disabled).toBe(true);
    expect(footer.right.label).toBe(ACTIVITY_CTA_MESSAGE_HOST);
  });
});
