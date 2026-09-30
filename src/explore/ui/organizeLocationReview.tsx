import { buildGoogleMapsSearchUrl } from '../../utils/mapLinks';

type OrganizePinReviewLineProps = {
  title: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  label?: string | null;
  notes?: string | null;
};

/** Publish preview — human label + Google Maps URL (not raw coordinates). */
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
    <p className="mt-1 text-xs text-gray-600">
      <span className="font-semibold text-gray-700">{title}: </span>
      {labelText ? <span>{labelText} · </span> : null}
      <a href={url} target="_blank" rel="noreferrer" className="break-all font-medium text-emerald-700 underline-offset-2 hover:underline">
        {url}
      </a>
      {notesText ? <span className="mt-0.5 block text-gray-500">{notesText}</span> : null}
    </p>
  );
};
