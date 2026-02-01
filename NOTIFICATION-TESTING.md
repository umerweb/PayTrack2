# Testing Bill Reminder Notifications

## How Notifications Work Now

### ✅ **Fixed Issues:**
1. **Respects exact date and time** - Notifications trigger at the exact time you set
2. **Recurring 2-hour reminders** - If "Notify until paid" is checked, you get notifications every 2 hours
3. **Bill paid notification** - Get a confirmation notification when you mark a bill as paid

### **Notification Types:**

#### 1. Main Notification
- Triggers at the exact time you set on the due date
- Example: Bill due Jan 30, 2025 at 9:00 AM → Notification at 9:00 AM on Jan 30

#### 2. Immediate Notification (Overdue/Due Today)
- If you add a bill with a past time or due today
- Triggers within 1 minute
- Shows "OVERDUE" or "due today" in the notification

#### 3. Recurring 2-Hour Reminders
- Only if "Notify until paid" is enabled
- Sends notification every 2 hours
- Continues until you mark the bill as paid
- Schedules 12 reminders (24 hours worth)

#### 4. Bill Paid Notification
- Triggers immediately when you mark a bill as paid
- Shows "✅ Bill Paid!" confirmation

## Testing Instructions

### Test 1: Future Notification
1. Add a bill due tomorrow at 9:00 AM
2. Set notification time to 9:00 AM
3. Wait until 9:00 AM tomorrow
4. **Expected:** Get notification at exactly 9:00 AM

### Test 2: Immediate Notification (Due Today)
1. Add a bill due today
2. Set notification time to current time + 2 minutes
3. Wait 2 minutes
4. **Expected:** Get notification at the set time

### Test 3: Recurring Reminders
1. Add a bill due today
2. Check "Notify until paid"
3. Set notification time to current time + 1 minute
4. **Expected:** 
   - Get first notification in 1 minute
   - Get another notification 2 hours later
   - Get another notification 2 hours after that
   - Continues every 2 hours until paid

### Test 4: Bill Paid Notification
1. Have an unpaid bill
2. Mark it as paid
3. **Expected:** Immediate notification saying "Bill Paid!"

### Test 5: Cancel Notifications on Paid
1. Add a bill with recurring reminders
2. Wait for first notification
3. Mark bill as paid
4. **Expected:** No more notifications for this bill

## Debugging

### Check Pending Notifications
The app logs all scheduled notifications to console. Look for:
```
Scheduling X notification(s) for bill: [Bill Name]
  Notification 1: 2025-01-30 09:00:00 - [Message]
  Notification 2: 2025-01-30 11:00:00 - [Message]
```

### Common Issues

**Issue:** No notification appears
- Check: App has notification permission
- Check: Notification time is in the future
- Check: Bill is not marked as paid
- Check: Phone is not in Do Not Disturb mode

**Issue:** Recurring reminders don't appear
- Check: "Notify until paid" is enabled
- Check: Console shows multiple notifications scheduled
- Wait: Full 2 hours between reminders

**Issue:** Notification appears at wrong time
- Check: Time zone on device
- Check: Console logs showing scheduled time
- Verify: Clock on device is correct

## Console Logs to Watch

When adding a bill, you'll see:
```
Scheduling notification for bill: {
  name: "Netflix",
  dueDate: "2025-01-30 00:00",
  notificationTime: "09:00",
  isPaid: false,
  notifyUntilPaid: true
}

Notification will be scheduled for: 2025-01-30 09:00:00
Scheduling main notification (time is in future)
Scheduling recurring 2-hour reminders
  Recurring reminder 1 at: 2025-01-30 11:00:00
  Recurring reminder 2 at: 2025-01-30 13:00:00
  ...
Scheduling 13 notification(s) for bill: Netflix
Total pending notifications: 13
```

## Android Testing Steps

1. Build app: `npm run build && npx cap sync`
2. Open Android Studio: `npx cap open android`
3. Enable USB Debugging on phone
4. Click Run in Android Studio
5. Add a test bill due in 2 minutes
6. Close the app completely
7. Wait for notification
8. Check notification appears

## iOS Testing Steps

1. Build app: `npm run build && npx cap sync`
2. Open Xcode: `npx cap open ios`
3. Connect iPhone
4. Click Run in Xcode
5. Add a test bill due in 2 minutes
6. Close the app completely
7. Wait for notification
8. Check notification appears

## Notification Format

**Main Notification:**
```
💰 Bill Reminder
Netflix - $15.99 is due Jan 30, 2025
```

**Overdue:**
```
⚠️ Bill Reminder
Netflix - $15.99 is OVERDUE!
```

**Recurring:**
```
🔔 Bill Reminder
Don't forget: Netflix - $15.99 due Jan 30
```

**Bill Paid:**
```
✅ Bill Paid!
Netflix - $15.99 has been marked as paid.
```

## Tips

- **Test with short intervals:** Set notification 1-2 minutes in future for quick testing
- **Check phone settings:** Ensure notifications are allowed for the app
- **Use airplane mode:** Test that notifications still work offline
- **Close app:** Notifications should work even when app is closed
- **Check battery settings:** Some phones kill background processes
