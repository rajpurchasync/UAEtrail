import type { DiscoverRecommendationSignal } from '@uaetrail/shared-types';
import { discoverRecommendationSignalLabel } from '../recommend/exploreRecommendationSignalCopy';

type RecommendationSignalChipsProps = {
  signals: DiscoverRecommendationSignal[];
  /** Max chips shown per row (map sheet uses 2). */
  limit?: number;
  className?: string;
};

/** “Why recommended” chips from {@link GET /discover/recommendations} ranker signals. */
export const RecommendationSignalChips = ({
  signals,
  limit = 2,
  className = 'mt-0.5 flex flex-wrap gap-1',
}: RecommendationSignalChipsProps) => {
  if (signals.length === 0) return null;
  return (
    <ul className={className} aria-label="Why recommended">
      {signals.slice(0, limit).map((signal) => (
        <li key={signal}>
          <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 ring-1 ring-emerald-600/20">
            {discoverRecommendationSignalLabel(signal)}
          </span>
        </li>
      ))}
    </ul>
  );
};