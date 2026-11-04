import { useComposeWizardEnterSubmit } from './useComposeWizardEnterSubmit';
import { exploreFlowComposePrimaryClass } from './exploreFlowUi';

export type ComposeWizardPrimaryButtonProps = {
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  onClick: () => void;
  /** Host organize flows use emerald-600; seek/add use emerald-500. */
  tone?: 'host' | 'flow';
};

export const ComposeWizardPrimaryButton = ({
  label = 'Next',
  disabled,
  loading,
  loadingLabel,
  onClick,
  tone = 'flow',
}: ComposeWizardPrimaryButtonProps) => {
  useComposeWizardEnterSubmit(onClick, { disabled, loading });

  const busy =
    loadingLabel ??
    (label === 'Submit' || label === 'Submit for review' ? 'Submitting…' : 'Working…');

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={exploreFlowComposePrimaryClass(tone)}
    >
      {loading ? busy : `${label} →`}
    </button>
  );
};
