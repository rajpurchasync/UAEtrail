import { findLatestHostApplicationWithApplicant } from '../lib/host-applications-store.js';

export const loadMyHostApplication = async (userId: string) => {
  const application = await findLatestHostApplicationWithApplicant(userId);
  if (!application) {
    return null;
  }

  return {
    id: application.id,
    applicantEmail: application.applicant.email,
    applicantName: application.applicant.profile?.displayName ?? application.applicant.email,
    requestedName: application.requestedName,
    requestedType: application.requestedType,
    status: application.status,
    reviewerNote: application.reviewerNote,
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
    metadata: application.metadata,
    createdAt: application.createdAt.toISOString(),
  };
};
