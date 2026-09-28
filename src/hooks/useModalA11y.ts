import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Focus trap, Escape to close, scroll lock, and focus restore for modal surfaces. */
export const useModalA11y = (open: boolean, onClose: () => void, panelRef: RefObject<HTMLElement | null>) => {
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    let focusDelayId: number | undefined;
    const focusFirst = () => {
      const preferred = panel?.querySelector<HTMLElement>('[data-flow-primary-field]');
      const nodes = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
      const target = preferred ?? nodes?.[0];
      if (!target) return;

      const run = () => target.focus({ preventScroll: true });
      if (preferred && window.matchMedia('(pointer: coarse)').matches) {
        focusDelayId = window.setTimeout(run, 80);
        return;
      }
      run();
    };
    const timer = window.setTimeout(focusFirst, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      if (focusDelayId !== undefined) window.clearTimeout(focusDelayId);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [open, panelRef]);
};
