import type { HostProfileType } from '@uaetrail/shared-types';
import { isValidNationalPhone } from '../../utils/phone';
import {
  type BecomeHostFormState,
  isAtLeastHostAge,
  maxDateOfBirthForHost,
} from './becomeHostForm';

export type HostFlowStepId =
  | 'name'
  | 'dob'
  | 'about'
  | 'photo'
  | 'contact'
  | 'details'
  | 'services'
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
  { key: 'individual', title: 'Guide', subtitle: 'Free & shared community activities', emoji: '👤' },
  { key: 'agency', title: 'Agency', subtitle: 'Licensed business — paid trips', emoji: '🏢' },
  { key: 'shop', title: 'Shop', subtitle: 'Gear shop pin on the map', emoji: '🛍️' },
];

export const getHostFlowSteps = (profileType: HostProfileType): HostFlowStepId[] => {
  switch (profileType) {
    case 'individual':
      return ['name', 'dob', 'about', 'photo', 'contact', 'details', 'review'];
    case 'agency':
      return ['name', 'about', 'contact', 'photo', 'services', 'location', 'review'];
    case 'shop':
      return ['name', 'about', 'contact', 'photo', 'location', 'review'];
    default:
      return [];
  }
};

export const hostFlowStepTitle = (step: HostFlowStepId, profileType: HostProfileType): string => {
  switch (step) {
    case 'name':
      return profileType === 'individual' ? 'Your name' : profileType === 'agency' ? 'Agency name' : 'Shop name';
    case 'dob':
      return 'Date of birth';
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
    case 'location':
      return 'Pin location';
    case 'review':
      return 'Review & submit';
    default:
      return 'Host profile';
  }
};

export const locationPickerTitle = (profileType: HostProfileType): string =>
  profileType === 'agency' ? 'Pin your agency' : 'Pin your shop';

/** Sheet header title for the whole flow (not per-step). */
export const hostFlowTitle = (intent: HostFlowIntent, step: HostFlowStep): string => {
  if (intent === 'add-shop') return 'List a shop';
  if (intent === 'add-agency') return 'Register agency';
  if (intent === 'add-guide') return 'Become a guide';
  if (step === 'pick') return 'How do you host?';
  return 'Set up profile';
};

export const hostFlowSubmitLabel = (intent: HostFlowIntent): string => {
  if (intent === 'add-shop') return 'List shop';
  if (intent === 'add-agency') return 'Register agency';
  if (intent === 'add-guide') return 'Become a guide';
  return 'Submit';
};

export const hostFlowPickSubtitle = (intent: HostFlowIntent): string => {
  if (intent === 'add-shop') return 'Pin your outdoor gear shop so hikers can find you nearby.';
  if (intent === 'add-agency') return 'Set up your licensed tour agency for paid activities.';
  if (intent === 'add-guide') return 'Lead free and shared hikes, camps, and meetups.';
  return 'Pick what fits — community guide, licensed agency, or gear shop pin.';
};

export const validateHostFlowStep = (
  step: HostFlowStepId,
  form: BecomeHostFormState
): string | null => {
  const profileType = form.hostProfileType;
  if (!profileType) return 'Choose how you want to host.';

  switch (step) {
    case 'name': {
      const value = profileType === 'individual' ? form.hostDisplayName : form.requestedName;
      if (!value.trim()) return profileType === 'individual' ? 'Enter your name.' : 'Enter a name.';
      return null;
    }
    case 'dob':
      if (!form.dateOfBirth) return 'Enter your date of birth.';
      if (!isAtLeastHostAge(form.dateOfBirth)) return 'You must be at least 15 years old.';
      return null;
    case 'about':
      if (form.bio.trim().length < 20) return 'Write at least 20 characters about yourself.';
      return null;
    case 'photo':
      if (profileType !== 'individual' && !form.profilePhoto.trim()) {
        return profileType === 'agency' ? 'Add an agency image.' : 'Add a shop image.';
      }
      return null;
    case 'contact':
      if (!isValidNationalPhone(form.phone)) return 'Enter a valid mobile number.';
      if (form.website.trim()) {
        try {
          const url = new URL(form.website.trim());
          if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return 'Website must start with http:// or https://';
          }
        } catch {
          return 'Enter a valid website URL.';
        }
      }
      return null;
    case 'details':
      if (!form.nationality) return 'Select your nationality.';
      if (!form.residence) return 'Select where you are based in the UAE.';
      if (!form.languages.trim()) return 'List the languages you speak.';
      if (!form.interests.trim()) return 'Share a few interests.';
      return null;
    case 'services':
      if (!form.services.trim()) return 'Describe the services you offer.';
      return null;
    case 'location':
      if (form.latitude == null || form.longitude == null) return 'Drop a pin on the map.';
      return null;
    case 'review':
      return null;
    default:
      return null;
  }
};

export { maxDateOfBirthForHost };
