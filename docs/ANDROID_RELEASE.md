# Android release build (Google Play)

Cross-platform auth/session/access baseline for this repo is persisted in `docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md`.

## Prerequisites

- Android Studio (latest stable)
- JDK 17+
- `npm run build` completed
- `android/` project generated (`npx cap add android` or pull from repo)

## 1 — Icons

Regenerate launcher + PWA icons from the SVG source:

```bash
npm run icons:generate
npm run cap:sync
```

## 2 — Release signing

```bash
cd android
keytool -genkey -v -keystore uaetrail-release.keystore -alias uaetrail -keyalg RSA -keysize 2048 -validity 10000
cp keystore.properties.example keystore.properties
# Edit keystore.properties with your passwords and keystore path
```

`keystore.properties` and `*.keystore` are gitignored.

## 3 — Build AAB (Play Store)

In Android Studio:

1. **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle**
3. Select your keystore
4. Build variant: **release**

Or from CLI (with `keystore.properties` in place):

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 4 — Play Console checklist

| Item | Value |
|------|-------|
| Package name | `ae.uaetrail.app` |
| Privacy policy | `https://uaetrail.ae/privacy` |
| Account deletion | `https://uaetrail.ae/profile` (in-app flow) |
| Data safety form | Declare account, messages, purchases |
| Content rating | Complete IARC questionnaire |
| Target API | Match `targetSdkVersion` in `android/variables.gradle` |

## 5 — Auth on Android

Google Sign-In + email are both enabled in the native Android shell (unlike iOS, which is email-only).

## Version bumps

Edit `android/app/build.gradle`:

- `versionCode` — increment integer for each Play upload
- `versionName` — user-visible semver (match root `package.json`)

Then `npm run cap:sync` before building.
