import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { publishingActivitiesCheckInPath } from '../../config/routingCatalog';
import {
  ACTIVITY_DETAIL_HOST_CHECK_IN_CTA,
  ACTIVITY_DETAIL_HOST_RATE_PARTICIPANTS_CTA,
} from '../../content/activityDetailCopy';

type ActivityHostCheckInReviewPromptProps = {
  activityId: string;
  rateableCount: number;
  activityEnded: boolean;
  panelClassName?: string;
};

export const ActivityHostCheckInReviewPrompt = ({
  activityId,
  rateableCount,
  activityEnded,
  panelClassName = '',
}: ActivityHostCheckInReviewPromptProps) => {
  const rosterPath = publishingActivitiesCheckInPath(activityId);
  const showRate = activityEnded && rateableCount > 0;

  return (
    <div
      className={`rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 ${panelClassName}`}
      role="region"
      aria-label="Host roster and ratings"
    >
      <div className="flex items-start gap-2">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-emerald-950">
            {showRate
              ? `${rateableCount} joiner${rateableCount === 1 ? '' : 's'} ready for your private rating.`
              : 'Confirm who showed up so joiners can leave public reviews.'}
          </p>
          <Link
            to={rosterPath}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
          >
            {showRate ? ACTIVITY_DETAIL_HOST_RATE_PARTICIPANTS_CTA : ACTIVITY_DETAIL_HOST_CHECK_IN_CTA}
          </Link>
        </div>
      </div>
    </div>
  );
};
