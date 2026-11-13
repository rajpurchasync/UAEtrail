import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { Phone } from 'lucide-react';
import { activityHasEmergencyContact } from '../../../activity/activityDetailAudiencePresentation';
import { ConsumerDetailSection } from '../../../detail/shell/ConsumerDetailSection';
import { resolveRegionEmergencyNumbers } from '../../../config/regionEmergencyNumbers';
import { EmergencyHotlineDialButton } from '../../safety/EmergencyHotlineDialButton';

type Props = {
  activity: ActivityDetailDTO;
  panelClassName: string;
  /** Show UAE 999 baseline + heat/flood note for everyone (consumer detail). */
  showBaseline?: boolean;
  /** Sticky aside column — smaller type and hotline rows. */
  compact?: boolean;
  /** Card chrome when rendered in the sticky aside. */
  asideCard?: boolean;
  /** When set, aside compact block owns the jump-nav anchor (desktop). */
  scrollAnchorId?: string;
  className?: string;
};

/** Emergency hotlines + host contact — consumer activity detail. */
export const ActivityDetailSafetySection = ({
  activity,
  panelClassName,
  showBaseline = false,
  compact = false,
  asideCard = false,
  scrollAnchorId,
  className = '',
}: Props) => {
  const hasEmerg = activityHasEmergencyContact(activity);
  const emerg = activity.activityPrivateDetails?.emergencyContact;
  const regionConfig = resolveRegionEmergencyNumbers(activity.region);

  if (!showBaseline && !hasEmerg) return null;

  const bodyClass = compact
    ? 'space-y-2 text-[11px] leading-snug text-neutral-700 dark:text-neutral-300'
    : 'space-y-3 text-sm lg:text-[13px]';

  const baseline = showBaseline ? (
    <div className={bodyClass}>
      <p className={compact ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}>
        {compact
          ? 'We do not track you on the trail. Check weather and local advisories before you go.'
          : 'UAE Trail does not monitor your location on the trail. Heat and sudden weather changes happen fast — check the forecast on this page and local advisories before you go.'}
      </p>
      <div>
        <p
          className={`mb-1.5 font-semibold uppercase tracking-wide text-sky-900/80 dark:text-sky-200 ${
            compact ? 'text-[9px]' : 'mb-2 text-[11px]'
          }`}
        >
          Emergency · {regionConfig.countryLabel}
        </p>
        <ul className={compact ? 'space-y-1' : 'space-y-2'}>
          {regionConfig.hotlines.map((line) => (
            <li key={line.id}>
              <EmergencyHotlineDialButton line={line} compact={compact} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  ) : null;

  const emergNote =
    !showBaseline && hasEmerg ? (
      <p className={compact ? 'text-[11px] leading-snug' : 'text-sm lg:text-[13px]'}>
        For life-threatening emergencies, use the national numbers below.
      </p>
    ) : null;

  const emergContact =
    emerg?.name?.trim() && emerg?.phone?.trim() ? (
      <div
        className={`flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/40 ${
          compact ? 'mt-2 p-2' : 'mt-3 p-3'
        }`}
      >
        <Phone
          className={`shrink-0 text-emerald-800 dark:text-emerald-300 ${compact ? 'mt-0 h-3 w-3' : 'mt-0.5 h-4 w-4'}`}
          aria-hidden
        />
        <div className="min-w-0">
          <p
            className={`font-semibold uppercase tracking-wide text-emerald-900/80 dark:text-emerald-200 ${
              compact ? 'text-[9px]' : 'text-[11px]'
            }`}
          >
            Host emergency
          </p>
          <p
            className={`font-semibold text-neutral-900 dark:text-neutral-50 ${compact ? 'text-[11px]' : 'text-sm'}`}
          >
            {emerg.name.trim()}
          </p>
          <a
            href={`tel:${emerg.phone.replace(/\s+/g, '')}`}
            className={`font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300 ${
              compact ? 'text-[11px]' : 'text-sm'
            }`}
          >
            {emerg.phone.trim()}
          </a>
        </div>
      </div>
    ) : null;

  const inner = (
    <>
      {baseline}
      {emergNote}
      {emergContact}
    </>
  );

  if (compact) {
    const asideShell = asideCard
      ? 'rounded-xl border border-neutral-200/90 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/90'
      : 'border-t border-neutral-200/80 pt-3 dark:border-neutral-700';
    return (
      <section
        id={scrollAnchorId}
        className={`scroll-mt-28 lg:scroll-mt-8 ${asideShell} ${panelClassName} ${className}`}
        aria-label="Safety"
      >
        <h2 className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Safety
        </h2>
        {inner}
      </section>
    );
  }

  if (showBaseline) {
    return (
      <ConsumerDetailSection
        id={scrollAnchorId ?? 'activity-detail-safety'}
        title="Safety"
        tone="sky"
        ariaLabel="Safety"
        className={panelClassName}
        collapsible
        defaultExpanded
      >
        {inner}
      </ConsumerDetailSection>
    );
  }

  return (
    <div
      id="activity-detail-safety"
      className={`scroll-mt-24 rounded-2xl border border-sky-100 bg-white p-5 sm:p-6 dark:border-sky-900 dark:bg-neutral-900 lg:scroll-mt-8 lg:rounded-xl lg:p-3 ${panelClassName}`}
    >
      <h2 className="text-lg font-bold text-gray-900 lg:mb-1 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500 dark:text-neutral-200">
        Safety
      </h2>
      {inner}
    </div>
  );
};
