import type { ViewerGeolocationFailure } from '../list/browse/viewerGeolocation';
import {
  MEMBER_HOME_LOCATION_DENIED,
  MEMBER_HOME_LOCATION_DENIED_PERMISSION,
  MEMBER_HOME_LOCATION_DENIED_TIMEOUT,
  MEMBER_HOME_LOCATION_UNSUPPORTED,
} from './memberHomeCopy';

export const memberHomeGeolocationErrorMessage = (code: ViewerGeolocationFailure | null): string => {
  switch (code) {
    case 'denied':
      return MEMBER_HOME_LOCATION_DENIED_PERMISSION;
    case 'timeout':
      return MEMBER_HOME_LOCATION_DENIED_TIMEOUT;
    case 'unsupported':
      return MEMBER_HOME_LOCATION_UNSUPPORTED;
    case 'unavailable':
    default:
      return MEMBER_HOME_LOCATION_DENIED;
  }
};