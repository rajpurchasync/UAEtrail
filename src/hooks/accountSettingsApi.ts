import { api, type AccountDeletionInfo } from '../api/index';

export type { AccountDeletionInfo };

export const changeAccountPassword = async (input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  await api.changePassword(input);
};

export const requestAccountEmailChange = async (
  newEmail: string
): Promise<{ email: string }> => {
  const res = await api.requestEmailChange(newEmail);
  return res;
};

export const confirmAccountEmailChange = async (
  newEmail: string,
  otp: string
): Promise<void> => {
  await api.confirmEmailChange(newEmail, otp);
};

export const downloadAccountDataExport = async (): Promise<Blob> => {
  return api.downloadMyDataExport();
};

export const fetchAccountDeletionInfo = async (): Promise<AccountDeletionInfo> => {
  const res = await api.getAccountDeletionInfo();
  return res.data;
};

export const deleteMemberAccount = async (payload: {
  password?: string;
  confirmPhrase?: 'DELETE';
}): Promise<void> => {
  await api.deleteAccount(payload);
};
