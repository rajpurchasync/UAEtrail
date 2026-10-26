import { ComposeWizardPrimaryButton } from '../ComposeWizardPrimaryButton';

export const HostingWizardNextButton = ({
  label = 'Next',
  disabled,
  loading,
  onClick,
}: {
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) => (
  <ComposeWizardPrimaryButton
    label={label}
    disabled={disabled}
    loading={loading}
    loadingLabel="Publishing…"
    onClick={onClick}
    tone="host"
  />
);
