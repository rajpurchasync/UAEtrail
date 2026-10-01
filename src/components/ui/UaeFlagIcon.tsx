type UaeFlagIconProps = {
  className?: string;
  title?: string;
};

/** UAE flag — SVG so Windows/desktop shows a flag (emoji 🇦🇪 often renders as “AE”). */
export const UaeFlagIcon = ({
  className = 'h-3.5 w-[1.3125rem] shrink-0 rounded-[1px] shadow-sm ring-1 ring-black/10',
  title,
}: UaeFlagIconProps) => (
  <svg
    className={className}
    viewBox="0 0 21 15"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-hidden={title ? undefined : true}
    aria-label={title}
  >
    <rect width="21" height="5" fill="#00732F" />
    <rect y="5" width="21" height="5" fill="#FFFFFF" />
    <rect y="10" width="21" height="5" fill="#000000" />
    <rect width="6" height="15" fill="#FF0000" />
  </svg>
);
