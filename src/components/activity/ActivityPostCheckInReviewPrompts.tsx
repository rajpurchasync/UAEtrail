import { Link } from 'react-router-dom';
import { CheckCircle2, Star } from 'lucide-react';
import type { PostCheckInReviewPromptItem } from '../../activity/activityPostCheckInReviewPrompts';
import { reviewSectionHash, scrollToReviewAnchor } from '../ui/DetailReviewChrome';
import { ACTIVITY_DETAIL_POST_CHECK_IN_REVIEWS_TITLE } from '../../content/activityDetailCopy';
import type { ActivityDetailTabId } from '../../activity/activityDetailTab';

type ActivityPostCheckInReviewPromptsProps = {
  items: PostCheckInReviewPromptItem[];
  panelClassName?: string;
  onMobileTabChange?: (tab: ActivityDetailTabId) => void;
};

export const ActivityPostCheckInReviewPrompts = ({
  items,
  panelClassName = '',
  onMobileTabChange,
}: ActivityPostCheckInReviewPromptsProps) => {
  if (items.length === 0) return null;

  const openActivityReview = () => {
    onMobileTabChange?.('plan');
    requestAnimationFrame(() => scrollToReviewAnchor(reviewSectionHash));
  };

  return (
    <div
      className={`rounded-2xl border border-amber-100 bg-amber-50/80 p-4 ${panelClassName}`}
      role="region"
      aria-label={ACTIVITY_DETAIL_POST_CHECK_IN_REVIEWS_TITLE}
    >
      <div className="flex items-start gap-2">
        <Star className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-950">{ACTIVITY_DETAIL_POST_CHECK_IN_REVIEWS_TITLE}</p>
          <ul className="mt-3 space-y-2">
            {items.map((item) => {
              if (item.done) {
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 text-sm font-medium text-emerald-800"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label} — thanks!
                  </li>
                );
              }

              if (item.id === 'activity') {
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={openActivityReview}
                      className="w-full rounded-xl bg-white px-3 py-2.5 text-left text-sm font-semibold text-amber-950 shadow-sm ring-1 ring-amber-200/80 active:bg-amber-50"
                    >
                      {item.label}
                    </button>
                  </li>
                );
              }

              if (item.href) {
                return (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      className="block w-full rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-amber-950 shadow-sm ring-1 ring-amber-200/80 active:bg-amber-50"
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }

              return null;
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
