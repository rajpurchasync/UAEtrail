import { ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ConsumerBottomSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Sticky region below the title row (e.g. segment chips). */
  toolbar?: ReactNode;
  /** Stack above map sheets (Leaflet ~400) and FABs (~1250). */
  zIndex?: number;
}

/** Shared consumer bottom sheet — same chrome as Trail Points hub. */
export const ConsumerBottomSheet = ({
  open,
  title,
  subtitle,
  onClose,
  children,
  toolbar,
  zIndex = 50,
}: ConsumerBottomSheetProps) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      style={{ zIndex }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className="relative flex max-h-[min(88dvh,720px)] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl animate-fade-up sm:max-w-md sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consumer-bottom-sheet-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3">
          <div className="min-w-0">
            <h2 id="consumer-bottom-sheet-title" className="text-[15px] font-bold text-neutral-900">
              {title}
            </h2>
            {subtitle ? <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {toolbar ? <div className="shrink-0 border-b border-neutral-100 bg-white px-4 py-2">{toolbar}</div> : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(var(--safe-bottom)+1rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};
