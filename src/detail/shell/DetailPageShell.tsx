import type { ReactNode } from 'react';
import { ActivityConsumerDetailModalShell } from '../../activity/detail/templates/ActivityConsumerDetailModalShell';
import type { ConsumerDetailHeaderMark } from '../../components/mobile/ConsumerDetailHeaderChromeTitle';

/**
 * Shared consumer detail layout (plan §5).
 * DoD: use logical CSS (ps/pe/ms/me, inset-inline) — not left/right — so `dir=rtl` on html
 * mirrors padding and the sticky aside without a second LTR stylesheet.
 */
export const DetailPageShell = ({
  backTo = '',
  backLabel,
  headerChrome,
  headerAction,
  footer,
  footerClassName,
  hero,
  alerts,
  jumpRow,
  aboveJumpRow,
  keyFacts,
  aside,
  children,
  withModalChrome = true,
  preferDeclaredBackLabel = false,
  centerContent = false,
  dir = 'inherit',
}: {
  backTo?: string;
  backLabel?: string;
  headerChrome?: { emoji: string; label: string; mark?: ConsumerDetailHeaderMark };
  headerAction?: ReactNode;
  footer?: ReactNode;
  footerClassName?: string;
  hero?: ReactNode;
  alerts?: ReactNode;
  jumpRow?: ReactNode;
  /** Renders before the sticky in-page nav (guest gates, alerts that must not sit under jump chips). */
  aboveJumpRow?: ReactNode;
  keyFacts?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  /** Activity L3 already wraps `ActivityConsumerDetailModalShell` — skip a second chrome. */
  withModalChrome?: boolean;
  preferDeclaredBackLabel?: boolean;
  /** Center children in the scroll viewport (entity detail loading). */
  centerContent?: boolean;
  /** Logical CSS + `dir` so RTL mirrors padding and the sticky aside (plan §5 / §17.3). */
  dir?: 'ltr' | 'rtl' | 'auto' | 'inherit';
}) => {
  const body = centerContent ? (
    <div
      className="flex w-full min-h-[calc(100dvh-10.5rem)] flex-col items-center justify-center px-4 py-6 md:min-h-[calc(100dvh-9.5rem)] lg:py-8"
      data-detail-page-shell
      dir={dir}
    >
      {children}
    </div>
  ) : (
    <div
      className="w-full min-w-0 max-w-full overflow-x-clip pt-0 pb-2 max-lg:overflow-x-visible md:pt-0 lg:mx-auto lg:max-w-[1200px] lg:overflow-x-clip lg:pb-4"
      data-detail-page-shell
      dir={dir}
    >
      {hero}
      {alerts}
      {aboveJumpRow}
      {jumpRow}
      {keyFacts ? (
        <div className="mb-3 min-w-0 overflow-visible pt-2.5 md:pt-3 lg:mb-2">{keyFacts}</div>
      ) : null}
      <div className="md:grid md:grid-cols-12 md:gap-5 lg:gap-6">
        <div className="@container/detail-main min-w-0 space-y-3 md:col-span-7 lg:col-span-8">
          {children}
        </div>
        {aside ? (
          <div className="hidden min-w-0 md:col-span-5 md:block lg:col-span-4">
            <aside
              className="md:self-start md:rounded-2xl md:border md:border-neutral-200/80 md:bg-[#F6F8F7] md:p-4 md:shadow-[0_4px_24px_rgba(15,23,42,.06)] md:max-lg:portrait:static md:max-lg:landscape:sticky md:max-lg:landscape:top-3 lg:sticky lg:top-3 dark:md:border-neutral-700 dark:md:bg-neutral-900"
              aria-label="Join and actions"
            >
              {aside}
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!withModalChrome) return body;


  return (
    <ActivityConsumerDetailModalShell
      backTo={backTo}
      backLabel={backLabel ?? ''}
      headerChrome={headerChrome}
      headerAction={headerAction}
      footer={footer}
      footerClassName={footerClassName}
      preferDeclaredBackLabel={preferDeclaredBackLabel}
    >
      {body}
    </ActivityConsumerDetailModalShell>
  );
};
