import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import { UaeTrailBrandMark } from '../layout/UaeTrailBrandMark';
import { PRODUCT_TAGLINE } from '../../content/productNorthStar';
import { CONSUMER_MODAL_CLOSE } from '../../config/consumerSurfaceTypography';

type Props = {
  title: string;
  subline: string;
  onBack: () => void;
  onClose: () => void;
  children: ReactNode;
};

/** Phone: consumer mesh + frosted card. Tablet/desktop: emerald split card. */
export const AuthFunnelShell = ({ title, subline, onBack, onClose, children }: Props) => (
  <div className="app-page-min-h app-scroll-body flex flex-col consumer-bg safe-area-top safe-area-bottom md:items-center md:justify-center md:bg-neutral-100 md:px-6 md:py-6 dark:md:bg-neutral-950">
    <div className="mx-auto flex w-full min-h-0 flex-1 flex-col max-w-md md:max-h-[calc(100dvh-3rem)] md:w-[min(100%,70rem)] md:max-w-6xl md:flex-none md:grid md:grid-cols-[minmax(15.5rem,0.85fr)_minmax(22rem,1.2fr)] md:overflow-hidden md:rounded-[24px] md:bg-transparent md:shadow-ios dark:md:ring-1 dark:md:ring-neutral-800">
      <aside className="hidden min-h-0 flex-col justify-center gap-8 bg-gradient-to-br from-emerald-600 to-emerald-900 px-7 py-8 text-white md:flex md:overflow-hidden md:rounded-l-[24px] lg:px-9">
        <UaeTrailBrandMark size="md" tone="light" />
        <div>
          <p className="text-xl font-bold leading-snug tracking-tight lg:text-[1.35rem]">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/80">{subline}</p>
          <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-emerald-100/90">{PRODUCT_TAGLINE}</p>
        </div>
      </aside>

      <div className="auth-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden text-neutral-900 max-md:mx-3 max-md:mb-[max(0.75rem,var(--safe-bottom))] max-md:mt-2 max-md:rounded-[22px] max-md:border max-md:border-white/80 max-md:bg-white/92 max-md:shadow-[0_12px_40px_rgba(15,23,42,.1)] max-md:backdrop-blur-xl dark:max-md:border-neutral-700/80 dark:max-md:bg-neutral-900/95 dark:max-md:shadow-[0_12px_40px_rgba(0,0,0,.45)] dark:max-md:backdrop-blur-md md:overflow-y-auto md:rounded-r-[24px] md:bg-white md:px-7 md:py-6 lg:px-8 dark:text-neutral-100 dark:md:bg-neutral-900">
        <div className="relative z-20 flex shrink-0 items-center justify-between gap-2 px-4 pb-1 pt-3 md:px-0 md:pt-0">
          <button
            type="button"
            onClick={onBack}
            className="touch-target-icon -ml-1 inline-flex items-center gap-0.5 py-1 pl-1 pr-2 text-emerald-700 active:opacity-60 dark:text-emerald-400"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            <span className="text-[15px] font-semibold">Back</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`touch-target-icon ${CONSUMER_MODAL_CLOSE.buttonCompact} dark:text-neutral-500 dark:hover:text-neutral-200`}
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-touch bg-inherit px-4 pb-5 pt-1 md:px-0 md:pb-0 md:pt-0">
          <Link to="/" className="mb-4 flex items-center justify-center md:hidden">
            <UaeTrailBrandMark size="md" />
          </Link>

          <div className="mb-5 md:sr-only">
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-neutral-900 dark:text-neutral-50">
              {title}
            </h1>
            <p className="mt-1.5 text-[15px] leading-snug text-neutral-600 dark:text-neutral-400">{subline}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  </div>
);
