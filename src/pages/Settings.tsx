import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useBills } from '@/contexts/BillContext';
import { useTheme } from '@/components/ThemeProvider';
import BottomNav from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currencies } from '@/utils/currencyUtils';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, DollarSign, Cloud, Palette, LogOut, Save, AlertCircle, Bell, TestTube } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthService } from '@/services/AuthService';
import { NotificationService } from '@/services/NotificationService';
import { Capacitor } from '@capacitor/core';

const Settings = () => {
  const { settings, updateSettings, user, signOut, notificationsEnabled, requestNotificationPermission } = useBills();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();
  
  const [formData, setFormData] = useState({
    currency: settings.currency,
    displayCurrency: settings.displayCurrency || settings.currency,
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = async () => {
    try {
      await updateSettings(formData);
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSyncing(true);
    try {
      console.log('Initiating Google sign-in...');
      await AuthService.signInWithGoogle();
      
      toast({
        title: 'Signed in successfully',
        description: 'Your data is now syncing with Google.',
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: 'Sign-in failed',
        description: 'Failed to sign in with Google. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      toast({
        title: 'Notifications enabled',
        description: 'To disable, go to your device settings.',
      });
    } else {
      const granted = await requestNotificationPermission();
      if (granted) {
        toast({
          title: 'Notifications enabled',
          description: 'You will now receive bill reminders.',
        });
      } else {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your device settings.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleTestNotification = async () => {
    if (!isNative) {
      toast({
        title: 'Not available',
        description: 'Notifications only work on mobile devices.',
        variant: 'destructive',
      });
      return;
    }

    if (!notificationsEnabled) {
      toast({
        title: 'Enable notifications first',
        description: 'Please enable notifications before testing.',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    try {
      console.log('Sending test notification...');
      await NotificationService.testNotification();
      
      toast({
        title: 'Test notification sent!',
        description: 'You should receive it in ~6 seconds. Check your notification tray.',
      });
      
      // Also list pending notifications
      setTimeout(async () => {
        await NotificationService.listPendingNotifications();
      }, 1000);
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Test failed',
        description: 'Could not send test notification. Check console.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* Account Status */}
          {user && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Alert className="bg-green-500/10 border-green-500/20">
                <Cloud className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  <strong>Syncing enabled:</strong> Your data is backed up and synced across devices.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {!user && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sign in with Google to backup and sync your bills across all your devices.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Account Information */}
          {user && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User size={20} />
                    Account Information
                  </CardTitle>
                  <CardDescription>Your Google account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                    <Mail size={20} className="text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  
                  {user.user_metadata?.full_name && (
                    <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                      <User size={20} className="text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Name</p>
                        <p className="text-sm text-muted-foreground">{user.user_metadata.full_name}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Notifications Settings (Mobile Only) */}
          {isNative && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: user ? 0.2 : 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell size={20} />
                    Notifications
                  </CardTitle>
                  <CardDescription>Receive reminders for upcoming bills</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Bill Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        {notificationsEnabled 
                          ? 'Notifications are enabled' 
                          : 'Enable to receive bill reminders'}
                      </p>
                    </div>
                    <Button
                      variant={notificationsEnabled ? 'default' : 'outline'}
                      onClick={handleToggleNotifications}
                    >
                      {notificationsEnabled ? 'Enabled' : 'Enable'}
                    </Button>
                  </div>
                  
                  {notificationsEnabled && (
                    <>
                      <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                        <p className="text-muted-foreground">
                          ✓ Notifications at the time you set for each bill
                        </p>
                        <p className="text-muted-foreground">
                          ✓ Recurring reminders every 2 hours if enabled
                        </p>
                        <p className="text-muted-foreground">
                          ✓ Confirmation when you mark bills as paid
                        </p>
                      </div>
                      
                      <Button
                        onClick={handleTestNotification}
                        variant="secondary"
                        className="w-full"
                        disabled={isTesting}
                      >
                        <TestTube size={16} className="mr-2" />
                        {isTesting ? 'Sending...' : 'Test Notification (6 sec)'}
                      </Button>
                      
                      {isTesting && (
                        <p className="text-xs text-center text-muted-foreground">
                          Check your notification tray in 6 seconds...
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Currency Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: user ? (isNative ? 0.3 : 0.2) : (isNative ? 0.2 : 0.1) }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign size={20} />
                  Currency Settings
                </CardTitle>
                <CardDescription>Set your preferred currencies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currency">Base Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    All amounts are stored in this currency
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="displayCurrency">Display Currency</Label>
                  <Select
                    value={formData.displayCurrency}
                    onValueChange={(value) => setFormData({ ...formData, displayCurrency: value })}
                  >
                    <SelectTrigger id="displayCurrency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Display amounts in this currency (conversion for viewing only)
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: user ? (isNative ? 0.4 : 0.3) : (isNative ? 0.3 : 0.2) }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette size={20} />
                  Appearance
                </CardTitle>
                <CardDescription>Customize your app appearance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                    </p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Google Sync */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: user ? (isNative ? 0.5 : 0.4) : (isNative ? 0.4 : 0.3) }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud size={20} />
                  Cloud Sync
                </CardTitle>
                <CardDescription>
                  {user 
                    ? 'Your data is automatically synced with Google'
                    : 'Sign in to backup and sync your data across devices'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!user ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        • Backup all your bills and settings
                      </p>
                      <p className="text-sm text-muted-foreground">
                        • Access your data on any device
                      </p>
                      <p className="text-sm text-muted-foreground">
                        • Never lose your bill reminders
                      </p>
                    </div>
                    
                    <Button
                      onClick={handleGoogleSignIn}
                      className="w-full"
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <>
                          <Cloud size={16} className="mr-2 animate-pulse" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Cloud size={16} className="mr-2" />
                          Sign in with Google
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleSignOut}
                    variant="destructive"
                    className="w-full"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full" size="lg">
            <Save size={20} className="mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
