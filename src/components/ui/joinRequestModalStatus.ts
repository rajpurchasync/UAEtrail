/**
 * Join request modal lifecycle — exclusive phases.
 * Not the outing join-engagement machine (`activity-join-engagement.ts`).
 *
 * Validation errors stay on `form` so the fields remain visible.
 * Success is only after the API resolves — never while submitting.
 */

export type JoinRequestModalStatus =
  | { kind: 'form'; error: string | null }
  | { kind: 'submitting' }
  | { kind: 'success' };

export const JOIN_REQUEST_MODAL_IDLE: JoinRequestModalStatus = { kind: 'form', error: null };

export const joinRequestModalFormWithError = (message: string): JoinRequestModalStatus => ({
  kind: 'form',
  error: message,
});

export const joinRequestModalIsSubmitting = (status: JoinRequestModalStatus): boolean =>
  status.kind === 'submitting';

export const joinRequestModalShowSuccess = (status: JoinRequestModalStatus): boolean =>
  status.kind === 'success';

export const joinRequestModalFormError = (status: JoinRequestModalStatus): string | null =>
  status.kind === 'form' ? status.error : null;
