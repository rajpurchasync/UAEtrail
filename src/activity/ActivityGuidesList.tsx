import { Link } from 'react-router-dom';
import {
  activityGuideCountLabel,
  memberProfilePath,
  type ActivityDetailDTO,
  type ActivityGuidePublicDTO,
} from '@uaetrail/shared-types';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { showTenantBrand } from '../utils/hostLabels';
import { activityPublisherFromDetail, shouldListActivityGuidesOnDetail } from './activityPublisherDisplay';

export const ActivityGuidesList = ({
  activity,
  compact = false,
}: {
  activity: ActivityDetailDTO;
  compact?: boolean;
}) => {
  const guides = activity.guides ?? [];
  if (!shouldListActivityGuidesOnDetail(activity)) return null;
  return (
    <div className={compact ? 'mt-3' : 'mt-4'}>
      <p className="text-xs font-medium text-neutral-500">Guides</p>
      <ul className={compact ? 'mt-2 space-y-1.5' : 'mt-3 space-y-2'}>
        {guides.map((guide) => (
          <ActivityGuideRow key={guide.userId} guide={guide} compact={compact} />
        ))}
      </ul>
    </div>
  );
};

const ActivityGuideRow = ({
  guide,
  compact,
}: {
  guide: ActivityGuidePublicDTO;
  compact: boolean;
}) => {
  const path = memberProfilePath(guide.userId);
  const inner = (
    <>
      <SecureAvatar
        src={guide.avatarUrl}
        name={guide.displayName}
        className={compact ? 'h-8 w-8 text-[10px] shrink-0' : 'h-9 w-9 text-xs shrink-0'}
      />
      <span className={`min-w-0 truncate font-semibold text-neutral-900 ${compact ? 'text-sm' : 'text-[15px]'}`}>
        {guide.displayName}
      </span>
    </>
  );
  if (!path) {
    return <li className="flex items-center gap-2">{inner}</li>;
  }
  return (
    <li>
      <Link to={path} className="flex items-center gap-2 rounded-xl py-0.5 hover:bg-neutral-50">
        {inner}
      </Link>
    </li>
  );
};

export const ActivityPublisherHeading = ({ activity }: { activity: ActivityDetailDTO }) => {
  const publisher = activityPublisherFromDetail(activity);
  const count = activity.acceptedGuideCount ?? activity.guides?.length ?? 0;
  const company = publisher.kind === 'company' || showTenantBrand(activity);
  return (
    <div className="min-w-0">
      <p className="truncate text-[15px] font-semibold text-neutral-950">{publisher.name}</p>
      {company && count > 0 ? (
        <p className="truncate text-sm text-neutral-600">{activityGuideCountLabel(count)}</p>
      ) : null}
    </div>
  );
};
