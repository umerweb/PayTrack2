import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

export class AuthService {
  private static isNative = Capacitor.isNativePlatform();

  static async signInWithGoogle() {
    console.log('Starting Google sign in, isNative:', this.isNative);

    if (this.isNative) {
      // Mobile: Use custom URL scheme with deep linking
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
    console.log('=== MOBILE GOOGLE OAUTH FLOW ===');
    
    try {
      // CRITICAL: This is the correct way to handle OAuth in Capacitor mobile apps
      
      // Step 1: Create the redirect URL with custom scheme
      const redirectUrl = `com.billreminder.app://login-callback`;
      console.log('Redirect URL:', redirectUrl);
      
      // Step 2: Get the OAuth URL from Supabase WITHOUT auto-redirecting
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // CRITICAL: Don't auto-redirect
        },
      });

      if (error) {
        console.error('Error getting OAuth URL:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No OAuth URL received from Supabase');
      }

      console.log('OAuth URL received:', data.url);

      // Step 3: Set up deep link listener BEFORE opening browser
      console.log('Setting up deep link listener...');
      
      return new Promise(async (resolve, reject) => {
        // Listen for the app to receive the deep link callback
        const appUrlListener = await App.addListener('appUrlOpen', async (event) => {
          console.log('📱 Deep link received:', event.url);
          
          // Close the browser
          await Browser.close().catch(e => console.log('Browser already closed'));
          
          // Parse the URL to extract the tokens
          if (event.url.includes('#access_token=') || event.url.includes('?access_token=')) {
            console.log('✅ OAuth tokens found in URL');
            
            // Supabase will automatically handle the session
            // Wait a moment for it to process
            setTimeout(async () => {
              const { data: { session } } = await supabase.auth.getSession();
              
              if (session) {
                console.log('✅ Session established:', session.user.email);
                await appUrlListener.remove();
                resolve(session);
              } else {
                console.error('❌ No session after OAuth callback');
                await appUrlListener.remove();
                reject(new Error('Authentication failed - no session created'));
              }
            }, 1000);
          } else if (event.url.includes('error=')) {
            console.error('❌ OAuth error in URL');
            await appUrlListener.remove();
            reject(new Error('OAuth authentication failed'));
          }
        });

        // Timeout after 5 minutes
        const timeout = setTimeout(async () => {
          console.log('⏱️ OAuth timeout');
          await appUrlListener.remove();
          Browser.close().catch(e => console.log('Browser already closed'));
          reject(new Error('Authentication timeout - please try again'));
        }, 300000);

        // Step 4: Open OAuth URL in system browser
        console.log('🌐 Opening OAuth URL in browser...');
        Browser.open({ 
          url: data.url,
          windowName: '_self',
          presentationStyle: 'fullscreen', // Use fullscreen for better UX
        }).then(() => {
          console.log('✅ Browser opened successfully');
        }).catch(async (error) => {
          console.error('❌ Error opening browser:', error);
          clearTimeout(timeout);
          await appUrlListener.remove();
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Mobile Google sign-in error:', error);
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