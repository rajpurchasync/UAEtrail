import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import { UaeTrailBrandMark } from '../layout/UaeTrailBrandMark';
import { PRODUCT_TAGLINE } from '../../content/productNorthStar';

type Props = {
  title: string;
  subline: string;
  onBack: () => void;
  onClose: () => void;
  children: ReactNode;
};

/** Phone: stacked card. Tablet/desktop: compact split card, sized to content. */
export const AuthFunnelShell = ({ title, subline, onBack, onClose, children }: Props) => (
  <div className="app-page-min-h app-scroll-body flex flex-col bg-ios-bg md:items-center md:justify-center md:bg-neutral-100 md:px-6 md:py-6">
    <div className="mx-auto flex w-full max-w-md flex-none flex-col px-6 py-8 md:max-h-[calc(100dvh-3rem)] md:w-[min(100%,70rem)] md:max-w-6xl md:grid md:grid-cols-[minmax(15.5rem,0.85fr)_minmax(22rem,1.2fr)] md:rounded-[24px] md:bg-transparent md:p-0 md:shadow-ios">
      <aside className="hidden min-h-0 flex-col justify-center gap-8 bg-gradient-to-br from-emerald-600 to-emerald-900 px-7 py-8 text-white md:flex md:overflow-hidden md:rounded-l-[24px] lg:px-9">
        <UaeTrailBrandMark size="md" tone="light" />
        <div>
          <p className="text-xl font-bold leading-snug tracking-tight lg:text-[1.35rem]">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/80">{subline}</p>
          <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-emerald-100/90">{PRODUCT_TAGLINE}</p>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col overflow-y-auto bg-white [transform:translateZ(0)] md:rounded-r-[24px] md:px-7 md:py-6 lg:px-8">
        <div className="relative z-20 mb-1 flex shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="relative z-20 inline-flex items-center gap-0.5 -ml-1 py-1 pl-1 pr-2 text-emerald-600 active:opacity-60"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
            <span className="text-[17px] font-medium">Back</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="relative z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 shadow-sm ring-1 ring-black/5 hover:bg-neutral-200 hover:text-neutral-800 active:opacity-60"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        <Link to="/" className="relative z-0 mb-4 flex items-center justify-center md:hidden">
          <UaeTrailBrandMark size="md" />
        </Link>

        <h1 className="mb-1 text-center text-[28px] font-bold tracking-tight text-neutral-900 md:sr-only">
          {title}
        </h1>
        <p className="mb-5 text-center text-[15px] text-neutral-500 md:hidden">{subline}</p>
        {children}
      </div>
    </div>
  </div>
);
