import { useComposeWizardEnterSubmit } from './useComposeWizardEnterSubmit';

export type ComposeWizardPrimaryButtonProps = {
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  onClick: () => void;
  /** Host organize flows use emerald-600; seek/add use emerald-500. */
  tone?: 'host' | 'flow';
};

const toneClass = {
  host: 'bg-emerald-600 shadow-emerald-600/25',
  flow: 'bg-emerald-500 shadow-emerald-500/25',
} as const satisfies Record<NonNullable<ComposeWizardPrimaryButtonProps['tone']>, string>;

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
      className={`w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${toneClass[tone]}`}
    >
      {loading ? busy : `${label} →`}
    </button>
  );
};
