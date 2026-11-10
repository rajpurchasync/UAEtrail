import { useEffect, useRef, type ReactNode } from 'react';

/** Fire once when a below-the-fold profile block nears the viewport. */
export const MemberProfileDeferredSectionAnchor = ({
  onVisible,
  active,
  minHeightClass = 'min-h-[5rem]',
  children,
}: {
  onVisible: () => void;
  active: boolean;
  minHeightClass?: string;
  children?: ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const notified = useRef(false);

  useEffect(() => {
    if (!active || notified.current) return;
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      notified.current = true;
      onVisible();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || notified.current) return;
        notified.current = true;
        onVisible();
        observer.disconnect();
      },
      { rootMargin: '320px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active, onVisible]);

  return (
    <div ref={ref} className={minHeightClass}>
      {children}
    </div>
  );
};
