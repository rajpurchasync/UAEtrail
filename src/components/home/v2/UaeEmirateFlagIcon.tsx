import { UaeFlagIcon } from '../../ui/UaeFlagIcon';

export type HomeEmirateFilterId =
  | 'all'
  | 'dubai'
  | 'abu-dhabi'
  | 'sharjah'
  | 'rak'
  | 'fujairah'
  | 'ajman'
  | 'uaq';

type Props = {
  emirateId: HomeEmirateFilterId;
  className?: string;
  title?: string;
};

const mini =
  'h-3.5 w-[1.05rem] shrink-0 rounded-[1px] shadow-sm ring-1 ring-black/10 overflow-hidden';

/** Simplified emirate flags for marketing filters (not heraldic accuracy at 14px). */
export const UaeEmirateFlagIcon = ({ emirateId, className, title }: Props) => {
  if (emirateId === 'all') {
    return <UaeFlagIcon className={className ?? mini} title={title} />;
  }

  const svgClass = className ?? mini;
  const label = title ?? emirateId;

  switch (emirateId) {
    case 'dubai':
      return (
        <svg className={svgClass} viewBox="0 0 21 15" role="img" aria-label={label}>
          <rect width="5" height="15" fill="#FFFFFF" />
          <rect x="5" width="16" height="15" fill="#CE1126" />
        </svg>
      );
    case 'abu-dhabi':
      return (
        <svg className={svgClass} viewBox="0 0 21 15" role="img" aria-label={label}>
          <rect width="6" height="15" fill="#FF0000" />
          <rect x="6" width="15" height="5" fill="#00732F" />
          <rect x="6" y="5" width="15" height="5" fill="#FFFFFF" />
          <rect x="6" y="10" width="15" height="5" fill="#000000" />
        </svg>
      );
    case 'sharjah':
    case 'ajman':
    case 'uaq':
      return (
        <svg className={svgClass} viewBox="0 0 21 15" role="img" aria-label={label}>
          <rect width="5" height="15" fill="#FFFFFF" />
          <rect x="5" width="16" height="15" fill="#CE1126" />
        </svg>
      );
    case 'rak':
      return (
        <svg className={svgClass} viewBox="0 0 21 15" role="img" aria-label={label}>
          <rect width="5" height="15" fill="#FFFFFF" />
          <rect x="5" width="16" height="5" fill="#CE1126" />
          <rect x="5" y="5" width="16" height="5" fill="#FFFFFF" />
          <rect x="5" y="10" width="16" height="5" fill="#007A3D" />
        </svg>
      );
    case 'fujairah':
      return (
        <svg className={svgClass} viewBox="0 0 21 15" role="img" aria-label={label}>
          <rect width="5" height="15" fill="#FFFFFF" />
          <rect x="5" width="16" height="15" fill="#CE1126" />
          <rect x="8" y="5" width="10" height="5" fill="#007A3D" />
        </svg>
      );
    default:
      return <UaeFlagIcon className={svgClass} title={label} />;
  }
};
