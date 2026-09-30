import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { buildGoogleMapsSearchUrl } from '../../utils/mapLinks';

type OrganizePinReviewLineProps = {
  title: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  label?: string | null;
  notes?: string | null;
};

const formatCoord = (value: number): string => Number(value.toFixed(4)).toString();

/** Publish preview — label, map link, optional notes (not a raw URL string). */
export const OrganizePinReviewLine = ({
  title,
  latitude,
  longitude,
  label,
  notes,
}: OrganizePinReviewLineProps) => {
  if (latitude == null || longitude == null) return null;
  const url = buildGoogleMapsSearchUrl(latitude, longitude);
  const labelText = label?.trim();
  const notesText = notes?.trim();

  return (
    <div className="mt-2 rounded-xl border border-neutral-200/90 bg-white px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      {labelText ? <p className="mt-0.5 text-sm font-medium text-gray-900">{labelText}</p> : null}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Open in Google Maps
      </a>
      <p className="mt-0.5 text-[11px] text-gray-400">
        {formatCoord(latitude)}, {formatCoord(longitude)}
      </p>
      {notesText ? <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{notesText}</p> : null}
    </div>
  );
};

type OrganizePublishPreviewBlockProps = {
  title: string;
  children: ReactNode;
};

export const OrganizePublishPreviewBlock = ({ title, children }: OrganizePublishPreviewBlockProps) => (
  <div className="border-t border-neutral-200/80 pt-3 first:border-t-0 first:pt-0">
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{title}</p>
    <div className="space-y-1 text-xs text-gray-600">{children}</div>
  </div>
);
