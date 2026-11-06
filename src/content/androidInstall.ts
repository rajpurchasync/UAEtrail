/** Home screen app — Android Chrome, Edge, and Samsung Internet. */
export const ANDROID_INSTALL = {
  settingsHash: '#android-install',
  sectionTitle: 'Android',
  headline: 'Add UAE Trail to your home screen',
  body: 'Open the map and chat with your crew in one tap — like an app, no Play Store required.',
  installButton: 'Install app',
  showSteps: 'How to add on this phone',
  insecureNotice:
    'Chrome and Edge only install over HTTPS. A Wi‑Fi dev link like http://192.168.x.x:5175 cannot install — use https://uaetrail.com on this phone, or an HTTPS tunnel to your laptop for install testing.',
  chromeNotice:
    'On Galaxy phones, Chrome installs from the button below or from the ⋮ menu at the top right.',
  edgeNotice:
    'On Galaxy phones, Edge installs from the button below or from ··· at the bottom → Add to phone.',
  samsungNotice:
    'Samsung Internet can add UAE Trail from the menu below. Chrome and Edge on this phone use Install app.',
  stepsSecure: [
    'Open https://uaetrail.com in Google Chrome or Microsoft Edge.',
    'Wait until the page finishes loading.',
    'Tap Install app in the menu, or use the browser menu: Chrome ⋮ → Install app, Edge ··· → Add to phone.',
  ],
  stepsSamsung: [
    'Tap Install app if it is shown.',
    'Or tap the menu (≡) at the bottom.',
    'Tap Add page to → Home screen, then tap Add.',
  ],
  stepsChrome: [
    'Tap Install app on this screen.',
    'Or tap ⋮ at the top right → Install app or Add to Home screen → Install.',
    'Confirm Add. The home-screen icon opens UAE Trail without the browser bar.',
  ],
  stepsEdge: [
    'Tap Install app on this screen. Edge uses the same install prompt as Chrome.',
    'Or tap ··· at the bottom of Edge → Add to phone (or Install app) → Install.',
    'Confirm Add. The home-screen icon opens UAE Trail full screen.',
  ],
  stepsOther: [
    'Open this site in Google Chrome or Microsoft Edge.',
    'Tap Install app when it appears.',
    'Or open the browser menu and choose Install app, Add to phone, or Add to Home screen.',
  ],
} as const;
