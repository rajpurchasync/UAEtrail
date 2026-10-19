import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { ViewOnMapLink } from '../../components/ui/ViewOnMapLink';

type HostingPinReviewLineProps = {
  title: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  label?: string | null;
  notes?: string | null;
};

const formatCoord = (value: number): string => Number(value.toFixed(4)).toString();

/** Publish preview — label, map link, optional notes (not a raw URL string). */
export const HostingPinReviewLine = ({
  title,
  latitude,
  longitude,
  label,
  notes,
}: HostingPinReviewLineProps) => {
  if (latitude == null || longitude == null) return null;
  const labelText = label?.trim();
  const notesText = notes?.trim();

  return (
    <div className="mt-2 rounded-xl border border-neutral-200/90 bg-white px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      {labelText ? <p className="mt-0.5 text-sm font-medium text-gray-900">{labelText}</p> : null}
      <ViewOnMapLink
        lat={latitude}
        lng={longitude}
        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Open in Google Maps
      </ViewOnMapLink>
      <p className="mt-0.5 text-[11px] text-gray-400">
        {formatCoord(latitude)}, {formatCoord(longitude)}
      </p>
      {notesText ? <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{notesText}</p> : null}
    </div>
  );
};

type HostingPublishPreviewBlockProps = {
  title: string;
  children: ReactNode;
};

export const HostingPublishPreviewBlock = ({ title, children }: HostingPublishPreviewBlockProps) => (
  <div className="border-t border-neutral-200/80 pt-3 first:border-t-0 first:pt-0">
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{title}</p>
    <div className="space-y-1 text-xs text-gray-600">{children}</div>
  </div>
);
