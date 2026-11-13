import type { ReactNode } from 'react';
import type { OrganisationApplication } from '../../api/types';
import { SecureAvatar } from '../ui/SecureAvatar';
import {
  AdminReviewWizardLayout,
  AdminWizardSection,
} from './AdminReviewWizardLayout';
import { formatAdminDate } from '../../utils/formatAdminDate';
import { formatPhoneDisplay } from '../../utils/phone';

type OperatorApplicationWizardProps = {
  application: OrganisationApplication;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  teamSlot?: ReactNode;
  extraActions?: ReactNode;
};

const organisationDisplayName = (app: OrganisationApplication): string =>
  app.metadata?.hostDisplayName || app.requestedName || app.applicantName || 'Applicant';

const formatApplicantPhone = (app: OrganisationApplication): string | null => {
  const meta = app.metadata;
  if (!meta) return null;
  if (meta.phoneE164) return meta.phoneE164;
  if (meta.phoneCountryCode && meta.phone) {
    return formatPhoneDisplay(meta.phoneCountryCode, meta.phone);
  }
  return meta.phone ?? null;
};

const Field = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-900">{value}</dd>
    </div>
  );
};

/** Focused operator / shop application review (detail-inspired wizard). */
export const OperatorApplicationWizard = ({
  application,
  onClose,
  onApprove,
  onReject,
  teamSlot,
  extraActions,
}: OperatorApplicationWizardProps) => {
  const pending = application.status === 'pending';
  const actions = (
    <div className="flex flex-col gap-2">
      {pending ? (
        <>
          <button
            type="button"
            onClick={onApprove}
            className="rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={onReject}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Reject
          </button>
        </>
      ) : (
        <p className="text-xs text-neutral-500">Status: {application.status}</p>
      )}
      {extraActions}
      <button type="button" onClick={onClose} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
        Close
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F4F6F5] p-4 sm:p-6">
      <AdminReviewWizardLayout
        backTo="/admin/hosts"
        backLabel="Back to operators"
        title={
          application.metadata?.hostProfileType === 'shop' ? 'Shop application' : 'Publishing application'
        }
        subtitle={`${application.requestedName} · ${application.requestedType.replace(/_/g, ' ')}`}
        jumpLinks={[
          { id: 'applicant', label: 'Applicant' },
          { id: 'profile', label: 'Profile' },
          { id: 'team', label: 'Team' },
        ]}
        aside={actions}
        footer={actions}
      >
        <AdminWizardSection id="applicant" title="Applicant">
          <div className="flex gap-4">
            <SecureAvatar
              src={application.metadata?.profilePhoto}
              name={organisationDisplayName(application)}
              className="h-16 w-16 shrink-0 border text-lg"
            />
            <div className="min-w-0">
              <p className="font-medium text-neutral-900">{organisationDisplayName(application)}</p>
              <p className="text-sm text-neutral-500">{application.applicantEmail}</p>
              {formatApplicantPhone(application) ? (
                <p className="mt-1 text-sm text-neutral-600">{formatApplicantPhone(application)}</p>
              ) : null}
              <p className="mt-2 text-xs text-neutral-400">Applied {formatAdminDate(application.createdAt)}</p>
            </div>
          </div>
        </AdminWizardSection>

        <AdminWizardSection id="profile" title="Profile details">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Display name" value={application.metadata?.hostDisplayName} />
            <Field label="Brand name" value={application.metadata?.requestedName} />
            <Field label="Bio" value={application.metadata?.bio} />
            <Field label="Website" value={application.metadata?.website} />
            <Field label="Services" value={application.metadata?.services} />
            <Field label="Shop email" value={application.metadata?.contactEmail} />
            <Field label="Languages" value={application.metadata?.languages} />
            <Field label="Based in" value={application.metadata?.residence ?? application.metadata?.region} />
            <Field label="Experience" value={application.metadata?.experience} />
            <Field
              label="Map pin"
              value={
                application.metadata?.latitude != null && application.metadata?.longitude != null
                  ? `${application.metadata.latitude}, ${application.metadata.longitude}`
                  : null
              }
            />
          </dl>
          {application.reviewerNote ? (
            <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
              Reviewer note: {application.reviewerNote}
            </p>
          ) : null}
        </AdminWizardSection>

        <AdminWizardSection id="team" title="Operator team">
          {teamSlot ?? (
            <p className="text-sm text-neutral-500">
              {application.requestedTenantId
                ? 'Loading team…'
                : 'Approve this application to manage guides and managers.'}
            </p>
          )}
        </AdminWizardSection>
      </AdminReviewWizardLayout>
    </div>
  );
};
