import { useEffect, useState, type RefObject } from 'react';
import { resolveConsumerDetailScrollChrome } from './resolveConsumerDetailScrollChrome';

export type ConsumerDetailScrollChrome = {
  /** User has scrolled — show frosted sticky header over content. */
  headerFrosted: boolean;
  /** Content still scrolls under the footer — keep frosted bar. */
  footerFrosted: boolean;
};

/** Frost header/footer only when scroll position leaves content behind the chrome. */
export const useConsumerDetailScrollChrome = (
  scrollRef: RefObject<HTMLElement | null>,
  contentRef?: RefObject<HTMLElement | null>
): ConsumerDetailScrollChrome => {
  const [chrome, setChrome] = useState<ConsumerDetailScrollChrome>({
    headerFrosted: false,
    footerFrosted: false,
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      setChrome(resolveConsumerDetailScrollChrome(el));
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    const contentEl = contentRef?.current;
    if (contentEl) resizeObserver.observe(contentEl);

    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(el, { childList: true, subtree: true, attributes: true });

    return () => {
      el.removeEventListener('scroll', update);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [scrollRef, contentRef]);

  return chrome;
};
