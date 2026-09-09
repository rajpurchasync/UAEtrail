import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface TrailPointsHubSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Shared bottom sheet for Trail Points hub sections. */
export const TrailPointsHubSheet = ({ open, title, onClose, children }: TrailPointsHubSheetProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[min(88dvh,720px)] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl animate-fade-up sm:max-w-md sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3">
          <h2 className="text-[15px] font-bold text-neutral-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(var(--safe-bottom)+1rem)]">{children}</div>
      </div>
    </div>
  );
};
