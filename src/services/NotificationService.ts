import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Bill } from '@/contexts/BillContext';
import { format, parseISO, addHours, addMinutes, isBefore, isAfter, isPast } from 'date-fns';

export class NotificationService {
  private static isNative = Capacitor.isNativePlatform();

  static async initialize() {
    if (!this.isNative) {
      console.log('Not running on native platform, skipping notification init');
      return;
    }

    try {
      // Request permission
      const permissionStatus = await LocalNotifications.requestPermissions();
      console.log('Notification permission status:', permissionStatus);
      
      if (permissionStatus.display === 'granted') {
        console.log('Notifications permission granted');
        
        // Listen for notification actions
        await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
          console.log('Notification action performed:', notification);
        });
        
        return true;
      } else {
        console.log('Notifications permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  private static generateNotificationId(billId: string, suffix: number = 0): number {
    // Create a unique numeric ID from bill ID and suffix
    const hash = billId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    return (hash % 1000000) + suffix;
  }

  private static parseNotificationTime(timeString: string, baseDate: Date): Date {
    // Parse time string (format: "HH:mm")
    const [hours, minutes] = timeString.split(':').map(Number);
    const notificationDate = new Date(baseDate);
    notificationDate.setHours(hours, minutes, 0, 0);
    return notificationDate;
  }

  static async scheduleBillReminder(bill: Bill) {
    if (!this.isNative) {
      console.log('Not on native platform, skipping notification scheduling');
      return;
    }

    try {
      const now = new Date();
      const dueDate = new Date(bill.nextDueDate);
      
      console.log('Scheduling notification for bill:', {
        name: bill.name,
        dueDate: format(dueDate, 'yyyy-MM-dd HH:mm'),
        notificationTime: bill.notificationTime,
        isPaid: bill.isPaid,
        notifyUntilPaid: bill.notifyUntilPaid,
        currentTime: format(now, 'yyyy-MM-dd HH:mm')
      });
      
      // Don't schedule if bill is already paid
      if (bill.isPaid) {
        console.log('Bill is already paid, not scheduling notification');
        return;
      }

      // Cancel any existing notifications for this bill first
      await this.cancelBillReminder(bill.id);

      const notifications: any[] = [];

      // Parse the notification time for the due date
      const notificationDateTime = this.parseNotificationTime(bill.notificationTime, dueDate);
      
      console.log('Notification will be scheduled for:', format(notificationDateTime, 'yyyy-MM-dd HH:mm:ss'));

      // If the notification time hasn't passed yet, schedule the main notification
      if (isAfter(notificationDateTime, now)) {
        console.log('Scheduling main notification (time is in future)');
        notifications.push({
          title: '💰 Bill Reminder',
          body: `${bill.name} - ${bill.amount} is due ${format(dueDate, 'MMM dd, yyyy')}`,
          id: this.generateNotificationId(bill.id, 0),
          schedule: { at: notificationDateTime },
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          extra: {
            billId: bill.id,
            billName: bill.name,
            type: 'main',
          },
        });
      } else {
        // If notification time has passed but we should still notify
        console.log('Notification time has passed');
        
        // If the bill is overdue or due today, send immediate notification
        if (isBefore(dueDate, now) || format(dueDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
          console.log('Scheduling immediate notification (overdue or due today)');
          // Schedule for 5 seconds from now to ensure it triggers
          const immediateTime = addMinutes(now, 1);
          notifications.push({
            title: '⚠️ Bill Reminder',
            body: `${bill.name} - ${bill.amount} is ${isPast(dueDate) ? 'OVERDUE' : 'due today'}!`,
            id: this.generateNotificationId(bill.id, 0),
            schedule: { at: immediateTime },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              billId: bill.id,
              billName: bill.name,
              type: 'main',
            },
          });
        }
      }

      // If "Notify until paid" is enabled, schedule recurring 2-hour reminders
      if (bill.notifyUntilPaid && !bill.isPaid) {
        console.log('Scheduling recurring 2-hour reminders (notify until paid is enabled)');
        
        // Schedule next 12 reminders (24 hours worth of 2-hour intervals)
        for (let i = 1; i <= 12; i++) {
          const reminderTime = addHours(now, i * 2);
          
          // Only schedule if reminder time is after now
          if (isAfter(reminderTime, now)) {
            console.log(`Scheduling recurring reminder ${i} at:`, format(reminderTime, 'yyyy-MM-dd HH:mm:ss'));
            notifications.push({
              title: '🔔 Bill Reminder',
              body: `Don't forget: ${bill.name} - ${bill.amount} ${isPast(dueDate) ? 'is OVERDUE' : `due ${format(dueDate, 'MMM dd')}`}`,
              id: this.generateNotificationId(bill.id, i),
              schedule: { at: reminderTime },
              sound: 'default',
              attachments: undefined,
              actionTypeId: '',
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
        console.log(`Scheduling ${notifications.length} notification(s) for bill: ${bill.name}`);
        
        // Log all notification times for debugging
        notifications.forEach((notif, index) => {
          console.log(`  Notification ${index + 1}: ${format(notif.schedule.at, 'yyyy-MM-dd HH:mm:ss')} - ${notif.body}`);
        });
        
        await LocalNotifications.schedule({ notifications });
        
        // Verify scheduled notifications
        const pending = await LocalNotifications.getPending();
        console.log('Total pending notifications:', pending.notifications.length);
        console.log('Pending notifications for this bill:', 
          pending.notifications.filter(n => n.extra?.billId === bill.id).length
        );
      } else {
        console.log('No notifications to schedule for this bill');
      }
    } catch (error) {
      console.error('Error scheduling bill reminder:', error);
    }
  }

  static async cancelBillReminder(billId: string) {
    if (!this.isNative) return;

    try {
      console.log('Canceling all notifications for bill:', billId);
      
      // Get all pending notifications
      const pending = await LocalNotifications.getPending();
      
      // Find all notifications for this bill
      const billNotifications = pending.notifications.filter(
        (n: any) => n.extra?.billId === billId
      );
      
      if (billNotifications.length > 0) {
        console.log(`Found ${billNotifications.length} notifications to cancel`);
        await LocalNotifications.cancel({ 
          notifications: billNotifications.map((n: any) => ({ id: n.id })) 
        });
        console.log('Notifications cancelled successfully');
      } else {
        console.log('No notifications found for this bill');
      }
    } catch (error) {
      console.error('Error canceling bill reminder:', error);
    }
  }

  static async scheduleAllBills(bills: Bill[]) {
    if (!this.isNative) return;

    console.log('Scheduling notifications for all bills:', bills.length);
    
    // Cancel all existing notifications first
    try {
      const pending = await LocalNotifications.getPending();
      console.log('Clearing existing notifications:', pending.notifications.length);
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ 
          notifications: pending.notifications.map(n => ({ id: n.id })) 
        });
      }
    } catch (error) {
      console.error('Error clearing old notifications:', error);
    }

    // Schedule notifications for all unpaid bills
    for (const bill of bills) {
      if (!bill.isPaid) {
        await this.scheduleBillReminder(bill);
      }
    }
    
    // Log final state
    try {
      const pending = await LocalNotifications.getPending();
      console.log('Total notifications scheduled:', pending.notifications.length);
    } catch (error) {
      console.error('Error checking pending notifications:', error);
    }
  }

  static async showBillPaidNotification(billName: string, amount: number) {
    if (!this.isNative) return;

    try {
      console.log('Showing bill paid notification:', billName);
      
      const now = new Date();
      const notificationTime = addMinutes(now, 0.1); // Show almost immediately
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '✅ Bill Paid!',
            body: `${billName} - ${amount} has been marked as paid.`,
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: notificationTime },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              type: 'bill_paid',
              billName: billName,
            },
          },
        ],
      });
      
      console.log('Bill paid notification scheduled');
    } catch (error) {
      console.error('Error showing bill paid notification:', error);
    }
  }

  static async checkPermissions() {
    if (!this.isNative) return { display: 'granted' };

    try {
      const status = await LocalNotifications.checkPermissions();
      console.log('Notification permission status:', status);
      return status;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return { display: 'denied' };
    }
  }

  static async requestPermissions() {
    if (!this.isNative) return { display: 'granted' };

    try {
      const status = await LocalNotifications.requestPermissions();
      console.log('Requested notification permissions:', status);
      return status;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return { display: 'denied' };
    }
  }

  // Utility method to list all pending notifications for debugging
  static async listPendingNotifications() {
    if (!this.isNative) return;

    try {
      const pending = await LocalNotifications.getPending();
      console.log('=== PENDING NOTIFICATIONS ===');
      console.log('Total:', pending.notifications.length);
      pending.notifications.forEach((notif: any) => {
        console.log(`ID: ${notif.id}, Time: ${notif.schedule?.at ? format(new Date(notif.schedule.at), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}, Title: ${notif.title}`);
      });
      console.log('=============================');
      return pending.notifications;
    } catch (error) {
      console.error('Error listing pending notifications:', error);
    }
  }
}
