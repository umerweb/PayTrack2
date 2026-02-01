# Building Mobile Apps with Notifications & OAuth

## Important: Configure These Before Building

### 1. Supabase OAuth Configuration for Mobile

You MUST add these redirect URLs in your Supabase dashboard:

1. Go to: [Supabase Dashboard](https://supabase.com/dashboard) > Your Project > Authentication > URL Configuration
2. Add these to **Redirect URLs**:
   ```
   com.billreminder.app://login-callback
   billreminder://login-callback
   https://yourdomain.com/dashboard
   ```

3. Add these to **Site URL**:
   ```
   https://yourdomain.com
   ```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials for your mobile app
3. Add authorized redirect URIs:
   ```
   com.billreminder.app://login-callback
   https://yourdomain.com/dashboard
   ```

### 3. Android Notification Icon

Create a notification icon:
1. Icon must be white on transparent background
2. Size: 24x24 dp
3. Place in: `android/app/src/main/res/drawable/`
4. Name it: `ic_stat_icon_config_sample.png`

Or use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-notification.html)

### 4. iOS Notification Setup

1. Open `ios/App/App/Info.plist`
2. Add notification permissions:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

## Building the App

### Install Capacitor Plugins

```bash
npm install @capacitor/push-notifications @capacitor/local-notifications @capacitor/browser @capacitor/preferences @capacitor/app
```

### Build and Sync

```bash
npm run build
npx cap sync
```

### Test on Android

```bash
npx cap open android
```

In Android Studio, click Run (▶️)

### Test on iOS

```bash
npx cap open ios
```

In Xcode, click Run (▶️)

## Features Working on Mobile

✅ **Local Notifications**
- Scheduled reminders based on bill due dates
- Daily reminders if "Notify until paid" is enabled
- Notifications work even when app is closed

✅ **Persistent Login**
- Login state saved using Supabase auth
- Stays logged in after closing app
- Auto-refreshes tokens

✅ **In-App OAuth**
- Google sign-in opens in system browser
- Returns to app after authentication
- No need to manually paste tokens

✅ **Offline Mode**
- Works without internet
- Data syncs when connection restored

## Testing Checklist

- [ ] Sign in with Google (should open browser and return to app)
- [ ] Add a bill with notification time
- [ ] Close app completely
- [ ] Wait for notification time
- [ ] Check if notification appears
- [ ] Open app - should still be logged in
- [ ] Add/edit/delete bills
- [ ] Sign out and sign back in - data should persist

## Troubleshooting

### Notifications Not Showing

1. Check app has notification permission
2. Verify notification time is in the future
3. Check Android/iOS notification settings
4. Look for errors in native logs

### OAuth Opens Browser But Doesn't Return

1. Verify redirect URIs in Supabase dashboard
2. Check `capacitor.config.ts` has correct app ID
3. Ensure Google OAuth credentials include mobile redirect

### Login State Not Persisting

- Check Supabase auth is working
- Verify no errors in console
- Try clearing app data and re-login

## Production Checklist

Before publishing:

- [ ] Update app icon (1024x1024)
- [ ] Add splash screen images
- [ ] Configure notification icon
- [ ] Set up push notification certificates (iOS)
- [ ] Add privacy policy URL
- [ ] Test on multiple devices
- [ ] Test all notification scenarios
- [ ] Test OAuth flow thoroughly
- [ ] Verify data syncs correctly
- [ ] Test offline functionality

## Publishing

### Google Play Store

1. Generate signed APK/AAB
2. Create store listing
3. Add screenshots (phone + tablet)
4. Set up privacy policy
5. Submit for review

### Apple App Store

1. Archive in Xcode
2. Upload to App Store Connect
3. Add screenshots
4. Set up privacy policy
5. Submit for review

## Support

Need help? Check:
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Local Notifications Plugin](https://capacitorjs.com/docs/apis/local-notifications)
