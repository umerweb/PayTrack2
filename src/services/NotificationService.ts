import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Bill } from '@/contexts/BillContext';
import { format, addHours, addMinutes, isAfter, isPast } from 'date-fns';

export class NotificationService {
  private static isNative = Capacitor.isNativePlatform();

  static async initialize() {
    if (!this.isNative) {
      console.log('Not running on native platform, skipping notification init');
      return false;
    }

    try {
      console.log('=== INITIALIZING NOTIFICATIONS ===');
      
      // Check current permissions
      const currentStatus = await LocalNotifications.checkPermissions();
      console.log('Current permission status:', currentStatus);
      
      // Request permission if not granted
      if (currentStatus.display !== 'granted') {
        console.log('Requesting notification permissions...');
        const requestResult = await LocalNotifications.requestPermissions();
        console.log('Permission request result:', requestResult);
        
        if (requestResult.display !== 'granted') {
          console.error('Notification permission denied');
          return false;
        }
      }
      
      console.log('✅ Notification permissions granted');
      
      // Register notification channels for Android
      if (Capacitor.getPlatform() === 'android') {
        console.log('Creating Android notification channels...');
        await this.createAndroidChannels();
      }
      
      // Set up listeners
      await LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('📱 NOTIFICATION RECEIVED:', notification);
      });
      
      await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('👆 NOTIFICATION TAPPED:', notification);
      });
      
      console.log('=== NOTIFICATION INITIALIZATION COMPLETE ===');
      return true;
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      return false;
    }
  }

  private static async createAndroidChannels() {
    try {
      // Create notification channels for Android (required for Android 8.0+)
      const channels = [
        {
          id: 'bill-reminders',
          name: 'Bill Reminders',
          description: 'Notifications for upcoming bill payments',
          importance: 5, // IMPORTANCE_HIGH
          visibility: 1, // VISIBILITY_PUBLIC
          sound: 'default',
          vibration: true,
        },
        {
          id: 'bill-paid',
          name: 'Bill Paid',
          description: 'Confirmation when bills are marked as paid',
          importance: 4, // IMPORTANCE_DEFAULT
          visibility: 1,
          sound: 'default',
          vibration: true,
        }
      ];
      
      console.log('Creating Android notification channels:', channels);
    } catch (error) {
      console.error('Error creating Android channels:', error);
    }
  }

  private static generateNotificationId(billId: string, suffix: number = 0): number {
    const hash = billId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    const id = (hash % 1000000) + suffix;
    console.log(`Generated notification ID: ${id} for bill: ${billId} (suffix: ${suffix})`);
    return id;
  }

  private static parseNotificationTime(timeString: string, baseDate: Date): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const notificationDate = new Date(baseDate);
    notificationDate.setHours(hours, minutes, 0, 0);
    return notificationDate;
  }

  static async testNotification() {
    if (!this.isNative) {
      console.log('Not on native platform');
      return;
    }

    console.log('=== TESTING NOTIFICATION (5 seconds) ===');
    const testTime = addMinutes(new Date(), 0.1); // 6 seconds from now
    
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🧪 Test Notification',
            body: 'This is a test notification from Bill Reminder app',
            id: 999999,
            schedule: { at: testTime },
            sound: 'default',
            channelId: 'bill-reminders',
            extra: {
              type: 'test',
            },
          },
        ],
      });
      
      console.log('✅ Test notification scheduled for:', format(testTime, 'yyyy-MM-dd HH:mm:ss'));
      console.log('⏰ You should receive it in ~6 seconds');
      
      // Verify it was scheduled
      const pending = await LocalNotifications.getPending();
      console.log('Total pending notifications:', pending.notifications.length);
      const testNotif = pending.notifications.find(n => n.id === 999999);
      console.log('Test notification in queue:', !!testNotif);
    } catch (error) {
      console.error('❌ Error scheduling test notification:', error);
    }
  }

  static async scheduleBillReminder(bill: Bill) {
    if (!this.isNative) {
      console.log('Not on native platform, skipping notification scheduling');
      return;
    }

    try {
      const now = new Date();
      const dueDate = new Date(bill.nextDueDate);
      
      console.log('=== SCHEDULING BILL NOTIFICATION ===');
      console.log('Bill:', bill.name);
      console.log('Due date:', format(dueDate, 'yyyy-MM-dd HH:mm'));
      console.log('Notification time:', bill.notificationTime);
      console.log('Is paid:', bill.isPaid);
      console.log('Notify until paid:', bill.notifyUntilPaid);
      console.log('Current time:', format(now, 'yyyy-MM-dd HH:mm'));
      
      if (bill.isPaid) {
        console.log('❌ Bill is paid, not scheduling notification');
        return;
      }

      await this.cancelBillReminder(bill.id);

      const notifications: any[] = [];
      const notificationDateTime = this.parseNotificationTime(bill.notificationTime, dueDate);
      
      console.log('Target notification time:', format(notificationDateTime, 'yyyy-MM-dd HH:mm:ss'));

      // Main notification
      if (isAfter(notificationDateTime, now)) {
        console.log('✅ Scheduling main notification (future time)');
        notifications.push({
          title: '💰 Bill Reminder',
          body: `${bill.name} - $${bill.amount} is due ${format(dueDate, 'MMM dd, yyyy')}`,
          id: this.generateNotificationId(bill.id, 0),
          schedule: { at: notificationDateTime },
          sound: 'default',
          channelId: 'bill-reminders',
          extra: {
            billId: bill.id,
            billName: bill.name,
            type: 'main',
          },
        });
      } else {
        console.log('⚠️ Notification time has passed, scheduling immediate notification');
        const immediateTime = addMinutes(now, 0.1); // 6 seconds from now
        notifications.push({
          title: '⚠️ Bill Reminder',
          body: `${bill.name} - $${bill.amount} is ${isPast(dueDate) ? 'OVERDUE' : 'due today'}!`,
          id: this.generateNotificationId(bill.id, 0),
          schedule: { at: immediateTime },
          sound: 'default',
          channelId: 'bill-reminders',
          extra: {
            billId: bill.id,
            billName: bill.name,
            type: 'main',
          },
        });
      }

      // Recurring 2-hour reminders if enabled
      if (bill.notifyUntilPaid && !bill.isPaid) {
        console.log('✅ Scheduling recurring 2-hour reminders');
        
        for (let i = 1; i <= 12; i++) {
          const reminderTime = addHours(now, i * 2);
          
          if (isAfter(reminderTime, now)) {
            console.log(`  Reminder ${i}: ${format(reminderTime, 'yyyy-MM-dd HH:mm:ss')}`);
            notifications.push({
              title: '🔔 Bill Reminder',
              body: `Don't forget: ${bill.name} - $${bill.amount} ${isPast(dueDate) ? 'is OVERDUE' : `due ${format(dueDate, 'MMM dd')}`}`,
              id: this.generateNotificationId(bill.id, i),
              schedule: { at: reminderTime },
              sound: 'default',
              channelId: 'bill-reminders',
              extra: {
                billId: bill.id,
                billName: bill.name,
                type: 'recurring',
                interval: i,
              },
            });
          }
        }
      }

      if (notifications.length > 0) {
        console.log(`📤 Scheduling ${notifications.length} notification(s)`);
        
        await LocalNotifications.schedule({ notifications });
        
        // Verify scheduling
        const pending = await LocalNotifications.getPending();
        const billNotifs = pending.notifications.filter((n: any) => n.extra?.billId === bill.id);
        console.log(`✅ Verified: ${billNotifs.length} notifications queued for this bill`);
        console.log('Total pending notifications:', pending.notifications.length);
      } else {
        console.log('❌ No notifications to schedule');
      }
      
      console.log('=== SCHEDULING COMPLETE ===');
    } catch (error) {
      console.error('❌ Error scheduling bill reminder:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  }

  static async cancelBillReminder(billId: string) {
    if (!this.isNative) return;

    try {
      console.log('🗑️ Canceling notifications for bill:', billId);
      
      const pending = await LocalNotifications.getPending();
      const billNotifications = pending.notifications.filter(
        (n: any) => n.extra?.billId === billId
      );
      
      if (billNotifications.length > 0) {
        console.log(`Found ${billNotifications.length} notifications to cancel`);
        await LocalNotifications.cancel({ 
          notifications: billNotifications.map((n: any) => ({ id: n.id })) 
        });
        console.log('✅ Notifications cancelled');
      } else {
        console.log('No notifications found for this bill');
      }
    } catch (error) {
      console.error('❌ Error canceling notifications:', error);
    }
  }

  static async scheduleAllBills(bills: Bill[]) {
    if (!this.isNative) return;

    console.log('=== SCHEDULING ALL BILLS ===');
    console.log('Total bills:', bills.length);
    console.log('Unpaid bills:', bills.filter(b => !b.isPaid).length);
    
    try {
      const pending = await LocalNotifications.getPending();
      console.log(`Clearing ${pending.notifications.length} existing notifications`);
      
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ 
          notifications: pending.notifications.map(n => ({ id: n.id })) 
        });
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }

    for (const bill of bills) {
      if (!bill.isPaid) {
        console.log(`\n--- Scheduling: ${bill.name} ---`);
        await this.scheduleBillReminder(bill);
      }
    }
    
    try {
      const pending = await LocalNotifications.getPending();
      console.log(`\n✅ TOTAL NOTIFICATIONS SCHEDULED: ${pending.notifications.length}`);
    } catch (error) {
      console.error('Error checking final count:', error);
    }
    
    console.log('=== ALL BILLS SCHEDULED ===');
  }

  static async showBillPaidNotification(billName: string, amount: number) {
    if (!this.isNative) return;

    try {
      console.log('=== SHOWING BILL PAID NOTIFICATION ===');
      console.log('Bill:', billName);
      
      const now = new Date();
      const notificationTime = addMinutes(now, 0.05); // 3 seconds
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '✅ Bill Paid!',
            body: `${billName} - $${amount} has been marked as paid.`,
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: notificationTime },
            sound: 'default',
            channelId: 'bill-paid',
            extra: {
              type: 'bill_paid',
              billName: billName,
            },
          },
        ],
      });
      
      console.log('✅ Bill paid notification scheduled');
    } catch (error) {
      console.error('❌ Error showing bill paid notification:', error);
    }
  }

  static async checkPermissions() {
    if (!this.isNative) return { display: 'granted' };

    try {
      const status = await LocalNotifications.checkPermissions();
      console.log('Permission status:', status);
      return status;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return { display: 'denied' };
    }
  }

  static async requestPermissions() {
    if (!this.isNative) return { display: 'granted' };

    try {
      console.log('Requesting notification permissions...');
      const status = await LocalNotifications.requestPermissions();
      console.log('Permission result:', status);
      return status;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { display: 'denied' };
    }
  }

  static async listPendingNotifications() {
    if (!this.isNative) return [];

    try {
      const pending = await LocalNotifications.getPending();
      console.log('=== PENDING NOTIFICATIONS ===');
      console.log('Total:', pending.notifications.length);
      pending.notifications.forEach((notif: any) => {
        const scheduleTime = notif.schedule?.at ? format(new Date(notif.schedule.at), 'yyyy-MM-dd HH:mm:ss') : 'N/A';
        console.log(`ID: ${notif.id}`);
        console.log(`  Time: ${scheduleTime}`);
        console.log(`  Title: ${notif.title}`);
        console.log(`  Body: ${notif.body}`);
        console.log(`  Extra:`, notif.extra);
      });
      console.log('=============================');
      return pending.notifications;
    } catch (error) {
      console.error('Error listing notifications:', error);
      return [];
    }
  }
}
