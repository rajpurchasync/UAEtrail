import { withdrawReasonLabel } from '@uaetrail/shared-types';

export const formatWithdrawReasonText = (reason: string, message?: string | null): string => {
  const label = withdrawReasonLabel(reason);
  const note = message?.trim();

  if (reason === 'other' && note) {
    return note;
  }
  if (note) {
    return `${label} — ${note}`;
  }
  return label;
};

export const buildJoinApprovedBody = (organizerNote?: string | null): string => {
  const note = organizerNote?.trim();
  if (note) {
    return `You're in — join activity chat. From the host: ${note}`;
  }
  return "You're in — join activity chat.";
};

export const buildJoinRejectedBody = (organizerNote?: string | null): string => {
  const note = organizerNote?.trim();
  if (note) {
    return `The host couldn't add you to this activity. From the host: ${note}`;
  }
  return "The host couldn't fit you on this activity this time.";
};
