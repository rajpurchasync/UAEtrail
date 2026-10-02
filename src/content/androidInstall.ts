/** Home screen app — Android (Chrome, Edge, and other browsers). */
export const ANDROID_INSTALL = {
  settingsHash: '#android-install',
  sectionTitle: 'Android',
  headline: 'Add UAE Trail to your home screen',
  body: 'Open the map and chat with your crew in one tap — like an app, no Play Store required.',
  showSteps: 'How to add on this phone',
  chromeNotice:
    'Use the steps below — do not rely on Edge’s “Install” if it says the app cannot be installed.',
  edgeNotice:
    'Microsoft Edge often shows “This app cannot be installed.” That is normal — use Chrome or Samsung Internet below for the full home-screen app.',
  samsungNotice:
    'On Samsung phones, Samsung Internet or Chrome works best. Edge may only offer a shortcut that opens inside the browser.',
  stepsSamsung: [
    'Open uaetrail.com in Samsung Internet (or install Chrome from the Play Store).',
    'Tap the menu (≡) at the bottom.',
    'Tap Add page to → Home screen, then tap Add.',
  ],
  stepsChrome: [
    'Open uaetrail.com in Google Chrome (not Microsoft Edge).',
    'Wait for the page to finish loading (pull to refresh once if needed).',
    'Tap ⋮ (menu) → Install app or Add to Home screen → Install.',
    'If Install app is missing, choose Add to Home screen instead.',
  ],
  stepsEdge: [
    'Copy this page address, open Google Chrome (or Samsung Internet), and paste the link.',
    'In Chrome: tap ⋮ → Install app or Add to Home screen.',
    'In Samsung Internet: tap ≡ → Add page to → Home screen.',
    'Ignore Edge “Create shortcut” if it only opens inside Edge — that is not the full app.',
  ],
  stepsOther: [
    'Open this site in Google Chrome if you can.',
    'Tap the browser menu.',
    'Look for Install app, Add to Home screen, or Add page to → Home screen.',
  ],
} as const;
