import { Building2, Car, Mountain, ShoppingBag, Sparkles, Tent } from 'lucide-react';
import type { AddVenueKind } from '../../addTypes';
import type { AddFlowStepId } from '../addFlow';
import { ComposeWizardPrimaryButton } from '../ComposeWizardPrimaryButton';

export const ADD_KIND_LABELS: Record<AddVenueKind, { title: string; icon: typeof Mountain }> = {
  hiking: { title: 'Hiking Trails', icon: Mountain },
  camping: { title: 'Camping Spots', icon: Tent },
  shop: { title: 'Shops', icon: ShoppingBag },
  event: { title: 'Others', icon: Sparkles },
  rideshare: { title: 'Rideshare', icon: Car },
  facility: { title: 'Facility', icon: Building2 },
};

export const ADD_REVIEW_EDIT_LABELS: Partial<Record<AddFlowStepId, string>> = {
  title: 'Title',
  curatedDestination: 'Destination',
  location: 'Location',
  surface: 'Surface',
  image: 'Photos',
  description: 'Description',
  about: 'About',
  trail_stats: 'Distance',
  transport: 'Transport',
  difficulty: 'Difficulty',
  parking: 'Parking',
  contact: 'Contact',
  shop_keywords: 'Keywords',
  shop_delivery: 'Delivery',
  shop_phone: 'Phone',
  shop_email: 'Email',
};

export const AddWizardNextButton = ({
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
    onClick={onClick}
    tone="flow"
  />
);
