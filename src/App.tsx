import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { BillProvider } from "@/contexts/BillContext";

import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Insights from "@/pages/Insights";
import NewBill from "@/pages/NewBill";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {

  useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;

  const initPushNotifications = async () => {
    // 1️⃣ Create notification channel (Android only)
    try {
      await PushNotifications.createChannel({
        id: 'bill-reminders',
        name: 'Bill Reminders',
        importance: 5, // Max importance, shows heads-up notification
        sound: 'noti',
        vibration: true,
      });
      console.log('✅ Notification channel created');
    } catch (error) {
      console.warn('⚠️ Channel creation failed:', error);
    }

    // 2️⃣ Request permission and register
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive === 'granted') {
      await PushNotifications.register();
    }
  };

  // 3️⃣ Register listeners ONCE
  PushNotifications.addListener('registration', token => {
    console.log('✅ Push token:', token.value);
  });

  PushNotifications.addListener('registrationError', error => {
    console.error('❌ Push registration error:', error);
  });

  PushNotifications.addListener('pushNotificationReceived', notification => {
    console.log('📩 Push received:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', action => {
    console.log('👉 Push action:', action);
  });

  initPushNotifications();
}, []);


  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="bill-reminder-theme">
        <TooltipProvider>
          <AuthProvider>
            <BillProvider>
              <BrowserRouter>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<Onboarding />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/new-bill" element={<NewBill />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </BillProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
