import { forwardRef, useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import {
  readPersistedDetailSectionExpanded,
  writePersistedDetailSectionExpanded,
} from './consumerDetailSectionPersistence';
import { ChevronDown } from 'lucide-react';
import {
  CONSUMER_DETAIL_SECTION_LABEL,
  CONSUMER_DETAIL_SECTION_SHELL,
  CONSUMER_DETAIL_SECTION_TONE,
  type ConsumerDetailSectionTone,
} from './consumerDetailSectionTones';

export type ConsumerDetailSectionProps = {
  title: string;
  children: ReactNode;
  tone?: ConsumerDetailSectionTone;
  id?: string;
  ariaLabel?: string;
  bodyClassName?: string;
  className?: string;
  action?: ReactNode;
  /** When true, inner panel uses flat transparent body (no extra inset card). */
  bleedBody?: boolean;
  /** Collapsible on mobile + tablet (`max-lg`); `lg+` always uses bordered section + corner title pill. */
  collapsible?: boolean;
  defaultExpanded?: boolean;
  /**
   * With `id`, remembers mobile collapse per section for this page in sessionStorage
   * (e.g. `activity:${activityId}`). Absent storage → `defaultExpanded`.
   */
  pageKey?: string;
};

/**
 * Bordered square section with a corner label — shared across place, activity, and area detail.
 */
export const ConsumerDetailSection = forwardRef<HTMLElement, ConsumerDetailSectionProps>(
  function ConsumerDetailSection(
    {
      title,
      children,
      tone = 'neutral',
      id,
      ariaLabel,
      bodyClassName = '',
      className = '',
      action,
      bleedBody: _bleedBody = false,
      collapsible = false,
      defaultExpanded = true,
      pageKey,
    },
    ref
  ) {
    const token = CONSUMER_DETAIL_SECTION_TONE[tone];
    const bodyId = useId();
    const persistSectionId = id?.trim() || null;
    const persist =
      Boolean(collapsible && pageKey && persistSectionId);
    const readInitialExpanded = () =>
      persist && pageKey && persistSectionId
        ? readPersistedDetailSectionExpanded(pageKey, persistSectionId, defaultExpanded)
        : defaultExpanded;
    const [expanded, setExpandedState] = useState(readInitialExpanded);

    useEffect(() => {
      if (!persist || !pageKey || !persistSectionId) {
        setExpandedState(defaultExpanded);
        return;
      }
      setExpandedState(readPersistedDetailSectionExpanded(pageKey, persistSectionId, defaultExpanded));
    }, [pageKey, persistSectionId, defaultExpanded, persist]);

    const setExpanded = useCallback(
      (value: boolean | ((prev: boolean) => boolean)) => {
        setExpandedState((prev) => {
          const next = typeof value === 'function' ? value(prev) : value;
          if (persist && pageKey && persistSectionId) {
            writePersistedDetailSectionExpanded(pageKey, persistSectionId, next);
          }
          return next;
        });
      },
      [pageKey, persistSectionId, persist]
    );
    if (!children) return null;

    const sectionBodyClass = `text-sm leading-relaxed lg:text-[13px] lg:leading-snug ${token.body} ${bodyClassName}`;
    /** Fresh element per slot — reusing one `body` node breaks dual mobile/desktop layout (React single-parent rule). */
    const renderSectionBody = () => (
      <div className={sectionBodyClass}>{children}</div>
    );

    if (collapsible) {
      const scrollTone = token.section
        .split(' ')
        .filter((part) => part.startsWith('scroll-mt'))
        .join(' ');
      const mobileSurface = token.section
        .split(' ')
        .filter((part) => !part.startsWith('scroll-mt'))
        .join(' ');
      const mobileTitleText = token.label
        .split(' ')
        .filter((part) => part.startsWith('text-') || part.startsWith('dark:text-'))
        .join(' ');
      const mobileBorder = mobileCollapsibleDividerBorder(token.section);

      return (
        <section
          ref={ref}
          id={id}
          aria-label={ariaLabel ?? title}
          className={`relative mt-0 min-h-0 overflow-visible max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none ${scrollTone} ${className}`}
        >
          <div
            className={`flex h-full min-h-0 flex-col overflow-hidden rounded-xl border-2 shadow-sm lg:hidden ${mobileSurface}`}
          >
            <CollapsibleMobileBar
              title={title}
              titleClass={mobileTitleText}
              dividerBorder={mobileBorder}
              action={action}
              expanded={expanded}
              bodyId={bodyId}
              bodyMounted={expanded}
              onToggle={() => setExpanded((v) => !v)}
            />
            {expanded ? (
              <div id={bodyId} className="min-h-0 min-w-0 flex-1 overflow-x-visible px-4 pb-3 pt-2">
                {renderSectionBody()}
              </div>
            ) : null}
          </div>
          <div
            className={`hidden h-full min-h-0 flex-col lg:flex ${CONSUMER_DETAIL_SECTION_SHELL} ${token.section}`}
          >
            <CategoryLabel title={title} labelClass={token.label} action={action} />
            <div className="min-h-0 flex-1">{renderSectionBody()}</div>
          </div>
        </section>
      );
    }

    return (
      <section
        ref={ref}
        id={id}
        aria-label={ariaLabel ?? title}
        className={`${CONSUMER_DETAIL_SECTION_SHELL} ${token.section} ${className}`}
      >
        <CategoryLabel title={title} labelClass={token.label} action={action} />
        {renderSectionBody()}
      </section>
    );
  }
);

const CategoryLabel = ({
  title,
  labelClass,
  action,
}: {
  title: string;
  labelClass: string;
  action?: ReactNode;
}) => (
  <div className="pointer-events-none absolute start-0 top-0 z-10 flex w-full items-center justify-between gap-2 pe-3">
    <span className={`${CONSUMER_DETAIL_SECTION_LABEL} pointer-events-auto ${labelClass}`}>
      {title}
    </span>
    {action ? <span className="pointer-events-auto shrink-0">{action}</span> : null}
  </div>
);

const mobileCollapsibleDividerBorder = (sectionClass: string): string => {
  const parts = sectionClass.split(' ');
  const light = parts.find((part) => part.startsWith('border-') && !part.startsWith('dark:'));
  const dark = parts.find((part) => part.startsWith('dark:border-'));
  return [light, dark].filter(Boolean).join(' ') || 'border-neutral-200/90 dark:border-neutral-700';
};

const CollapsibleMobileBar = ({
  title,
  titleClass,
  dividerBorder,
  action,
  expanded,
  bodyId,
  bodyMounted,
  onToggle,
}: {
  title: string;
  titleClass: string;
  dividerBorder: string;
  action?: ReactNode;
  expanded: boolean;
  bodyId: string;
  bodyMounted: boolean;
  onToggle: () => void;
}) => (
  <div
    className={`flex w-full items-center gap-2 px-3 py-2.5 ${
      expanded ? `border-b-2 ${dividerBorder}` : ''
    }`}
  >
    <button
      type="button"
      className={`flex min-h-9 min-w-0 flex-1 items-center justify-between gap-2 text-start text-[11px] font-bold uppercase tracking-[0.1em] ${titleClass}`}
      aria-expanded={expanded}
      aria-controls={bodyMounted ? bodyId : undefined}
      onClick={onToggle}
    >
      <span className="truncate">{title}</span>
      <ChevronDown
        className={`h-4 w-4 shrink-0 text-current opacity-80 transition-transform ${expanded ? 'rotate-180' : ''}`}
        aria-hidden
      />
    </button>
    {action ? <span className="shrink-0">{action}</span> : null}
  </div>
);
