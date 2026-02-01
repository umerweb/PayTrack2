import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Bill } from '@/contexts/BillContext';
import { format, isBefore, addDays } from 'date-fns';

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

  static async scheduleBillReminder(bill: Bill) {
    if (!this.isNative) {
      console.log('Not on native platform, skipping notification scheduling');
      return;
    }

    try {
      const now = new Date();
      const dueDate = new Date(bill.nextDueDate);
      
      // Don't schedule if bill is already paid or overdue
      if (bill.isPaid || isBefore(dueDate, now)) {
        console.log('Bill is paid or overdue, not scheduling notification');
        return;
      }

      // Parse notification time (format: "HH:mm")
      const [hours, minutes] = bill.notificationTime.split(':').map(Number);
      
      // Set notification date/time
      const notificationDate = new Date(dueDate);
      notificationDate.setHours(hours, minutes, 0, 0);

      // If notification time has passed for today, schedule for tomorrow
      if (isBefore(notificationDate, now)) {
        notificationDate.setDate(notificationDate.getDate() + 1);
      }

      const notifications: ScheduleOptions = {
        notifications: [
          {
            title: 'Bill Reminder',
            body: `${bill.name} - ${bill.amount} is due on ${format(dueDate, 'MMM dd, yyyy')}`,
            id: parseInt(bill.id.replace(/\D/g, '').slice(0, 9)) || Math.floor(Math.random() * 1000000),
            schedule: { at: notificationDate },
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              billId: bill.id,
              billName: bill.name,
            },
          },
        ],
      };

      // If notifyUntilPaid is enabled, schedule daily reminders
      if (bill.notifyUntilPaid && !bill.isPaid) {
        const dailyNotifications = [];
        for (let i = 0; i < 7; i++) { // Schedule up to 7 days
          const reminderDate = new Date(notificationDate);
          reminderDate.setDate(reminderDate.getDate() + i);
          
          dailyNotifications.push({
            title: 'Bill Reminder',
            body: `Don't forget: ${bill.name} - ${bill.amount} due on ${format(dueDate, 'MMM dd, yyyy')}`,
            id: (parseInt(bill.id.replace(/\D/g, '').slice(0, 8)) || Math.floor(Math.random() * 100000)) + i,
            schedule: { at: reminderDate },
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              billId: bill.id,
              billName: bill.name,
              isDaily: true,
            },
          });
        }
        notifications.notifications = [...notifications.notifications, ...dailyNotifications];
      }

      await LocalNotifications.schedule(notifications);
      console.log(`Scheduled ${notifications.notifications.length} notification(s) for bill:`, bill.name);
    } catch (error) {
      console.error('Error scheduling bill reminder:', error);
    }
  }

  static async cancelBillReminder(billId: string) {
    if (!this.isNative) return;

    try {
      const notificationId = parseInt(billId.replace(/\D/g, '').slice(0, 9)) || 0;
      
      // Cancel main notification and daily reminders (up to 7)
      const idsToCancel = [notificationId];
      for (let i = 0; i < 7; i++) {
        idsToCancel.push(notificationId + i);
      }

      await LocalNotifications.cancel({ notifications: idsToCancel.map(id => ({ id })) });
      console.log('Cancelled notifications for bill:', billId);
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
}
