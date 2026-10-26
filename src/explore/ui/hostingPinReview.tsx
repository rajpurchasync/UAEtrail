import { useState, type ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { ViewOnMapLink } from '../../components/ui/ViewOnMapLink';
import { HostingWizardActivityPeek } from './HostingWizardActivityPeek';

type HostingPinReviewLineProps = {
  title: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  label?: string | null;
  notes?: string | null;
  /** Rideshare to an outing — show event title plus meeting place line. */
  linkedEventTitle?: string | null;
  linkedPlaceName?: string | null;
  linkedActivityId?: string | null;
};

const meetingPlaceFromDetailLine = (detail: string | null | undefined): string | null => {
  const text = detail?.trim();
  if (!text) return null;
  const stripped = text.replace(/^Meeting\s*·\s*/i, '').trim();
  return stripped || text;
};

const isSamePlaceAndEventLabel = (place: string, event: string): boolean =>
  place.trim().toLowerCase() === event.trim().toLowerCase();

const formatCoord = (value: number): string => Number(value.toFixed(4)).toString();

const labelClassPublish = 'text-[11px] font-semibold uppercase tracking-wide text-gray-500';
const peekNameButtonPublish =
  'font-medium text-emerald-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600';

type RideshareLinkedOutingPreviewLinesProps = {
  eventTitle: string;
  placeLine?: string | null;
  activityId?: string | null;
  onOpenPeek: () => void;
  /** Destination step (sky card) vs publish preview (neutral). */
  tone?: 'publish' | 'destination';
};

/** Outing title + optional place — names open activity peek when `activityId` is set. */
export const RideshareLinkedOutingPreviewLines = ({
  eventTitle,
  placeLine,
  activityId,
  onOpenPeek,
  tone = 'publish',
}: RideshareLinkedOutingPreviewLinesProps) => {
  const trimmedPlace = placeLine?.trim();
  const showPlace =
    Boolean(trimmedPlace) && !isSamePlaceAndEventLabel(trimmedPlace!, eventTitle);
  const canPeek = Boolean(activityId?.trim());
  const labelClass =
    tone === 'destination'
      ? 'text-xs font-semibold uppercase tracking-wide text-sky-800/80'
      : labelClassPublish;
  const nameButtonClass =
    tone === 'destination'
      ? 'font-medium text-sky-800 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700'
      : peekNameButtonPublish;
  const staticNameClass =
    tone === 'destination' ? 'font-medium text-sky-950' : 'font-medium text-gray-900';
  const staticPlaceClass = tone === 'destination' ? 'text-sky-900/90' : 'text-sm text-gray-800';

  const nameControl = (name: string) =>
    canPeek ? (
      <button type="button" onClick={onOpenPeek} className={nameButtonClass}>
        {name}
      </button>
    ) : (
      <span className={staticNameClass}>{name}</span>
    );

  return (
    <div className="mt-1 space-y-1">
      <p className={tone === 'destination' ? undefined : 'text-sm text-gray-900'}>
        <span className={labelClass}>Outing · </span>
        {nameControl(eventTitle)}
      </p>
      {showPlace ? (
        <p className={tone === 'destination' ? staticPlaceClass : 'text-sm text-gray-800'}>
          <span className={labelClass}>Place · </span>
          {nameControl(trimmedPlace!)}
        </p>
      ) : null}
    </div>
  );
};

/** Publish preview — label, map link, optional notes (not a raw URL string). */
export const HostingPinReviewLine = ({
  title,
  latitude,
  longitude,
  label,
  notes,
  linkedEventTitle,
  linkedPlaceName,
  linkedActivityId,
}: HostingPinReviewLineProps) => {
  const [outingPeekOpen, setOutingPeekOpen] = useState(false);
  if (latitude == null || longitude == null) return null;
  const eventTitle = linkedEventTitle?.trim();
  const labelText = label?.trim();
  const notesText = notes?.trim();
  const placeLine = eventTitle
    ? linkedPlaceName?.trim() || meetingPlaceFromDetailLine(label) || labelText
    : labelText;
  const showMeetLine =
    Boolean(placeLine) && (!eventTitle || !isSamePlaceAndEventLabel(placeLine!, eventTitle));
  const activityId = linkedActivityId?.trim();

  return (
    <div className="mt-2 rounded-xl border border-neutral-200/90 bg-white px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      {eventTitle ? (
        <RideshareLinkedOutingPreviewLines
          eventTitle={eventTitle}
          placeLine={showMeetLine ? placeLine : null}
          activityId={activityId}
          onOpenPeek={() => setOutingPeekOpen(true)}
        />
      ) : labelText ? (
        <p className="mt-0.5 text-sm font-medium text-gray-900">{labelText}</p>
      ) : null}
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
      {outingPeekOpen && activityId ? (
        <HostingWizardActivityPeek activityId={activityId} onClose={() => setOutingPeekOpen(false)} />
      ) : null}
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
