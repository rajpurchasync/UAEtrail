import type { HomeLandingActivity } from '../content/homeLanding';
import { HOME_ACTIVITIES } from '../content/homeMarketing';
import type { ActivityCardProps } from '../components/home/marketing/ActivityCard';
import type { PriceTagVariant } from '../components/home/marketing/PriceTag';
import { activityPriceLabel, inferActivityPricingMode } from './activityPricing';
import { emirateIdFromRegion } from './homeLandingEmirate';

const toStartsAtIso = (activity: HomeLandingActivity): string => {
  const time = activity.time?.trim() || '09:00';
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return `${activity.date}T${normalizedTime}`;
};

const toPriceVariant = (activity: HomeLandingActivity): PriceTagVariant => {
  const mode = activity.pricingMode ?? inferActivityPricingMode(activity);
  if (mode === 'free') return 'free';
  if (mode === 'shared') return 'cost-shared';
  return 'paid';
};

const toPriceLabel = (activity: HomeLandingActivity): string => {
  const mode = activity.pricingMode ?? inferActivityPricingMode(activity);
  if (mode === 'free') return 'Free';
  const amount = activityPriceLabel(activity);
  const modeLabel = mode === 'shared' ? 'Cost shared' : 'Paid';
  if (amount === 'Free' || !amount) return modeLabel;
  return `${modeLabel} · ${amount}`;
};

const toPriceDefinition = (variant: PriceTagVariant): string => {
  if (variant === 'free') return HOME_ACTIVITIES.priceDefinitions.free;
  if (variant === 'cost-shared') return HOME_ACTIVITIES.priceDefinitions.shared;
  return HOME_ACTIVITIES.priceDefinitions.paid;
};

export const mapHomeLandingActivityToCard = (
  activity: HomeLandingActivity
): ActivityCardProps & { emirateId: string | null } => {
  const variant = toPriceVariant(activity);
  const href = activity.path.startsWith('/') ? activity.path : `/activity/${activity.id}`;
  return {
    href,
    title: activity.title,
    description: activity.description,
    imageUrl: activity.coverImageUrl,
    imageAlt: `${activity.title} in ${activity.region}`,
    emirate: activity.region,
    startsAt: toStartsAtIso(activity),
    priceVariant: variant,
    priceLabel: toPriceLabel(activity),
    priceDefinition: toPriceDefinition(variant),
    emirateId: emirateIdFromRegion(activity.region)
  };
};
