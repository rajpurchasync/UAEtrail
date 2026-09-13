import type { HostProfileType } from '@uaetrail/shared-types';
import { isValidNationalPhone } from '../../utils/phone';
import type { BecomeHostFormState } from './becomeHostForm';

export type HostFlowStepId =
  | 'name'
  | 'about'
  | 'photo'
  | 'contact'
  | 'details'
  | 'services'
  | 'presence'
  | 'location'
  | 'review';

export type HostFlowStep = 'pick' | HostFlowStepId;

/** How the host wizard was opened — drives sheet title and submit label. */
export type HostFlowIntent = 'become-host' | 'add-guide' | 'add-shop' | 'add-agency';

export const hostFlowIntentProfileType = (intent: HostFlowIntent): HostProfileType | null => {
  if (intent === 'add-shop') return 'shop';
  if (intent === 'add-agency') return 'agency';
  if (intent === 'add-guide') return 'individual';
  return null;
};

export const parseHostFlowIntent = (value: string | null | undefined): HostFlowIntent => {
  if (value === 'add-shop') return 'add-shop';
  if (value === 'add-agency') return 'add-agency';
  if (value === 'add-guide') return 'add-guide';
  return 'become-host';
};

export const PROFILE_TYPE_OPTIONS: Array<{
  key: HostProfileType;
  title: string;
  subtitle: string;
  emoji: string;
}> = [
  { key: 'individual', title: 'Individual', subtitle: 'Free & shared community activities', emoji: '👤' },
  { key: 'agency', title: 'Agency', subtitle: 'Licensed business — paid trips', emoji: '🏢' },
  { key: 'shop', title: 'Shop', subtitle: 'Physical store or online gear partner', emoji: '🛍️' },
];

export const getHostFlowSteps = (profileType: HostProfileType, form?: BecomeHostFormState): HostFlowStepId[] => {
  switch (profileType) {
    case 'individual':
      return ['name', 'about', 'photo', 'contact', 'details', 'review'];
    case 'agency':
      return ['name', 'about', 'contact', 'photo', 'services', 'location', 'review'];
    case 'shop': {
      const steps: HostFlowStepId[] = ['name', 'about', 'contact', 'photo', 'presence'];
      if (form?.shopPresence === 'physical') steps.push('location');
      steps.push('review');
      return steps;
    }
    default:
      return [];
  }
};

export const hostFlowStepTitle = (step: HostFlowStepId, profileType: HostProfileType): string => {
  switch (step) {
    case 'name':
      return profileType === 'individual' ? 'Your name' : profileType === 'agency' ? 'Agency name' : 'Shop name';
    case 'about':
      return 'About you';
    case 'photo':
      return profileType === 'individual' ? 'Profile photo' : profileType === 'agency' ? 'Agency image' : 'Shop image';
    case 'contact':
      return 'Contact';
    case 'details':
      return 'Background';
    case 'services':
      return 'Services';
    case 'presence':
      return 'How do you sell?';
    case 'location':
      return profileType === 'agency' ? 'Office location' : 'Store location';
    case 'review':
      return 'Review & submit';
    default:
      return 'Organisation profile';
  }
};

export const locationPickerTitle = (profileType: HostProfileType): string =>
  profileType === 'agency' ? 'Office location' : 'Pin your store';

/** Sheet header title for the whole flow (not per-step). */
export const hostFlowTitle = (intent: HostFlowIntent, step: HostFlowStep): string => {
  if (intent === 'add-shop') return 'Share your shop';
  if (intent === 'add-agency') return 'Join as an agency';
  if (intent === 'add-guide') return 'Become a guide';
  if (step === 'pick') return 'How do you want to show up?';
  return 'Tell us about you';
};

export const hostFlowSubmitLabel = (intent: HostFlowIntent): string => {
  if (intent === 'add-shop') return 'Add my shop';
  if (intent === 'add-agency') return 'Join as an agency';
  if (intent === 'add-guide') return 'Start guiding';
  return 'All done — submit';
};

export const hostFlowPickSubtitle = (intent: HostFlowIntent): string => {
  if (intent === 'add-shop') return 'Help hikers and campers find your gear when they\'re planning a trip.';
  if (intent === 'add-agency') return 'Connect with people looking for guided adventures across the UAE.';
  if (intent === 'add-guide') return 'Share the trails and camps you love — free meetups and shared trips welcome.';
  return 'Individual guide, licensed agency, or gear shop — pick whatever fits you best.';
};

export const validateHostFlowStep = (
  step: HostFlowStepId,
  form: BecomeHostFormState
): string | null => {
  const profileType = form.hostProfileType;
  if (!profileType) return 'Pick how you\'d like to show up — guide, agency, or shop.';

  switch (step) {
    case 'name': {
      const value = profileType === 'individual' ? form.hostDisplayName : form.requestedName;
      if (!value.trim()) return profileType === 'individual' ? 'What should we call you?' : 'What\'s the name?';
      return null;
    }
    case 'about':
      if (form.bio.trim().length < 20) return 'Tell us a bit more about yourself (20+ characters).';
      return null;
    case 'photo':
      if (!form.profilePhoto.trim()) {
        return profileType === 'individual'
          ? 'Add a photo so people know who you are.'
          : profileType === 'agency'
            ? 'Add a photo for your agency.'
            : 'Add a photo for your shop.';
      }
      return null;
    case 'contact':
      if (!isValidNationalPhone(form.phone)) return 'Add a valid mobile number so people can reach you.';
      if (profileType === 'shop' && form.shopPresence === 'online' && !form.website.trim()) {
        return 'Add your shop website so explorers can visit you.';
      }
      if (form.website.trim()) {
        try {
          const url = new URL(form.website.trim());
          if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return 'Website links should start with http:// or https://';
          }
        } catch {
          return 'That website link doesn\'t look right — try again.';
        }
      }
      return null;
    case 'details':
      if (!form.nationality) return 'Where are you from?';
      if (!form.residence) return 'Where are you based in the UAE?';
      if (!form.languages.trim()) return 'Which languages do you speak?';
      return null;
    case 'services':
      if (!form.services.trim()) return 'What trips or services do you offer?';
      return null;
    case 'presence':
      if (profileType !== 'shop') return null;
      if (form.shopPresence !== 'physical' && form.shopPresence !== 'online') {
        return 'Choose physical store or online partner.';
      }
      return null;
    case 'location':
      if (profileType === 'shop' && form.shopPresence === 'online') return null;
      if (form.latitude == null || form.longitude == null) return 'Pin where you\'re based on the map.';
      return null;
    case 'review':
      return null;
    default:
      return null;
  }
};

