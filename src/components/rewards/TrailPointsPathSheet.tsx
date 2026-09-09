import { RewardSummaryDTO } from '@uaetrail/shared-types';
import { TrailPointsProgressCard } from './TrailPointsProgressCard';
import { TrailPointsHubSheet } from './TrailPointsHubSheet';

interface TrailPointsPathSheetProps {
  open: boolean;
  onClose: () => void;
  summary: RewardSummaryDTO;
}

/** Bottom sheet — path to next tier + earn suggestions. */
export const TrailPointsPathSheet = ({ open, onClose, summary }: TrailPointsPathSheetProps) => (
  <TrailPointsHubSheet open={open} title="Trail Points" onClose={onClose}>
    <TrailPointsProgressCard summary={summary} />
  </TrailPointsHubSheet>
);
