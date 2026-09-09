import { buildGoogleDriveUrl, buildGoogleMapsSearchUrl, buildWazeDriveUrl } from '../../utils/mapLinks';

const GoogleMapsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M12 2.2C8.2 2.2 5.1 5.3 5.1 9.1c0 4.8 6.9 12.7 6.9 12.7s6.9-7.9 6.9-12.7c0-3.8-3.1-6.9-6.9-6.9Z" fill="#EA4335" />
    <path d="M12 2.2v19.6s6.9-7.9 6.9-12.7c0-3.8-3.1-6.9-6.9-6.9Z" fill="#FBBC05" />
    <path d="M12 2.2C8.2 2.2 5.1 5.3 5.1 9.1c0 4.8 6.9 12.7 6.9 12.7V2.2Z" fill="#34A853" />
    <circle cx="12" cy="9.1" r="3" fill="#4285F4" />
  </svg>
);

const WazeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      d="M12.2 3.2c-4.4 0-8 3.4-8 7.6 0 2.3.9 4.1 2.5 5.5.3.2.3.7.1 1l-.7 1.3c-.2.3 0 .8.4.8h5.2c4.7 0 8.5-3.6 8.5-8.1 0-4.5-3.6-8.1-8-8.1Z"
      fill="#ffffff"
      stroke="#2F3A45"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9.4" cy="10" r="1" fill="#2F3A45" />
    <circle cx="14" cy="10" r="1" fill="#2F3A45" />
    <path d="M8.5 12.8c.9.9 2 1.3 3.1 1.3 1.2 0 2.2-.4 3.1-1.3" fill="none" stroke="#2F3A45" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="8.4" cy="18.2" r="1.8" fill="#ffffff" stroke="#2F3A45" strokeWidth="1.5" />
    <circle cx="14.7" cy="18.2" r="1.8" fill="#ffffff" stroke="#2F3A45" strokeWidth="1.5" />
  </svg>
);

interface LocationDirectionLinksProps {
  lat: number;
  lng: number;
  className?: string;
}

/** External map + navigation links for a pinned location. */
export const LocationDirectionLinks = ({ lat, lng, className = '' }: LocationDirectionLinksProps) => (
  <div className={`flex flex-wrap gap-2 ${className}`}>
    <a
      href={buildGoogleMapsSearchUrl(lat, lng)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
    >
      <GoogleMapsIcon className="h-4 w-4" />
      Open in Maps
    </a>
    <a
      href={buildGoogleDriveUrl(lat, lng)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
    >
      <GoogleMapsIcon className="h-4 w-4" />
      Get directions
    </a>
    <a
      href={buildWazeDriveUrl(lat, lng)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
    >
      <WazeIcon className="h-4 w-4" />
      Waze
    </a>
  </div>
);
