import type { AdminPlatformAlertDTO, AmenityState } from '@uaetrail/shared-types';
import { adminApi } from '../api/domains/admin';

export const fetchAdminPlatformAlerts = async (): Promise<AdminPlatformAlertDTO[]> => {
  const res = await adminApi.listAdminPlatformAlerts();
  return res.data ?? [];
};

export const createAdminPlatformAlert = async (
  body: Omit<AdminPlatformAlertDTO, 'id' | 'createdAt' | 'updatedAt' | 'active'> & { active?: boolean }
) => adminApi.createAdminPlatformAlert(body);

export const expireAdminPlatformAlert = async (id: string) => adminApi.expireAdminPlatformAlert(id);

export const fetchAdminAmenityReports = async (): Promise<
  Array<{ id: string; facilityId: string; amenityState: AmenityState; note?: string; createdAt: string }>
> => {
  const res = await adminApi.listAdminAmenityReports();
  return res.data ?? [];
};

export const confirmAdminAmenityReport = async (id: string) => adminApi.confirmAdminAmenityReport(id);

export const fetchAdminVerificationDocuments = async () => {
  const res = await adminApi.listAdminVerificationDocuments();
  return res.data ?? [];
};

export const reviewAdminVerificationDocument = async (id: string, status: 'accepted' | 'rejected') =>
  adminApi.reviewAdminVerificationDocument(id, status);
