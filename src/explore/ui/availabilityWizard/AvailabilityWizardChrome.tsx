import { ComposeWizardPrimaryButton } from '../ComposeWizardPrimaryButton';
import {
  ComposeMapEntryRow,
  COMPOSE_MAP_INTENTS,
  formatComposeMapCoord,
} from '../../create/interactions';
import { fromLocationLabel, TO_LOCATION_LABEL } from '../../createFlowCopy';
import type { AvailabilityWizardContext } from './availabilityWizardContext';

export const AvailabilityWizardNextButton = ({
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
    loadingLabel="Posting…"
    onClick={onClick}
    tone="flow"
  />
);

export const availabilityMapPinRow = (
  ctx: AvailabilityWizardContext,
  endpoint: 'from' | 'to',
  options: { title: string; accent: 'emerald' | 'sky' }
) => {
  const isTo = endpoint === 'to';
  const placed = isTo ? ctx.draft.toPinPlaced : ctx.draft.fromPinPlaced;
  const lat = isTo ? ctx.draft.toLatitude : ctx.draft.latitude;
  const lng = isTo ? ctx.draft.toLongitude : ctx.draft.longitude;
  return (
    <ComposeMapEntryRow
      key={endpoint}
      title={options.title}
      subtitle={formatComposeMapCoord(lat, lng, placed)}
      placed={placed}
      accent={options.accent}
      onOpen={() => ctx.openMap(isTo ? COMPOSE_MAP_INTENTS.seekTo : COMPOSE_MAP_INTENTS.seekFrom)}
    />
  );
};

export const availabilityRoutePinRow = (ctx: AvailabilityWizardContext, endpoint: 'from' | 'to') => {
  const isTo = endpoint === 'to';
  const placed = isTo ? ctx.draft.toPinPlaced : ctx.draft.fromPinPlaced;
  const lat = isTo ? ctx.draft.toLatitude : ctx.draft.latitude;
  const lng = isTo ? ctx.draft.toLongitude : ctx.draft.longitude;
  return (
    <ComposeMapEntryRow
      key={endpoint}
      title={isTo ? TO_LOCATION_LABEL : fromLocationLabel(ctx.kind === 'rideshare' ? 'rideshare' : 'default')}
      subtitle={formatComposeMapCoord(lat, lng, placed)}
      placed={placed}
      accent={isTo ? 'sky' : 'emerald'}
      onOpen={() => ctx.openMap(isTo ? COMPOSE_MAP_INTENTS.seekTo : COMPOSE_MAP_INTENTS.seekFrom)}
    />
  );
};
