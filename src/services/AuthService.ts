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

  private static extractTokensFromUrl(url: string): { access_token?: string; refresh_token?: string; error?: string; error_description?: string } {
    console.log('Extracting tokens from URL:', url);
    
    const tokens: any = {};
    
    // Handle both hash (#) and query (?) parameters
    const hashPart = url.split('#')[1];
    const queryPart = url.split('?')[1];
    
    const parseParams = (paramString: string) => {
      if (!paramString) return;
      
      const params = new URLSearchParams(paramString);
      
      if (params.get('access_token')) {
        tokens.access_token = params.get('access_token');
      }
      if (params.get('refresh_token')) {
        tokens.refresh_token = params.get('refresh_token');
      }
      if (params.get('error')) {
        tokens.error = params.get('error');
      }
      if (params.get('error_description')) {
        tokens.error_description = params.get('error_description');
      }
    };
    
    // Parse both parts
    parseParams(hashPart);
    parseParams(queryPart);
    
    console.log('Extracted tokens:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      hasError: !!tokens.error
    });
    
    return tokens;
  }

  private static async signInWithGoogleMobile() {
    console.log('=== MOBILE GOOGLE OAUTH FLOW ===');
    
    try {
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

      console.log('OAuth URL received');

      // Step 3: Set up deep link listener BEFORE opening browser
      console.log('Setting up deep link listener...');
      
      return new Promise((resolve, reject) => {
        let isProcessing = false; // Prevent duplicate processing
        
        // Listen for the app to receive the deep link callback
        const appUrlListenerPromise = App.addListener('appUrlOpen', async (event) => {
          console.log('📱 Deep link received:', event.url);
          
          if (isProcessing) {
            console.log('Already processing, ignoring duplicate callback');
            return;
          }
          
          isProcessing = true;
          
          // Close the browser
          try {
            await Browser.close();
            console.log('✅ Browser closed');
          } catch (e) {
            console.log('Browser already closed or error closing:', e);
          }
          
          // Extract tokens from URL
          const tokens = this.extractTokensFromUrl(event.url);
          
          // Check for errors
          if (tokens.error) {
            console.error('❌ OAuth error:', tokens.error, tokens.error_description);
            appUrlListenerPromise.then(listener => listener.remove());
            reject(new Error(tokens.error_description || tokens.error));
            return;
          }
          
          // Check if we have tokens
          if (!tokens.access_token) {
            console.error('❌ No access token found in URL');
            console.log('Full URL:', event.url);
            appUrlListenerPromise.then(listener => listener.remove());
            reject(new Error('No access token received from OAuth'));
            return;
          }
          
          console.log('✅ OAuth tokens found, creating session...');
          
          try {
            // CRITICAL: Use setSession to create session from tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token || '',
            });
            
            if (sessionError) {
              console.error('❌ Error creating session:', sessionError);
              appUrlListenerPromise.then(listener => listener.remove());
              reject(sessionError);
              return;
            }
            
            if (!sessionData.session) {
              console.error('❌ No session created from tokens');
              appUrlListenerPromise.then(listener => listener.remove());
              reject(new Error('Failed to create session from OAuth tokens'));
              return;
            }
            
            console.log('✅ Session created successfully:', sessionData.session.user.email);
            appUrlListenerPromise.then(listener => listener.remove());
            resolve(sessionData.session);
          } catch (error) {
            console.error('❌ Exception while creating session:', error);
            appUrlListenerPromise.then(listener => listener.remove());
            reject(error);
          }
        });

        // Timeout after 5 minutes
        const timeout = setTimeout(() => {
          console.log('⏱️ OAuth timeout');
          if (!isProcessing) {
            appUrlListenerPromise.then(listener => listener.remove());
            Browser.close().catch(e => console.log('Browser already closed'));
            reject(new Error('Authentication timeout - please try again'));
          }
        }, 300000);

        // Step 4: Open OAuth URL in system browser
        console.log('🌐 Opening OAuth URL in browser...');
        Browser.open({ 
          url: data.url,
          windowName: '_self',
        }).then(() => {
          console.log('✅ Browser opened successfully');
        }).catch((error) => {
          console.error('❌ Error opening browser:', error);
          clearTimeout(timeout);
          appUrlListenerPromise.then(listener => listener.remove());
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