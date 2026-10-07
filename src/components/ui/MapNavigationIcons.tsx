export const GoogleMapsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M12 2.2C8.2 2.2 5.1 5.3 5.1 9.1c0 4.8 6.9 12.7 6.9 12.7s6.9-7.9 6.9-12.7c0-3.8-3.1-6.9-6.9-6.9Z" fill="#EA4335" />
    <path d="M12 2.2v19.6s6.9-7.9 6.9-12.7c0-3.8-3.1-6.9-6.9-6.9Z" fill="#FBBC05" />
    <path d="M12 2.2C8.2 2.2 5.1 5.3 5.1 9.1c0 4.8 6.9 12.7 6.9 12.7V2.2Z" fill="#34A853" />
    <circle cx="12" cy="9.1" r="3" fill="#4285F4" />
  </svg>
);

export const WazeIcon = ({ className }: { className?: string }) => (
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

export const AppleMapsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="4" fill="#F2F2F7" />
    <path
      d="M12 6.5c-2.5 0-4.2 1.7-4.2 3.9 0 2.8 4.2 7.1 4.2 7.1s4.2-4.3 4.2-7.1c0-2.2-1.7-3.9-4.2-3.9Z"
      fill="#34C759"
    />
    <circle cx="12" cy="10.2" r="1.6" fill="#ffffff" />
  </svg>
);

export const navigationAppIcon = (app: 'google' | 'waze' | 'apple', className = 'h-5 w-5') => {
  switch (app) {
    case 'waze':
      return <WazeIcon className={className} />;
    case 'apple':
      return <AppleMapsIcon className={className} />;
    default:
      return <GoogleMapsIcon className={className} />;
  }
};
