import type { RideshareRiderReputationDTO } from '@uaetrail/shared-types';
import { Star } from 'lucide-react';

export const RideshareRiderReputationSummary = ({
  reputation,
  compact = false,
}: {
  reputation: RideshareRiderReputationDTO;
  compact?: boolean;
}) => {
  const rows = [
    { label: 'Cleanliness', value: reputation.averages.cleanliness },
    { label: 'Punctuality', value: reputation.averages.punctuality },
    { label: 'Behaviour', value: reputation.averages.behaviour },
    ...(reputation.averages.payment != null
      ? [{ label: 'Payment', value: reputation.averages.payment }]
      : []),
  ];

  if (compact) {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-600">
        <span className="inline-flex items-center gap-0.5 font-semibold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden />
          {reputation.overallScore.toFixed(1)}
        </span>
        <span>· {reputation.ratingCount} ride rating{reputation.ratingCount === 1 ? '' : 's'} from hosts</span>
      </p>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">Rider ratings from other hosts</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
        <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden />
        {reputation.overallScore.toFixed(1)} overall
        <span className="font-normal text-neutral-500">({reputation.ratingCount} rides)</span>
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-neutral-700">
        {rows.map((row) => (
          <li key={row.label}>
            <span className="text-neutral-500">{row.label}</span>{' '}
            <span className="font-semibold">{row.value.toFixed(1)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
