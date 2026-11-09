import { useEffect, useState, type RefObject } from 'react';
import { resolveDetailScrollChrome } from './resolveDetailScrollChrome';

export type DetailScrollChrome = {
  headerFrosted: boolean;
  footerFrosted: boolean;
};

export const useDetailScrollChrome = (
  scrollRef: RefObject<HTMLElement | null>,
  contentRef?: RefObject<HTMLElement | null>
): DetailScrollChrome => {
  const [chrome, setChrome] = useState<DetailScrollChrome>({
    headerFrosted: false,
    footerFrosted: false,
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      setChrome(resolveDetailScrollChrome(el));
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
