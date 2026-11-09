import { useCallback, useEffect, useState, type RefObject } from 'react';
import { ArrowUp } from 'lucide-react';

const SHOW_AFTER_PX = 280;

type ConsumerDetailScrollToTopProps = {
  scrollRef: RefObject<HTMLElement | null>;
  /** Reserve space above a sticky footer CTA bar. */
  reserveFooter?: boolean;
};

/** Floating control on consumer detail scroll surfaces — scrolls the modal body to top. */
export const ConsumerDetailScrollToTop = ({
  scrollRef,
  reserveFooter = false,
}: ConsumerDetailScrollToTopProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setVisible(el.scrollTop > SHOW_AFTER_PX);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [scrollRef]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`pointer-events-auto absolute z-20 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200/90 bg-white/95 text-neutral-800 shadow-[0_4px_18px_rgba(15,23,42,.14)] backdrop-blur-sm transition hover:border-emerald-200 hover:text-emerald-900 active:scale-[0.97] end-4 dark:border-neutral-600 dark:bg-neutral-900/95 dark:text-neutral-100 dark:hover:border-emerald-700 dark:hover:text-emerald-200 ${
        reserveFooter
          ? 'max-lg:bottom-[calc(var(--detail-footer-pad,6.5rem)+env(safe-area-inset-bottom,0px)+0.35rem)] md:bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]'
          : 'bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]'
      }`}
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </button>
  );
};
