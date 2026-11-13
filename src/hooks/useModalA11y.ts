import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let modalLayerSeq = 0;
let openModalCount = 0;
const modalEscapeStack: { id: number; onEscape: () => void }[] = [];

const registerModalEscapeLayer = (onEscape: () => void): number => {
  const id = ++modalLayerSeq;
  modalEscapeStack.push({ id, onEscape });
  return id;
};

const unregisterModalEscapeLayer = (id: number): void => {
  const idx = modalEscapeStack.findIndex((layer) => layer.id === id);
  if (idx >= 0) modalEscapeStack.splice(idx, 1);
};

const isTopModalEscapeLayer = (id: number): boolean =>
  modalEscapeStack[modalEscapeStack.length - 1]?.id === id;

/** Clear stacked modal state after navigation or a crashed unmount (unlocks document scroll). */
export const resetModalA11yState = (): void => {
  modalEscapeStack.length = 0;
  openModalCount = 0;
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
};

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
    const layerId = registerModalEscapeLayer(() => onCloseRef.current());

    openModalCount += 1;
    if (openModalCount === 1) {
      document.body.style.overflow = 'hidden';
    }

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
        if (isTopModalEscapeLayer(layerId)) {
          event.preventDefault();
          onCloseRef.current();
        }
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

    return () => {
      window.clearTimeout(timer);
      if (focusDelayId !== undefined) window.clearTimeout(focusDelayId);
      document.removeEventListener('keydown', onKeyDown);
      unregisterModalEscapeLayer(layerId);
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        document.body.style.overflow = '';
      }
      try {
        previousFocus.current?.focus({ preventScroll: true });
      } catch {
        // Focus target may have unmounted during route change.
      }
    };
  }, [open, panelRef]);
};
