# Android Notification Setup - CRITICAL

## 🚨 IMPORTANT: These steps are REQUIRED for notifications to work on Android

### Step 1: Add Android Permissions

Open `android/app/src/main/AndroidManifest.xml` and add these permissions inside the `<manifest>` tag:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### Step 2: Create Notification Icon

1. Create a white notification icon (24x24 dp)
2. Use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-notification.html)
3. Download all sizes
4. Copy to: `android/app/src/main/res/drawable/`
5. Name it: `ic_stat_icon_config_sample.png`

Or use this simple white bell icon in each drawable folder:
- `drawable-mdpi` (24x24px)
- `drawable-hdpi` (36x36px)
- `drawable-xhdpi` (48x48px)
- `drawable-xxhdpi` (72x72px)
- `drawable-xxxhdpi` (96x96px)

### Step 3: Build and Test

```bash
npm run build
npx cap sync android
npx cap open android
```

In Android Studio:
1. Click Run (▶️)
2. App installs on device
3. Go to Settings tab
4. Enable notifications (app will request permission)
5. Click "Test Notification"
6. **You should see notification in ~6 seconds**

### Step 4: Test Real Bill Notification

1. Add a bill due TODAY
2. Set notification time to current time + 2 minutes
3. Enable "Notify until paid"
4. Wait 2 minutes
5. **You should receive notification**
6. **2 hours later, you should receive another notification**
7. Mark bill as paid
8. **You should receive "Bill Paid" notification immediately**

## Troubleshooting

### Notification Not Showing?

**Check 1: Permission Granted?**
- Open Console in Android Studio
- Look for: `✅ Notification permissions granted`
- If not, app will request permission on first use

**Check 2: Notification Scheduled?**
- Look for console logs:
  ```
  ✅ Scheduling main notification (future time)
  📤 Scheduling 13 notification(s)
  ✅ Verified: 13 notifications queued
  ```

**Check 3: Notification in Queue?**
- Look for: `Total pending notifications: X`
- If 0, notifications weren't scheduled

**Check 4: Phone Settings**
- Go to: Settings → Apps → Bill Reminder → Notifications
- Ensure ALL notification categories are enabled
- Ensure "Allow notifications" is ON

**Check 5: Battery Optimization**
- Go to: Settings → Apps → Bill Reminder → Battery
- Select "Unrestricted" or "Don't optimize"
- Some phones kill background processes

**Check 6: Do Not Disturb**
- Ensure phone is not in DND mode
- Or allow Bill Reminder to override DND

### Still Not Working?

Run these commands in Android Studio Logcat filter:
```
tag:NotificationService
tag:LocalNotifications
tag:Capacitor
```

Look for errors or check if notifications are being scheduled.

## Testing Commands

### Test Notification (6 seconds)
1. Go to Settings tab
2. Enable notifications
3. Click "Test Notification"
4. Wait 6 seconds
5. Check notification tray

### Check Pending Notifications
Open Chrome DevTools (inspect app):
```javascript
await NotificationService.listPendingNotifications()
```

### Check Permission Status
```javascript
await NotificationService.checkPermissions()
```

## Expected Console Output

When adding a bill, you should see:
```
=== INITIALIZING NOTIFICATIONS ===
Current permission status: {display: "granted"}
✅ Notification permissions granted
Creating Android notification channels...
=== NOTIFICATION INITIALIZATION COMPLETE ===

=== SCHEDULING BILL NOTIFICATION ===
Bill: Netflix
Due date: 2025-01-30 00:00
Notification time: 09:00
Current time: 2025-01-29 15:30
Target notification time: 2025-01-30 09:00:00
✅ Scheduling main notification (future time)
Generated notification ID: 123456
✅ Scheduling recurring 2-hour reminders
  Reminder 1: 2025-01-29 17:30:00
  Reminder 2: 2025-01-29 19:30:00
  ...
📤 Scheduling 13 notification(s)
✅ Verified: 13 notifications queued for this bill
Total pending notifications: 13
=== SCHEDULING COMPLETE ===
```

## Common Android Issues

### Issue: "Notification not showing at scheduled time"
**Solution:** Disable battery optimization for the app

### Issue: "Permission denied"
**Solution:** 
1. Uninstall app
2. Reinstall
3. Grant permission when prompted

### Issue: "Notifications work but no sound"
**Solution:** 
1. Go to app notification settings
2. Enable sound for each notification category

### Issue: "Only first notification shows"
**Solution:** Check if battery saver is killing the app

## Production Checklist

Before releasing:
- [ ] Notification icon created (white on transparent)
- [ ] All permissions added to AndroidManifest.xml
- [ ] Test notification works
- [ ] Bill reminder notification works
- [ ] Recurring notifications work (wait 2 hours)
- [ ] Bill paid notification works
- [ ] Notifications work when app is closed
- [ ] Notifications work when phone is locked
- [ ] Sound/vibration works
- [ ] Tested on Android 8.0+
- [ ] Tested on Android 13+ (runtime permission)

## Next Steps

Once Android is working, test:
1. Add bill due in 2 minutes → Get notification
2. Enable "Notify until paid" → Get notification every 2 hours
3. Mark as paid → Get "Bill Paid" notification
4. Close app completely → Still get notifications
5. Restart phone → Notifications still scheduled

If all tests pass, notifications are working correctly! 🎉
