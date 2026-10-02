/** Copy for add-to-home / PWA install (settings + helpers). */
export const PWA_INSTALL = {
  sectionTitle: 'Phone app',
  headline: 'Get UAE Trail on your home screen',
  body: 'Open the map and chat with your crew in one tap — like an app, no store required.',
  installButton: 'Install app',
  installing: 'Installing…',
  showSteps: 'How to add on this phone',
  iosSteps: [
    'Tap the Share button in Safari (square with an arrow).',
    'Scroll down and tap Add to Home Screen.',
    'Tap Add — UAE Trail opens full screen from your home screen.',
  ],
  androidStepsPrompt: 'Chrome will ask to add UAE Trail to your home screen.',
  androidStepsManual: [
    'Open this site in Chrome (install works best there).',
    'Tap the menu (⋮) in the top corner.',
    'Tap Install app or Add to Home screen.',
  ],
} as const;
