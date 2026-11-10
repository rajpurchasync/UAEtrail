import type {
  ActivityDetailDTO,
  ActivityPolicyKeyDTO,
  ActivityPriceBreakdownDTO,
} from '@uaetrail/shared-types';
import { ConsumerPlanSection } from '../../../detail/shell/ConsumerPlanSection';

const paymentMethodLabel = (m: ActivityPriceBreakdownDTO['paymentMethod']): string => {
  switch (m) {
    case 'arranged_with_host':
      return 'Arranged with the host';
    case 'cash':
      return 'Cash';
    case 'bank_transfer':
      return 'Bank transfer';
    default:
      return 'As agreed with the host';
  }
};

const unitLabel = (u: ActivityPriceBreakdownDTO['unit']): string => {
  switch (u) {
    case 'person':
      return 'per person';
    case 'vehicle':
      return 'per vehicle';
    case 'group':
      return 'per group';
    case 'seat':
      return 'per seat';
    default:
      return '';
  }
};

const collectedByLabel = (c: ActivityPriceBreakdownDTO['collectedBy']): string =>
  c === 'platform' ? 'Collected by UAE Trail' : 'Collected by the host';

const presetCancellationCopy = (key: ActivityPolicyKeyDTO): string => {
  switch (key) {
    case 'flexible':
      return 'Host preset: flexible — usually full refund if you cancel with enough notice; the host handles refunds outside the app.';
    case 'moderate':
      return 'Host preset: moderate — partial refunds may apply depending on timing; the host handles refunds outside the app.';
    case 'strict':
      return 'Host preset: strict — limited or no refund close to the start; the host handles refunds outside the app.';
    default:
      return '';
  }
};

const hasPriceBreakdownContent = (p: ActivityPriceBreakdownDTO): boolean => {
  if (p.mode === 'free') return false;
  return (
    (p.amount != null && p.amount > 0) ||
    (p.includes?.length ?? 0) > 0 ||
    (p.excludes?.length ?? 0) > 0 ||
    (p.deposit != null && p.deposit > 0) ||
    Boolean(p.deadline?.trim())
  );
};

export const activityShowsCostPolicySection = (activity: ActivityDetailDTO): boolean => {
  const pb = activity.priceBreakdown;
  if (pb && hasPriceBreakdownContent(pb)) return true;
  if (activity.policyKey && activity.policyKey !== 'custom') return true;
  if (activity.customPolicy?.trim()) return true;
  if (activity.waiverRequired) return true;
  return false;
};

type Props = {
  activity: ActivityDetailDTO;
  panelClassName: string;
  consumerSection?: boolean;
};

/** Cost, payment and cancellation — plan §4 "Cost and policy". */
export const ActivityDetailCostPolicySection = ({
  activity,
  panelClassName,
  consumerSection = false,
}: Props) => {
  const pb = activity.priceBreakdown;
  const showPrice = pb && hasPriceBreakdownContent(pb);
  const showPreset =
    activity.policyKey &&
    activity.policyKey !== 'custom' &&
    !activity.customPolicy?.trim();
  const showCustom = Boolean(activity.customPolicy?.trim());
  const showWaiver = Boolean(activity.waiverRequired);

  if (!showPrice && !showPreset && !showCustom && !showWaiver) return null;

  const body = (
      <div className="space-y-4 text-sm text-neutral-800 lg:text-[13px]">
        {showPrice && pb ? (
          <div className="space-y-2">
            <p className="font-semibold text-neutral-900">
              {pb.mode === 'paid'
                ? `AED ${pb.amount} ${unitLabel(pb.unit)}`
                : pb.mode === 'shared_cost'
                  ? `Shared cost · AED ${pb.amount} ${unitLabel(pb.unit)}`
                  : null}
            </p>
            <p className="text-neutral-600">
              {paymentMethodLabel(pb.paymentMethod)} · {collectedByLabel(pb.collectedBy)}
            </p>
            {pb.deposit != null && pb.deposit > 0 ? (
              <p className="text-neutral-600">Deposit: AED {pb.deposit}</p>
            ) : null}
            {pb.deadline?.trim() ? (
              <p className="text-neutral-600">Payment deadline: {pb.deadline.trim()}</p>
            ) : null}
            {pb.includes?.length ? (
              <div>
                <p className="font-medium text-neutral-900">Included</p>
                <ul className="mt-1 list-disc pl-5 text-neutral-700">
                  {pb.includes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {pb.excludes?.length ? (
              <div>
                <p className="font-medium text-neutral-900">Not included</p>
                <ul className="mt-1 list-disc pl-5 text-neutral-700">
                  {pb.excludes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {showPreset && activity.policyKey ? (
          <p className="text-neutral-700">{presetCancellationCopy(activity.policyKey)}</p>
        ) : null}

        {showCustom ? (
          <div>
            <p className="font-medium text-neutral-900">Cancellation & refunds</p>
            <p className="mt-1 whitespace-pre-wrap text-neutral-700">{activity.customPolicy!.trim()}</p>
            <p className="mt-2 text-xs text-neutral-500">
              The host handles refunds — not UAE Trail.
            </p>
          </div>
        ) : null}

        {showWaiver ? (
          <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-neutral-800">
            <span className="font-semibold">Waiver required</span> before joining — you will see it in the join flow.
          </p>
        ) : null}
      </div>
  );

  if (consumerSection) {
    return (
      <ConsumerPlanSection
        id="activity-detail-cost-policy"
        title="Cost & policy"
        tone="slate"
        panelClassName={panelClassName}
      >
        {body}
      </ConsumerPlanSection>
    );
  }

  return (
    <div
      id="activity-detail-cost-policy"
      className={`scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:scroll-mt-8 lg:rounded-xl lg:p-3 ${panelClassName}`}
    >
      <h2 className="mb-3 text-lg font-bold text-gray-900 lg:mb-2 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">
        Cost & policy
      </h2>
      {body}
    </div>
  );
};
