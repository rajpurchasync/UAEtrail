import { useQuery } from '@tanstack/react-query';
import type { AdminPlatformAlertDTO, AmenityState } from '@uaetrail/shared-types';
import {
  fetchAdminAmenityReports,
  fetchAdminPlatformAlerts,
  fetchAdminVerificationDocuments,
} from './adminAlertsClientApi';
import { adminAlertsSafetyQueryKey } from './clientQueryKeys';

export type AdminAlertsSafetyData = {
  alerts: AdminPlatformAlertDTO[];
  amenityReports: Array<{
    id: string;
    facilityId: string;
    amenityState: AmenityState;
    note?: string;
    photoUrl?: string;
    createdAt: string;
  }>;
  verificationDocuments: Array<{
    id: string;
    organizerId: string;
    docType: string;
    status: string;
    createdAt: string;
  }>;
};

export const useAdminAlertsSafetyData = () =>
  useQuery({
    queryKey: adminAlertsSafetyQueryKey,
    queryFn: async (): Promise<AdminAlertsSafetyData> => {
      const [alerts, amenityReports, verificationDocuments] = await Promise.all([
        fetchAdminPlatformAlerts(),
        fetchAdminAmenityReports(),
        fetchAdminVerificationDocuments(),
      ]);
      return { alerts, amenityReports, verificationDocuments };
    },
  });