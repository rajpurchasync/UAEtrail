import { apiRequest } from '../api/client';

export const requestPasswordReset = async (
  email: string
): Promise<{ message: string; resetToken?: string }> => {
  return apiRequest<{ message: string; resetToken?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const completePasswordReset = async (token: string, password: string): Promise<void> => {
  await apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
};
