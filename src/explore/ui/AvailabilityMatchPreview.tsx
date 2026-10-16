import type { MemberAvailabilityMatchPreviewDTO } from '@uaetrail/shared-types';
import { Link } from 'react-router-dom';
import { AppButton } from '../../components/mobile/AppButton';
import { activityDetailPath } from '../../config/routingCatalog';
import { EXPLORE_FLOW } from '../../config/exploreTheme';

type AvailabilityMatchPreviewProps = {
  preview: MemberAvailabilityMatchPreviewDTO;
  onDone: () => void;
};

const formatOutingDay = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

/** Post-save hint — hosted outings on saved days + activity types (Find crew lists all available members). */
export const AvailabilityMatchPreview = ({ preview, onDone }: AvailabilityMatchPreviewProps) => {
  const hasHosted = preview.hostedOutings.length > 0;

  if (!hasHosted) {
    return (
      <div className="space-y-4 pt-2">
        <p className={`${EXPLORE_FLOW.choiceCardSubtitle}`}>
          Saved. We&apos;ll nudge you when outings line up with your days — browse everyone free on{' '}
          <span className="font-medium">Find crew</span>.
        </p>
        <AppButton type="button" onClick={onDone}>Done</AppButton>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2">
      <p className={`${EXPLORE_FLOW.choiceCardSubtitle}`}>
        Saved — hosted outings on your days and activity types:
      </p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-900">Hosted outings on your days</h3>
        <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200/80 bg-white">
          {preview.hostedOutings.map((outing) => (
            <li key={outing.id}>
              <Link
                to={activityDetailPath(outing.id)}
                onClick={onDone}
                className="flex flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-emerald-50/40"
              >
                <span className="text-sm font-medium text-neutral-900">{outing.title}</span>
                <span className="text-xs text-neutral-500">{formatOutingDay(outing.startAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <AppButton type="button" onClick={onDone}>Done</AppButton>
    </div>
  );
};
