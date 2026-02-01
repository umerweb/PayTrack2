# Building Mobile Apps (Android & iOS)

This guide will help you build native Android and iOS apps from your Bill Reminder web app.

## Prerequisites

### For Both Platforms:
- Node.js 16+ installed
- Git installed

### For Android:
- [Android Studio](https://developer.android.com/studio) installed
- Java JDK 11+ installed
- Android SDK installed (comes with Android Studio)

### For iOS (Mac Only):
- macOS computer
- [Xcode](https://apps.apple.com/us/app/xcode/id497799835) installed (from App Store)
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`

## Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

## Step 2: Build Your Web App

```bash
npm run build
```

This creates the `dist` folder with your production web app.

## Step 3: Add Mobile Platforms

### Add Android:
```bash
npx cap add android
```

### Add iOS (Mac only):
```bash
npx cap add ios
```

## Step 4: Sync Your Web Code to Mobile

Every time you make changes to your web app, run:

```bash
npm run build
npx cap sync
```

This copies your built web app to the native mobile projects.

## Step 5: Build Android APK

### Option A: Using Android Studio (Recommended)

1. Open Android Studio
2. Click "Open an Existing Project"
3. Navigate to your project and select the `android` folder
4. Wait for Gradle sync to complete
5. Connect your Android device or start an emulator
6. Click the green "Run" button (▶️) at the top
7. Your app will install and run on the device

### Option B: Generate Signed APK

1. In Android Studio: `Build > Generate Signed Bundle / APK`
2. Select `APK`
3. Create a new keystore or use existing one
4. Fill in keystore details:
   - **Key store path**: Choose location for your keystore file
   - **Password**: Create a strong password
   - **Key alias**: billreminder
   - **Key password**: Create a strong password
5. Click `Next`
6. Select `release` build variant
7. Click `Finish`
8. APK will be generated in: `android/app/release/app-release.apk`

### Option C: Command Line Build

```bash
cd android
./gradlew assembleRelease
cd ..
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Step 6: Build iOS App (Mac Only)

1. Open Xcode
2. Open the iOS project: `ios/App/App.xcworkspace`
3. Select a development team in signing settings
4. Connect your iPhone or select a simulator
5. Click the "Run" button (▶️) at the top
6. Your app will install and run on the device

### Build for App Store:

1. In Xcode: `Product > Archive`
2. Wait for archive to complete
3. Click `Distribute App`
4. Follow App Store submission process

## Step 7: Configure Google OAuth for Mobile

You need to configure OAuth redirect URIs for mobile:

### Supabase Configuration:

1. Go to Supabase Dashboard
2. Navigate to: Authentication > URL Configuration
3. Add these redirect URLs:
   - `com.billreminder.app://login-callback` (Android)
   - `billreminder://login-callback` (iOS)

### Update Your Code:

The OAuth flow is already configured to work on mobile. The `capacitor.config.ts` sets up the proper URL schemes.

## Step 8: Add App Icons and Splash Screen

### Generate Icons:

1. Create a 1024x1024 PNG icon
2. Use [Icon Generator](https://www.appicon.co/) to generate all sizes
3. Replace icons in:
   - Android: `android/app/src/main/res/mipmap-*`
   - iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Add Splash Screen:

1. Create a 2732x2732 PNG splash image
2. Use [Splash Screen Generator](https://www.appicon.co/#image-sets)
3. Replace splash screens in:
   - Android: `android/app/src/main/res/drawable-*`
   - iOS: `ios/App/App/Assets.xcassets/Splash.imageset/`

## Step 9: Testing on Real Devices

### Android:

1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run: `npx cap run android`

### iOS:

1. Connect iPhone via USB
2. Trust computer on iPhone
3. In Xcode, select your device
4. Click Run

## Step 10: Publishing

### Google Play Store (Android):

1. Create Google Play Developer account ($25 one-time fee)
2. Generate signed APK or AAB (Android App Bundle)
3. Upload to Play Console
4. Fill in app details, screenshots
5. Submit for review

### Apple App Store (iOS):

1. Create Apple Developer account ($99/year)
2. Create App ID in Apple Developer Portal
3. Archive app in Xcode
4. Upload to App Store Connect
5. Fill in app details, screenshots
6. Submit for review

## Troubleshooting

### Build Failed?

```bash
# Clean and rebuild
npm run build
npx cap sync
```

### Android Gradle Issues?

```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### iOS CocoaPods Issues?

```bash
cd ios/App
pod install
cd ../..
npx cap sync ios
```

### App Stuck on Splash Screen?

Check browser console in Android Studio or Xcode for errors.

## Adding Native Features (Optional)

You can add native mobile features:

```bash
# Push Notifications
npm install @capacitor/push-notifications

# Local Notifications
npm install @capacitor/local-notifications

# Camera
npm install @capacitor/camera

# Geolocation
npm install @capacitor/geolocation
```

After installing, run:
```bash
npx cap sync
```

## Development Workflow

1. Make changes to your web app
2. Test in browser: `npm run dev`
3. Build: `npm run build`
4. Sync to mobile: `npx cap sync`
5. Open in native IDE: `npx cap open android` or `npx cap open ios`
6. Test on device

## Live Reload (Optional)

For faster development:

```bash
# Find your local IP
ipconfig getifaddr en0  # Mac
ip addr show  # Linux
ipconfig  # Windows

# Update capacitor.config.ts server.url to your IP:
# server: { url: 'http://192.168.1.100:5173' }

npm run dev
npx cap sync
```

Now changes reflect immediately without rebuilding!

## Notes

- **Android**: Easier to build and test, no Mac required
- **iOS**: Requires Mac, Xcode, and Apple Developer account
- **Google OAuth**: Works automatically on mobile with proper redirect URIs
- **Supabase**: Works perfectly on mobile, no changes needed
- **Offline Mode**: Local storage works on mobile devices
- **Updates**: After changing web code, always run `npm run build` then `npx cap sync`

## Support

- Capacitor Docs: https://capacitorjs.com/docs
- Android Studio: https://developer.android.com/studio/intro
- Xcode: https://developer.apple.com/xcode/

Good luck with your mobile app! 🚀
