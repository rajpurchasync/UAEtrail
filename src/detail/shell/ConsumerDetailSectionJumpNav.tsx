import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { findConsumerDetailScrollRoot, scrollConsumerDetailToId } from './consumerDetailScrollTo';

export type ConsumerDetailJumpLink = {
  href: string;
  label: string;
  /** DOM id for scroll-spy (without #). */
  sectionId?: string;
};

/**
 * Sticky in-page section chips (plan §5 — Overview, Details, Host, Reviews).
 * On large screens, highlights the active section while scrolling.
 */
export const ConsumerDetailSectionJumpNav = ({
  links,
  ariaLabel = 'On this page',
  enableScrollSpy = true,
  className = '',
}: {
  links: ConsumerDetailJumpLink[];
  ariaLabel?: string;
  /** Desktop tab strip with scroll-spy (§5.3). */
  enableScrollSpy?: boolean;
  className?: string;
}) => {
  const sectionIds = useMemo(
    () =>
      links
        .map((link) => link.sectionId ?? link.href.replace(/^#/, ''))
        .filter((id) => id.length > 0),
    [links]
  );

  const navRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);
  const sectionIdsKey = useMemo(() => sectionIds.join('|'), [sectionIds]);

  useEffect(() => {
    if (!enableScrollSpy || sectionIds.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const scrollRoot = findConsumerDetailScrollRoot(navRef.current);
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!id) continue;
          if (entry.isIntersecting) {
            visible.set(id, entry.intersectionRatio);
          } else {
            visible.delete(id);
          }
        }
        if (visible.size === 0) return;
        const next = [...visible.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        if (next) setActiveId(next);
      },
      {
        root: scrollRoot,
        rootMargin: '-12% 0px -58% 0px',
        threshold: [0, 0.12, 0.35, 0.6],
      }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [enableScrollSpy, sectionIds, sectionIdsKey]);

  if (links.length === 0) return null;

  return (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      className={`sticky top-0 z-20 -mx-4 mb-3 bg-white shadow-[0_1px_0_rgba(15,23,42,.06)] max-md:top-[var(--detail-header-pad,calc(var(--safe-top)+4.75rem))] md:-mx-6 lg:mx-0 lg:mb-3 lg:bg-white/95 lg:shadow-sm lg:shadow-neutral-200/80 dark:bg-neutral-950 dark:shadow-neutral-900/50 dark:lg:bg-neutral-950/95 dark:lg:shadow-neutral-900/60 ${className}`}
      data-consumer-detail-jump-nav
    >
      <div className="flex gap-1 overflow-x-auto px-4 py-1.5 max-lg:snap-x max-lg:snap-proximity max-lg:[scrollbar-width:none] md:px-6 lg:rounded-xl lg:border lg:border-neutral-200/70 lg:bg-white/90 lg:px-2 lg:py-1.5 lg:backdrop-blur-md supports-[backdrop-filter]:lg:bg-white/75 dark:lg:border-neutral-700 dark:lg:bg-neutral-900/90">
        {links.map((item) => {
          const id = item.sectionId ?? item.href.replace(/^#/, '');
          const isActive = enableScrollSpy && activeId === id;
          return (
            <JumpChip
              key={item.href}
              href={item.href}
              sectionId={id}
              active={isActive}
            >
              {item.label}
            </JumpChip>
          );
        })}
      </div>
    </nav>
  );
};

const JumpChip = ({
  href,
  sectionId,
  children,
  active,
}: {
  href: string;
  sectionId: string;
  children: ReactNode;
  active?: boolean;
}) => {
  const onPress = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollConsumerDetailToId(sectionId);
  };
  return (
  <a
    href={href}
    onClick={onPress}
    className={`inline-flex min-h-10 min-w-[2.75rem] shrink-0 items-center justify-center rounded-full border px-3 py-1.5 text-[12px] font-semibold shadow-sm transition-colors max-md:min-h-9 max-md:py-1 lg:min-h-9 lg:py-1 lg:text-[11px] ${
      active
        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100'
        : 'border-neutral-200 bg-white text-neutral-700 hover:border-emerald-200 hover:text-emerald-900 active:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'
    }`}
  >
    {children}
  </a>
  );
};
