import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';

type UiTooltipProps = {
  label: string;
  children: ReactElement;
  /** Prefer `right` on vertical chrome such as the sidebar resize grip. */
  side?: 'bottom' | 'right';
  className?: string;
};

type TooltipChildProps = {
  onMouseEnter?: (event: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
};

const canHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Hover / focus label for icon-only controls (portaled so overflow-hidden parents cannot clip it). */
export const UiTooltip = ({ label, children, side = 'bottom', className }: UiTooltipProps) => {
  const tooltipId = useId();
  const hideTimer = useRef<number>(0);
  const showTimer = useRef<number>(0);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });

  useEffect(
    () => () => {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
    },
    []
  );

  if (!label || !isValidElement(children)) return children;

  const place = (el: HTMLElement) => {
    const box = el.getBoundingClientRect();
    if (side === 'right') {
      setCoords({ left: box.right + 10, top: box.top + box.height / 2 });
      return;
    }
    setCoords({ left: box.left + box.width / 2, top: box.bottom + 8 });
  };

  const show = (el: EventTarget | null) => {
    if (!canHover() || !(el instanceof HTMLElement)) return;
    place(el);
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(showTimer.current);
    showTimer.current = window.setTimeout(() => setOpen(true), 220);
  };

  const hide = () => {
    window.clearTimeout(showTimer.current);
    hideTimer.current = window.setTimeout(() => setOpen(false), 40);
  };

  const childProps = children.props as TooltipChildProps;

  const child = cloneElement(children, {
    'aria-describedby': open ? tooltipId : undefined,
    onMouseEnter: (event: MouseEvent<HTMLElement>) => {
      childProps.onMouseEnter?.(event);
      show(event.currentTarget);
    },
    onMouseLeave: (event: MouseEvent<HTMLElement>) => {
      childProps.onMouseLeave?.(event);
      hide();
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      childProps.onFocus?.(event);
      show(event.currentTarget);
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      childProps.onBlur?.(event);
      hide();
    },
  } as TooltipChildProps & { 'aria-describedby'?: string });

  return (
    <span className={className ?? 'contents'}>
      {child}
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              className={`ui-tooltip-bubble pointer-events-none fixed z-[6000] font-semibold ${
                side === 'right' ? '-translate-y-1/2' : '-translate-x-1/2'
              }`}
              style={{ left: coords.left, top: coords.top }}
            >
              {label}
            </div>,
            document.body
          )
        : null}
    </span>
  );
};
