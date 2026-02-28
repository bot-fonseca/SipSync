import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const router = useRouter();
  const segments = useSegments(); 
  const navigationState = useRootNavigationState(); 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitialized(true); 
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (!navigationState?.key || !isInitialized) return;

    // We check exactly which screen the user is trying to look at
    const onLoginScreen = segments[0] === 'login';

    if (!session && !onLoginScreen) {
      // 1. NO user, and NOT on login -> Send to Login
      router.replace('/login');
    } else if (session && onLoginScreen) {
      // 2. HAS user, but trying to view Login -> Send to Home
      router.replace('/(tabs)');
    }
    // 3. If they HAVE a user, and are going to '/profile' or '/(tabs)', we do nothing. Let them pass!
    
  }, [session, segments, navigationState?.key, isInitialized]);

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* We add presentation: 'modal' so the profile slides up from the bottom! */}
      <Stack.Screen name="profile" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}