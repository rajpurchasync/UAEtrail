import { LocateFixed, X } from 'lucide-react';
import {
  PRODUCT_EXPLORE_LOCATION_PROMPT_BODY,
  PRODUCT_EXPLORE_LOCATION_PROMPT_TITLE,
} from '../../content/productNorthStar';

interface ExploreMapLocationPromptProps {
  open: boolean;
  loading: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

export const ExploreMapLocationPrompt = ({
  open,
  loading,
  onAllow,
  onDismiss,
}: ExploreMapLocationPromptProps) => {
  if (!open) return null;

  return (
    <div className="pointer-events-none absolute inset-x-4 top-[4.5rem] z-[3200] max-lg:top-14 lg:top-20 lg:left-auto lg:right-6 lg:max-w-sm">
      <div className="pointer-events-auto overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_8px_32px_rgba(15,23,42,.14)]">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
              <LocateFixed className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-neutral-900">{PRODUCT_EXPLORE_LOCATION_PROMPT_TITLE}</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">{PRODUCT_EXPLORE_LOCATION_PROMPT_BODY}</p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="-mr-1 -mt-1 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onAllow}
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {loading ? 'Locating…' : 'Allow'}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-100"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
