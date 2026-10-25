import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_SCROLL_ROOT_ID, getAppScrollContainers } from '../config/layoutScroll';

const SCROLL_EDGE_PX = 8;

export const readAppScrollFrosted = (containers: HTMLElement[]): boolean =>
  containers.some((el) => el.scrollTop > SCROLL_EDGE_PX);

/** True when any product scroll pane has moved below the top edge. */
export const useAppScrollFrostedHeader = (): boolean => {
  const { pathname } = useLocation();
  const [frosted, setFrosted] = useState(false);

  useEffect(() => {
    setFrosted(false);

    const observed = new Set<HTMLElement>();
    const cleanups: (() => void)[] = [];

    const update = () => {
      setFrosted(readAppScrollFrosted(getAppScrollContainers()));
    };

    const bindElement = (el: HTMLElement) => {
      if (observed.has(el)) return;
      observed.add(el);
      el.addEventListener('scroll', update, { passive: true });
      const resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(el);
      cleanups.push(() => {
        el.removeEventListener('scroll', update);
        resizeObserver.disconnect();
        observed.delete(el);
      });
    };

    const rebindAll = () => {
      for (const el of getAppScrollContainers()) {
        bindElement(el);
      }
      update();
    };

    rebindAll();

    const root = document.getElementById(APP_SCROLL_ROOT_ID);
    const mutationObserver = new MutationObserver(() => {
      rebindAll();
    });
    const bodyClassObserver = new MutationObserver(() => {
      rebindAll();
    });
    if (root) {
      mutationObserver.observe(root, { childList: true, subtree: true });
      bodyClassObserver.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    const raf = window.requestAnimationFrame(() => {
      rebindAll();
    });

    return () => {
      window.cancelAnimationFrame(raf);
      mutationObserver?.disconnect();
      bodyClassObserver?.disconnect();
      while (cleanups.length > 0) {
        cleanups.pop()?.();
      }
    };
  }, [pathname]);

  return frosted;
};
