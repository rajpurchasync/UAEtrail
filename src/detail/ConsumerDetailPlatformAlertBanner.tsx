import type { PublicActiveAlertDTO } from '@uaetrail/shared-types';
import { ExternalLink } from 'lucide-react';

const severityClass = (severity: PublicActiveAlertDTO['severity']): string => {
  switch (severity) {
    case 'critical':
      return 'border-rose-200 bg-rose-50 text-rose-950';
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-950';
    default:
      return 'border-sky-200 bg-sky-50 text-sky-950';
  }
};

export type ConsumerDetailPlatformAlertBannerProps = {
  alerts: PublicActiveAlertDTO[];
  /** ARIA label for the region — e.g. "Safety notices" */
  label?: string;
  className?: string;
};

/** Thin platform ops / safety strip — plain text + optional external link (no rich HTML). */
export const ConsumerDetailPlatformAlertBanner = ({
  alerts,
  label = 'Notices',
  className = '',
}: ConsumerDetailPlatformAlertBannerProps) => {
  if (!alerts.length) return null;

  return (
    <div className={`space-y-2 ${className}`} role="region" aria-label={label}>
      {alerts.map((row) => {
        const tone = severityClass(row.severity);
        const hasLink = Boolean(row.linkUrl?.trim());
        return (
          <div
            key={row.id}
            className={`rounded-xl border px-3 py-2.5 text-sm leading-snug shadow-sm lg:px-3 lg:py-2 lg:text-[13px] lg:leading-5 ${tone}`}
          >
            <p className="font-semibold">{row.title}</p>
            <p className="mt-0.5 whitespace-pre-wrap">{row.body}</p>
            {hasLink ? (
              <p className="mt-1.5">
                <a
                  href={row.linkUrl as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
                >
                  {row.linkLabel?.trim() || 'More'}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                </a>
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
