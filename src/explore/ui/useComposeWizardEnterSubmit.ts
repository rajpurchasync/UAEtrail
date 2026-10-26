import { useEffect } from 'react';

const enterShouldSubmitFromTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return true;
  if (target.tagName === 'TEXTAREA') return false;
  if (target.isContentEditable) return false;
  return true;
};

/** Enter key triggers the step primary action (Next / Submit) in compose wizards. */
export const useComposeWizardEnterSubmit = (
  onSubmit: () => void,
  options?: { disabled?: boolean; loading?: boolean; enabled?: boolean }
): void => {
  const disabled = Boolean(options?.disabled);
  const loading = Boolean(options?.loading);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled || disabled || loading) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (!enterShouldSubmitFromTarget(event.target)) return;
      event.preventDefault();
      onSubmit();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, disabled, loading, onSubmit]);
};
