import type { NotificationDTO } from '@uaetrail/shared-types';
import { withdrawReasonLabel } from '@uaetrail/shared-types';

const metaRecord = (meta: NotificationDTO['meta']): Record<string, unknown> | null =>
  meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : null;

/** Structured reason line when meta carries decision/withdrawal/admin context. */
export const notificationReasonLine = (notif: NotificationDTO): string | null => {
  const meta = metaRecord(notif.meta);
  if (!meta) return null;

  const organizerNote = typeof meta.organizerNote === 'string' ? meta.organizerNote.trim() : '';
  if (organizerNote) {
    return `From the host: ${organizerNote}`;
  }

  const cancelReason = typeof meta.cancelReason === 'string' ? meta.cancelReason : null;
  if (cancelReason) {
    const label = withdrawReasonLabel(cancelReason);
    const cancelMessage = typeof meta.cancelMessage === 'string' ? meta.cancelMessage.trim() : '';
    if (cancelReason === 'other' && cancelMessage) {
      return `Note: ${cancelMessage}`;
    }
    if (cancelMessage) {
      return `Note: ${label} — ${cancelMessage}`;
    }
    return `Note: ${label}`;
  }

  const comment = typeof meta.comment === 'string' ? meta.comment.trim() : '';
  if (comment) {
    return `Note: ${comment}`;
  }

  const reason = typeof meta.reason === 'string' ? meta.reason.trim() : '';
  if (reason) {
    return `Note: ${reason}`;
  }

  return null;
};
