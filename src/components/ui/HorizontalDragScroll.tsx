import { useRef, type ReactNode } from 'react';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll';

type HorizontalDragScrollProps = {
  className?: string;
  children: ReactNode;
};

/** Overflow-x row: native swipe on touch, mouse drag + wheel on desktop. */
export const HorizontalDragScroll = ({ className = '', children }: HorizontalDragScrollProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useHorizontalDragScroll(ref);
  return (
    <div ref={ref} className={`min-w-0 w-full max-w-full overflow-x-auto overscroll-x-contain ${className}`}>
      {children}
    </div>
  );
};
