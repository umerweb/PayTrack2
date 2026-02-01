import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { NotificationService } from '@/services/NotificationService';
import { Capacitor } from '@capacitor/core';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  frequency: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'bi-weekly' | 'every-3-weeks' | 'every-4-weeks' | 'every-5-weeks' | 'every-6-weeks' | 'every-3-months' | 'every-4-months' | 'every-5-months' | 'every-6-months' | 'annually';
  nextDueDate: Date;
  notificationTime: string;
  note: string;
  autoMarkPaid: boolean;
  notifyUntilPaid: boolean;
  isPaid: boolean;
  category?: string;
}

export interface UserSettings {
  currency: string;
  displayCurrency?: string;
  monthlyIncome?: number;
  googleAccount?: string;
  syncEnabled: boolean;
  name?: string;
  email?: string;
}

interface BillContextType {
  bills: Bill[];
  settings: UserSettings;
  user: User | null;
  loading: boolean;
  addBill: (bill: Omit<Bill, 'id'>) => Promise<void>;
  updateBill: (id: string, bill: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  hasCompletedOnboarding: boolean;
  completeOnboarding: (currency: string) => Promise<void>;
  signOut: () => Promise<void>;
  notificationsEnabled: boolean;
  requestNotificationPermission: () => Promise<boolean>;
}

const BillContext = createContext<BillContextType | null>(null);

export const BillProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    currency: 'USD',
    syncEnabled: false,
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  // Initialize notifications on mobile
  useEffect(() => {
    if (isNative) {
      console.log('Initializing notifications for native platform...');
      initializeNotifications();
    }
  }, [isNative]);

  const initializeNotifications = async () => {
    try {
      const status = await NotificationService.checkPermissions();
      const enabled = status.display === 'granted';
      setNotificationsEnabled(enabled);
      console.log('Notifications enabled:', enabled);
      
      if (enabled) {
        await NotificationService.initialize();
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!isNative) {
      console.log('Not on native platform, notifications not available');
      return false;
    }

    try {
      const status = await NotificationService.requestPermissions();
      const enabled = status.display === 'granted';
      setNotificationsEnabled(enabled);
      
      if (enabled) {
        await NotificationService.initialize();
        // Schedule notifications for all existing bills
        console.log('Permission granted, scheduling all bills...');
        await NotificationService.scheduleAllBills(bills);
      }
      
      return enabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Check onboarding status
  const checkOnboardingStatus = (userSettings: UserSettings) => {
    console.log('Checking onboarding status:', userSettings);
    const isComplete = !!userSettings.currency;
    console.log('Onboarding complete:', isComplete);
    setHasCompletedOnboarding(isComplete);
    if (isComplete) {
      localStorage.setItem('onboardingComplete', 'true');
    }
    return isComplete;
  };

  // Initialize auth state with persistent session
  useEffect(() => {
    console.log('BillContext: Starting initialization...');
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('BillContext: Getting session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }
        
        console.log('BillContext: Session retrieved:', session?.user?.email || 'No user');
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('BillContext: User logged in, loading cloud data...');
          await loadUserData(session.user.id);
        } else {
          console.log('BillContext: No user, loading local data...');
          loadLocalData();
        }
        
        if (mounted) {
          console.log('BillContext: Initialization complete, setting loading to false');
          setLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('BillContext: Error initializing auth:', error);
        if (mounted) {
          loadLocalData();
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('BillContext: Auth state changed:', event, session?.user?.email);
      
      if (!mounted) return;
      
      if (!isInitialized && event !== 'INITIAL_SESSION') {
        console.log('BillContext: Skipping auth change, not initialized yet');
        return;
      }
      
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('BillContext: User signed in, loading cloud data and syncing local...');
        setLoading(true);
        try {
          await loadUserData(session.user.id);
          await syncLocalDataToCloud(session.user.id);
        } catch (error) {
          console.error('Error during sign in:', error);
        } finally {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('BillContext: User signed out, clearing data...');
        setBills([]);
        setSettings({ currency: 'USD', syncEnabled: false });
        setHasCompletedOnboarding(false);
        localStorage.clear();
        setLoading(false);
        
        // Cancel all notifications on sign out
        if (isNative) {
          try {
            const pending = await NotificationService.checkPermissions();
            if (pending.display === 'granted') {
              await NotificationService.scheduleAllBills([]);
            }
          } catch (error) {
            console.error('Error canceling notifications:', error);
          }
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('BillContext: Token refreshed, maintaining current state');
      }
    });

    return () => {
      console.log('BillContext: Cleaning up...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Schedule notifications whenever bills change
  useEffect(() => {
    if (isNative && notificationsEnabled && bills.length > 0 && isInitialized) {
      console.log('Bills changed, rescheduling all notifications...');
      // Use a small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        NotificationService.scheduleAllBills(bills).catch(error => {
          console.error('Error scheduling notifications:', error);
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [bills, isNative, notificationsEnabled, isInitialized]);

  const loadLocalData = () => {
    console.log('Loading local data...');
    const savedBills = localStorage.getItem('bills');
    const savedSettings = localStorage.getItem('settings');
    
    if (savedBills) {
      try {
        const parsedBills = JSON.parse(savedBills, (key, value) => {
          if (key === 'nextDueDate') return new Date(value);
          return value;
        });
        console.log('Loaded local bills:', parsedBills.length);
        setBills(parsedBills);
      } catch (error) {
        console.error('Error parsing local bills:', error);
      }
    }
    
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        console.log('Loaded local settings:', parsedSettings);
        setSettings(parsedSettings);
        checkOnboardingStatus(parsedSettings);
      } catch (error) {
        console.error('Error parsing local settings:', error);
      }
    } else {
      const onboardingComplete = localStorage.getItem('onboardingComplete');
      setHasCompletedOnboarding(onboardingComplete === 'true');
    }
  };

  const loadUserData = async (userId: string) => {
    console.log('Loading user data for:', userId);
    
    try {
      const settingsPromise = supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: userSettings, error: settingsError } = await Promise.race([
        settingsPromise,
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Settings timeout')), 10000)
        )
      ]);

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error loading settings:', settingsError);
      }

      if (userSettings) {
        console.log('Loaded cloud settings:', userSettings);
        const newSettings = {
          currency: userSettings.base_currency || 'USD',
          displayCurrency: userSettings.display_currency,
          monthlyIncome: userSettings.monthly_income ? parseFloat(userSettings.monthly_income) : undefined,
          syncEnabled: true,
        };
        setSettings(newSettings);
        checkOnboardingStatus(newSettings);
      } else {
        console.log('No cloud settings found, using defaults');
        const defaultSettings = {
          currency: 'USD',
          displayCurrency: 'USD',
          syncEnabled: true,
        };
        setSettings(defaultSettings);
        checkOnboardingStatus(defaultSettings);
      }

      const billsPromise = supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .order('next_due_date', { ascending: true });

      const { data: userBills, error: billsError } = await Promise.race([
        billsPromise,
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Bills timeout')), 10000)
        )
      ]);

      if (billsError) {
        console.error('Error loading bills:', billsError);
      }

      if (userBills) {
        console.log('Loaded cloud bills:', userBills.length);
        const mappedBills = userBills.map(bill => ({
          id: bill.id,
          name: bill.name,
          amount: parseFloat(bill.amount),
          frequency: bill.frequency as Bill['frequency'],
          nextDueDate: new Date(bill.next_due_date),
          notificationTime: bill.notification_time,
          note: bill.note || '',
          autoMarkPaid: bill.auto_mark_paid,
          notifyUntilPaid: bill.notify_until_paid,
          isPaid: bill.is_paid,
          category: bill.category,
        }));
        setBills(mappedBills);
      } else {
        console.log('No bills found, setting empty array');
        setBills([]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setSettings({ currency: 'USD', syncEnabled: true });
      setBills([]);
      checkOnboardingStatus({ currency: 'USD', syncEnabled: true });
    }
  };

  const syncLocalDataToCloud = async (userId: string) => {
    console.log('Syncing local data to cloud...');
    
    try {
      const localBills = localStorage.getItem('bills');
      const localSettings = localStorage.getItem('settings');

      if (localSettings) {
        const parsedSettings = JSON.parse(localSettings);
        console.log('Syncing local settings to cloud:', parsedSettings);
        
        await supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            base_currency: parsedSettings.currency || 'USD',
            display_currency: parsedSettings.displayCurrency,
            monthly_income: parsedSettings.monthlyIncome,
          }, {
            onConflict: 'user_id'
          });
      }

      if (localBills) {
        const parsedBills = JSON.parse(localBills, (key, value) => {
          if (key === 'nextDueDate') return new Date(value);
          return value;
        });
        
        console.log('Syncing local bills to cloud:', parsedBills.length);
        
        if (parsedBills.length > 0) {
          const billsToSync = parsedBills.map((bill: Bill) => ({
            user_id: userId,
            name: bill.name,
            amount: bill.amount,
            base_currency: settings.currency || 'USD',
            frequency: bill.frequency,
            next_due_date: bill.nextDueDate.toISOString(),
            notification_time: bill.notificationTime,
            note: bill.note,
            auto_mark_paid: bill.autoMarkPaid,
            notify_until_paid: bill.notifyUntilPaid,
            is_paid: bill.isPaid,
            category: bill.category,
          }));

          const { error } = await supabase.from('bills').insert(billsToSync);
          
          if (error) {
            console.error('Error syncing bills:', error);
          } else {
            console.log('Bills synced successfully');
            localStorage.removeItem('bills');
            localStorage.removeItem('settings');
          }
        }
      }
    } catch (error) {
      console.error('Error syncing local data to cloud:', error);
    }
  };

  const saveToLocalStorage = (billsData: Bill[], settingsData: UserSettings) => {
    if (!user) {
      console.log('Saving to localStorage (not signed in)');
      localStorage.setItem('bills', JSON.stringify(billsData));
      localStorage.setItem('settings', JSON.stringify(settingsData));
    }
  };

  const addBill = async (bill: Omit<Bill, 'id'>) => {
    console.log('Adding bill:', bill.name, 'User signed in:', !!user);
    
    let newBill: Bill;
    
    if (user) {
      try {
        const { data, error } = await supabase
          .from('bills')
          .insert({
            user_id: user.id,
            name: bill.name,
            amount: bill.amount,
            base_currency: settings.currency,
            frequency: bill.frequency,
            next_due_date: bill.nextDueDate.toISOString(),
            notification_time: bill.notificationTime,
            note: bill.note,
            auto_mark_paid: bill.autoMarkPaid,
            notify_until_paid: bill.notifyUntilPaid,
            is_paid: bill.isPaid,
            category: bill.category,
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding bill to cloud:', error);
          throw error;
        }

        if (data) {
          console.log('Bill added to cloud:', data.id);
          newBill = {
            id: data.id,
            name: data.name,
            amount: parseFloat(data.amount),
            frequency: data.frequency as Bill['frequency'],
            nextDueDate: new Date(data.next_due_date),
            notificationTime: data.notification_time,
            note: data.note || '',
            autoMarkPaid: data.auto_mark_paid,
            notifyUntilPaid: data.notify_until_paid,
            isPaid: data.is_paid,
            category: data.category,
          };
          setBills([...bills, newBill]);
        } else {
          throw new Error('No data returned from insert');
        }
      } catch (error) {
        console.error('Error in addBill:', error);
        throw error;
      }
    } else {
      console.log('Adding bill to localStorage');
      newBill = {
        ...bill,
        id: Date.now().toString(),
      };
      const updatedBills = [...bills, newBill];
      setBills(updatedBills);
      saveToLocalStorage(updatedBills, settings);
    }
  };

  const updateBill = async (id: string, updatedBill: Partial<Bill>) => {
    console.log('Updating bill:', id, 'User signed in:', !!user);
    
    if (user) {
      try {
        const updateData: any = {};
        if (updatedBill.name !== undefined) updateData.name = updatedBill.name;
        if (updatedBill.amount !== undefined) updateData.amount = updatedBill.amount;
        if (updatedBill.frequency !== undefined) updateData.frequency = updatedBill.frequency;
        if (updatedBill.nextDueDate !== undefined) updateData.next_due_date = updatedBill.nextDueDate.toISOString();
        if (updatedBill.notificationTime !== undefined) updateData.notification_time = updatedBill.notificationTime;
        if (updatedBill.note !== undefined) updateData.note = updatedBill.note;
        if (updatedBill.autoMarkPaid !== undefined) updateData.auto_mark_paid = updatedBill.autoMarkPaid;
        if (updatedBill.notifyUntilPaid !== undefined) updateData.notify_until_paid = updatedBill.notifyUntilPaid;
        if (updatedBill.isPaid !== undefined) updateData.is_paid = updatedBill.isPaid;
        if (updatedBill.category !== undefined) updateData.category = updatedBill.category;

        const { error } = await supabase
          .from('bills')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.error('Error updating bill in cloud:', error);
          throw error;
        }
        
        console.log('Bill updated in cloud:', id);
      } catch (error) {
        console.error('Error in updateBill:', error);
        throw error;
      }
    }

    const updatedBills = bills.map(bill => bill.id === id ? { ...bill, ...updatedBill } : bill);
    setBills(updatedBills);
    saveToLocalStorage(updatedBills, settings);
  };

  const deleteBill = async (id: string) => {
    console.log('Deleting bill:', id, 'User signed in:', !!user);
    
    if (user) {
      try {
        const { error } = await supabase
          .from('bills')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting bill from cloud:', error);
          throw error;
        }
        
        console.log('Bill deleted from cloud:', id);
      } catch (error) {
        console.error('Error in deleteBill:', error);
        throw error;
      }
    }

    const updatedBills = bills.filter(bill => bill.id !== id);
    setBills(updatedBills);
    saveToLocalStorage(updatedBills, settings);
  };

  const markAsPaid = async (id: string) => {
    console.log('Marking bill as paid:', id);
    
    // Find the bill to get its details
    const bill = bills.find(b => b.id === id);
    if (!bill) {
      console.error('Bill not found:', id);
      return;
    }
    
    // Update the bill
    await updateBill(id, { isPaid: true });
    
    // Show "bill paid" notification
    if (isNative && notificationsEnabled) {
      console.log('Showing bill paid notification');
      await NotificationService.showBillPaidNotification(bill.name, bill.amount);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    console.log('Updating settings:', newSettings, 'User signed in:', !!user);
    
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    checkOnboardingStatus(updatedSettings);

    if (user) {
      try {
        const updateData: any = {};
        if (newSettings.currency !== undefined) updateData.base_currency = newSettings.currency;
        if (newSettings.displayCurrency !== undefined) updateData.display_currency = newSettings.displayCurrency;
        if (newSettings.monthlyIncome !== undefined) updateData.monthly_income = newSettings.monthlyIncome;

        const { error } = await supabase
          .from('user_settings')
          .update(updateData)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating settings in cloud:', error);
        } else {
          console.log('Settings updated in cloud');
        }
      } catch (error) {
        console.error('Error in updateSettings:', error);
      }
    } else {
      saveToLocalStorage(bills, updatedSettings);
    }
  };

  const completeOnboarding = async (currency: string) => {
    console.log('Completing onboarding with currency:', currency);
    
    await updateSettings({ currency });
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboardingComplete', 'true');
    
    // Request notification permission after onboarding
    if (isNative) {
      await requestNotificationPermission();
    }
  };

  const signOut = async () => {
    console.log('Signing out...');
    await supabase.auth.signOut();
    setBills([]);
    setSettings({ currency: 'USD', syncEnabled: false });
    setHasCompletedOnboarding(false);
    localStorage.clear();
    
    // Cancel all notifications
    if (isNative && notificationsEnabled) {
      await NotificationService.scheduleAllBills([]);
    }
  };

  return (
    <BillContext.Provider value={{
      bills,
      settings,
      user,
      loading,
      addBill,
      updateBill,
      deleteBill,
      markAsPaid,
      updateSettings,
      hasCompletedOnboarding,
      completeOnboarding,
      signOut,
      notificationsEnabled,
      requestNotificationPermission,
    }}>
      {children}
    </BillContext.Provider>
  );
};

export const useBills = () => {
  const context = useContext(BillContext);
  if (!context) throw new Error('useBills must be used within BillProvider');
  return context;
};
