export type VerifyOtpBusyStatus =
  | { kind: 'idle' }
  | { kind: 'verifying' }
  | { kind: 'resending' };

export const VERIFY_OTP_BUSY_IDLE: VerifyOtpBusyStatus = { kind: 'idle' };

export const verifyOtpIsBusy = (status: VerifyOtpBusyStatus): boolean => status.kind !== 'idle';