# iOS release (App Store) — UAE Trail

## Prerequisites

- **macOS** with Xcode 15+
- Apple Developer Program ($99/year)
- `npm run build` completed

## 1 — Generate iOS project (on Mac)

```bash
npm run icons:generate
npx cap add ios   # skip if ios/ already exists
npm run cap:sync
npm run cap:ios   # opens Xcode
```

## 2 — Auth strategy (v1)

**Email/password only** on native iOS — Google sign-in is hidden automatically (`src/config/authProviders.ts`). This satisfies App Store guideline 4.8 without Sign in with Apple.

Web and Android continue to offer Google + email.

## 3 — Xcode configuration

| Setting | Value |
|---------|--------|
| Bundle Identifier | `ae.uaetrail.app` |
| Display Name | UAE Trail |
| Version | Match `package.json` (e.g. 0.1.0) |
| Build | Increment each upload |
| Deployment Target | iOS 15+ (Capacitor default) |

**Signing:** Team → Automatic signing with your Apple Developer team.

**Icons:** Drag `resources/icon.png` (1024×1024) into Assets.xcassets AppIcon.

## 4 — Universal Links

1. Enable **Associated Domains** capability: `applinks:uaetrail.ae`
2. Update `public/.well-known/apple-app-site-association` — replace `TEAM_ID` with your Apple Team ID
3. Deploy site over HTTPS; verify file is served at `https://uaetrail.ae/.well-known/apple-app-site-association`

## 5 — App Privacy (App Store Connect)

Declare data consistent with `Privacy.tsx`:

- Email, display name, profile photo
- User content (messages, posts, reviews)
- Purchase history (via Stripe on web; in-app if added later)
- Push token if APNs enabled

## 6 — TestFlight → App Store

1. Product → Archive → Distribute → App Store Connect
2. Internal TestFlight for team
3. Submit for review with:
   - Privacy policy URL: `https://uaetrail.ae/privacy`
   - Account deletion: in-app Profile flow
   - Demo account credentials for reviewer (email/password test user)

## 7 — Review notes (suggested)

> UAE Trail is a hiking and outdoor trip platform for the UAE. Reviewers can sign in with the provided test account or create a new account via email. Google Sign-In is intentionally disabled on iOS; email registration is available. Premium digital unlocks are purchased via web (Stripe) in v1.

## Payments (future)

If selling location premium unlock **inside** the iOS app, you must use **Apple In-App Purchase**. Current web Stripe flow is fine for Safari; native IAP required when checkout moves in-app.

## Version bumps

1. Update `package.json` version
2. Update Xcode Marketing Version + Build
3. `npm run cap:sync`
