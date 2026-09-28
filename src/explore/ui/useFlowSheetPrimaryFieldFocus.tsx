import { useEffect, useRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export const FLOW_PRIMARY_FIELD_ATTR = 'data-flow-primary-field';

const isCoarsePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/** Focus the step’s main text field after the sheet mounts (mobile keyboard). */
export const useFlowSheetPrimaryFieldFocus = <T extends HTMLInputElement | HTMLTextAreaElement>(
  active: boolean
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active || !isCoarsePointer()) return;
    const el = ref.current;
    if (!el) return;

    const focusField = () => {
      el.focus({ preventScroll: true });
    };

    const timer = window.setTimeout(focusField, 80);
    return () => window.clearTimeout(timer);
  }, [active]);

  return ref;
};

type FlowStepTextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  focusOnMount?: boolean;
};

export const FlowStepTextInput = ({ focusOnMount = true, ...props }: FlowStepTextInputProps) => {
  const ref = useFlowSheetPrimaryFieldFocus<HTMLInputElement>(focusOnMount);
  return (
    <input
      ref={ref}
      data-flow-primary-field=""
      enterKeyHint="next"
      autoComplete="off"
      {...props}
    />
  );
};

type FlowStepTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  focusOnMount?: boolean;
};

export const FlowStepTextArea = ({ focusOnMount = true, ...props }: FlowStepTextAreaProps) => {
  const ref = useFlowSheetPrimaryFieldFocus<HTMLTextAreaElement>(focusOnMount);
  return (
    <textarea ref={ref} data-flow-primary-field="" autoComplete="off" {...props} />
  );
};
