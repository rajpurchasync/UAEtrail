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
  'h-3.5 w-[1.05rem] shrink-0 rounded-[2px] shadow-sm ring-2 ring-neutral-400/80 overflow-hidden';

const RED = '#CE1126';

/**
 * Simplified emirate flags for marketing chips (~14px).
 * Layouts follow https://en.wikipedia.org/wiki/List_of_Emirati_flags (emirate section).
 */
export const UaeEmirateFlagIcon = ({ emirateId, className, title }: Props) => {
  if (emirateId === 'all') {
    return <UaeFlagIcon className={className ?? mini} title={title} />;
  }

  const svgClass = className ?? mini;
  const label = title ?? emirateId;

  switch (emirateId) {
    /** Red field, white rectangle at the canton (hoist). */
    case 'abu-dhabi':
      return (
        <svg className={svgClass} viewBox="0 0 21 15" role="img" aria-label={label}>
          <rect width="21" height="15" fill={RED} />
          <rect width="7" height="7.5" fill="#FFFFFF" />
        </svg>
      );
    /** Red field, white vertical bar at the hoist (Bani Yas / coastal emirates). */
    case 'dubai':
    case 'ajman':
      return (
        <svg className={svgClass} viewBox="0 0 21 15" role="img" aria-label={label}>
          <rect width="5" height="15" fill="#FFFFFF" />
          <rect x="5" width="16" height="15" fill={RED} />
        </svg>
      );
    /** Large red rectangle on a white field (Sharjah & RAK). */
    case 'sharjah':
    case 'rak':
      return (
        <svg className={svgClass} viewBox="0 0 21 15" role="img" aria-label={label}>
          <rect width="21" height="15" fill="#FFFFFF" />
          <rect x="4" y="2.5" width="15" height="10" fill={RED} />
        </svg>
      );
    /** Red field, white hoist bar, green band (simplified modern Fujairah). */
    case 'fujairah':
      return (
        <svg className={svgClass} viewBox="0 0 21 15" role="img" aria-label={label}>
          <rect width="5" height="15" fill="#FFFFFF" />
          <rect x="5" width="16" height="15" fill={RED} />
          <rect x="5" y="6" width="16" height="3" fill="#007A3D" />
        </svg>
      );
    /** Red field, white hoist bar, star and crescent on the fly. */
    case 'uaq':
      return (
        <svg className={svgClass} viewBox="0 0 21 15" role="img" aria-label={label}>
          <rect width="5" height="15" fill="#FFFFFF" />
          <rect x="5" width="16" height="15" fill={RED} />
          <circle cx="13.5" cy="7.5" r="2.8" fill="#FFFFFF" />
          <circle cx="14.4" cy="7.5" r="2.3" fill={RED} />
          <polygon points="16.2,7.5 16.9,7.1 16.6,7.9 17.4,8.1 16.5,8.3 16.2,9.1 15.9,8.3 15,8.1 15.8,7.9 15.5,7.1" fill="#FFFFFF" />
        </svg>
      );
    default:
      return <UaeFlagIcon className={svgClass} title={label} />;
  }
};
