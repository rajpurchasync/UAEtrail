import { ANDROID_INSTALL } from '../content/androidInstall';
import { IOS_INSTALL } from '../content/iosInstall';
import type { AndroidWebBrowser } from './pwa';

export type PhoneInstallStepBlock = {
  notice?: string;
  steps: readonly string[];
};

/** Best-effort Android in-app browser (install UX only). */
export function detectAndroidWebBrowser(): AndroidWebBrowser {
  if (typeof navigator === 'undefined') return 'other';

  const ua = navigator.userAgent;
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/EdgA/i.test(ua) || /\bEdg\//i.test(ua)) return 'edge';
  if (/Firefox/i.test(ua)) return 'firefox';
  if (/Chrome/i.test(ua)) return 'chrome';
  return 'other';
}

export function resolveAndroidInstallSteps(
  browser: AndroidWebBrowser,
  secureContext = true
): PhoneInstallStepBlock {
  if (!secureContext) {
    return { notice: ANDROID_INSTALL.insecureNotice, steps: ANDROID_INSTALL.stepsSecure };
  }
  if (browser === 'edge') {
    return { notice: ANDROID_INSTALL.edgeNotice, steps: ANDROID_INSTALL.stepsEdge };
  }
  if (browser === 'samsung') {
    return { notice: ANDROID_INSTALL.samsungNotice, steps: ANDROID_INSTALL.stepsSamsung };
  }
  if (browser === 'chrome') {
    return {
      notice: ANDROID_INSTALL.chromeNotice,
      steps: ANDROID_INSTALL.stepsChrome,
    };
  }
  return { steps: ANDROID_INSTALL.stepsOther };
}

export function resolveIosInstallSteps(): readonly string[] {
  return IOS_INSTALL.steps;
}
