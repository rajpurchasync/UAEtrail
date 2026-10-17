import { countHostApplications, listHostApplicationsDetailed } from '../lib/host-applications-store.js';

export const listAdminHostApplicationsPage = async (input: { page: number; pageSize: number }) => {
  const skip = (input.page - 1) * input.pageSize;
  const [applications, total] = await Promise.all([
    listHostApplicationsDetailed({ skip, take: input.pageSize }),
    countHostApplications(),
  ]);

  return {
    total,
    items: applications.map((item) => ({
      id: item.id,
      applicantId: item.applicantId,
      applicantEmail: item.applicant.email,
      applicantName: item.applicant.profile?.displayName ?? item.applicant.email,
      requestedName: item.requestedName,
      requestedType: item.requestedType.toLowerCase(),
      requestedSlug: item.requestedSlug,
      requestedTenantId: item.requestedTenantId,
      status: item.status.toLowerCase(),
      reviewerNote: item.reviewerNote,
      reviewedAt: item.reviewedAt,
      metadata: item.metadata,
      createdAt: item.createdAt,
    })),
  };
};
