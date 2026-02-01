import { Bill } from '@/contexts/BillContext';
import { addDays, addWeeks, addMonths, addYears, isAfter, isBefore, isToday } from 'date-fns';

export const getBillStatus = (bill: Bill): 'overdue' | 'paid' | 'upcoming' => {
  if (bill.isPaid) return 'paid';
  if (isBefore(bill.nextDueDate, new Date()) && !isToday(bill.nextDueDate)) return 'overdue';
  return 'upcoming';
};

export const getStatusColor = (status: 'overdue' | 'paid' | 'upcoming'): string => {
  switch (status) {
    case 'overdue':
      return 'text-red-500 bg-red-500/10';
    case 'paid':
      return 'text-green-500 bg-green-500/10';
    case 'upcoming':
      return 'text-foreground bg-card';
  }
};

export const getNextDueDate = (currentDate: Date, frequency: Bill['frequency']): Date => {
  switch (frequency) {
    case 'one-time':
      return currentDate;
    case 'daily':
      return addDays(currentDate, 1);
    case 'weekly':
      return addWeeks(currentDate, 1);
    case 'bi-weekly':
      return addWeeks(currentDate, 2);
    case 'every-3-weeks':
      return addWeeks(currentDate, 3);
    case 'every-4-weeks':
      return addWeeks(currentDate, 4);
    case 'every-5-weeks':
      return addWeeks(currentDate, 5);
    case 'every-6-weeks':
      return addWeeks(currentDate, 6);
    case 'monthly':
      return addMonths(currentDate, 1);
    case 'every-3-months':
      return addMonths(currentDate, 3);
    case 'every-4-months':
      return addMonths(currentDate, 4);
    case 'every-5-months':
      return addMonths(currentDate, 5);
    case 'every-6-months':
      return addMonths(currentDate, 6);
    case 'annually':
      return addYears(currentDate, 1);
    default:
      return currentDate;
  }
};

export const filterBillsByDateRange = (bills: Bill[], view: 'week' | '14days' | 'month' | 'year' | 'all'): Bill[] => {
  if (view === 'all') return bills;
  
  const now = new Date();
  let endDate: Date;
  
  switch (view) {
    case 'week':
      endDate = addDays(now, 7);
      break;
    case '14days':
      endDate = addDays(now, 14);
      break;
    case 'month':
      endDate = addMonths(now, 1);
      break;
    case 'year':
      endDate = addYears(now, 1);
      break;
    default:
      return bills;
  }
  
  return bills.filter(bill => 
    isBefore(bill.nextDueDate, endDate) || isToday(bill.nextDueDate)
  );
};

export const frequencyOptions = [
  { value: 'one-time', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Every 2 Weeks' },
  { value: 'every-3-weeks', label: 'Every 3 Weeks' },
  { value: 'every-4-weeks', label: 'Every 4 Weeks' },
  { value: 'every-5-weeks', label: 'Every 5 Weeks' },
  { value: 'every-6-weeks', label: 'Every 6 Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'every-3-months', label: 'Every 3 Months' },
  { value: 'every-4-months', label: 'Every 4 Months' },
  { value: 'every-5-months', label: 'Every 5 Months' },
  { value: 'every-6-months', label: 'Every 6 Months' },
  { value: 'annually', label: 'Annually' },
];
