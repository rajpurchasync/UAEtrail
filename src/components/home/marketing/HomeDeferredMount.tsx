import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Mount children when near the viewport — keeps initial `/` work focused on hero + header. */
export const HomeDeferredMount = ({
  children,
  minHeightClass = 'min-h-[min(28rem,55vh)]',
  rootMargin = '280px 0px'
}: {
  children: ReactNode;
  minHeightClass?: string;
  rootMargin?: string;
}) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const node = anchorRef.current;
    if (!node || mounted) return;

    if (typeof IntersectionObserver === 'undefined') {
      setMounted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [mounted, rootMargin]);

  if (!mounted) {
    return <div ref={anchorRef} className={minHeightClass} aria-hidden />;
  }

  return <div ref={anchorRef}>{children}</div>;
};
