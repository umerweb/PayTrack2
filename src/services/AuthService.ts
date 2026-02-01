import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export class AuthService {
  private static isNative = Capacitor.isNativePlatform();

  static async signInWithGoogle() {
    console.log('Starting Google sign in, isNative:', this.isNative);

    if (this.isNative) {
      // Mobile: Use in-app browser with OAuth
      return this.signInWithGoogleMobile();
    } else {
      // Web: Use standard OAuth flow
      return this.signInWithGoogleWeb();
    }
  }

  private static async signInWithGoogleWeb() {
    console.log('Using web OAuth flow');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error('Web Google sign-in error:', error);
      throw error;
    }
  }

  private static async signInWithGoogleMobile() {
    console.log('Using mobile OAuth flow');
    
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // Important for mobile
        },
      });

      if (error) {
        console.error('Error getting OAuth URL:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No OAuth URL received');
      }

      console.log('Opening OAuth URL in browser:', data.url);

      // Open OAuth URL in system browser
      await Browser.open({ 
        url: data.url,
        presentationStyle: 'popover',
        windowName: '_self'
      });

      // Listen for the app to come back to foreground with auth token
      return new Promise((resolve, reject) => {
        // The auth callback will be handled by Supabase automatically
        // when the browser redirects back to the app
        const checkAuth = setInterval(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            clearInterval(checkAuth);
            await Browser.close();
            console.log('Mobile OAuth successful');
            resolve(session);
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkAuth);
          reject(new Error('OAuth timeout'));
        }, 300000);
      });
    } catch (error) {
      console.error('Mobile Google sign-in error:', error);
      throw error;
    }
  }

  static async signOut() {
    console.log('Signing out...');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  static async refreshSession() {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing session:', error);
      throw error;
    }
    
    return session;
  }
}
