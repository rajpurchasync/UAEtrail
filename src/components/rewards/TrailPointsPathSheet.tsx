import { X } from 'lucide-react';
import { RewardSummaryDTO } from '@uaetrail/shared-types';
import { TrailPointsProgressCard } from './TrailPointsProgressCard';

interface TrailPointsPathSheetProps {
  open: boolean;
  onClose: () => void;
  summary: RewardSummaryDTO;
}

/** Bottom sheet — path to next tier + earn suggestions. */
export const TrailPointsPathSheet = ({ open, onClose, summary }: TrailPointsPathSheetProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-[24px] sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto animate-fade-up pb-safe-plus-2">
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white rounded-t-[24px] sm:rounded-t-2xl">
          <h2 className="font-bold text-gray-900 text-[15px]">Trail Points</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <TrailPointsProgressCard summary={summary} />
        </div>
      </div>
    </div>
  );
};
