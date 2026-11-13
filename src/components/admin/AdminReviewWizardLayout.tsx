import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type JumpLink = { id: string; label: string };

type AdminReviewWizardLayoutProps = {
  backTo: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  hero?: ReactNode;
  jumpLinks?: JumpLink[];
  aside?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Detail-inspired review layout for admin wizards.
 * Sticky title + optional jump chips + sticky action rail (desktop aside / mobile footer).
 */
export const AdminReviewWizardLayout = ({
  backTo,
  backLabel = 'Back',
  title,
  subtitle,
  hero,
  jumpLinks,
  aside,
  children,
  footer,
}: AdminReviewWizardLayoutProps) => (
  <div className="mx-auto w-full max-w-5xl">
    <div className="mb-4 flex items-start gap-3">
      <Link
        to={backTo}
        className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
        aria-label={backLabel}
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold text-neutral-900">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p> : null}
      </div>
    </div>

    {hero}

    {jumpLinks && jumpLinks.length > 0 ? (
      <nav className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Review sections">
        {jumpLinks.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
          >
            {link.label}
          </a>
        ))}
      </nav>
    ) : null}

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="min-w-0 space-y-4 lg:col-span-8">{children}</div>
      {aside ? (
        <aside className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-3 space-y-3 rounded-2xl border border-neutral-200/80 bg-[#F6F8F7] p-4 shadow-[0_4px_24px_rgba(15,23,42,.06)]">
            {aside}
          </div>
        </aside>
      ) : null}
    </div>

    {footer ? (
      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        {footer}
      </div>
    ) : null}
  </div>
);

type AdminWizardSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

export const AdminWizardSection = ({ id, title, children }: AdminWizardSectionProps) => (
  <section id={id} className="scroll-mt-20 rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5">
    <h3 className="mb-3 text-sm font-semibold text-neutral-900">{title}</h3>
    {children}
  </section>
);
