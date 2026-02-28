import { useEffect, useState } from 'react';
// 1. Import useRootNavigationState
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router'; 
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false); // Helps prevent flashing
  
  const router = useRouter();
  const segments = useSegments(); 
  // 2. Add the navigation state checker
  const navigationState = useRootNavigationState(); 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitialized(true); // Tell the app we finished checking Supabase
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

// --- THE BULLETPROOF TRAFFIC COP ---
  useEffect(() => {
    if (!navigationState?.key || !isInitialized) return;

    // Let's print out what the app sees in your VS Code terminal!
    console.log("--- NAVIGATION CHECK ---");
    console.log("Is user logged in?", !!session);
    console.log("Where are they right now?", segments[0]);

    if (!session && segments[0] !== 'login') {
      // If NOT logged in, and NOT on the login page -> Send to Login
      router.replace('/login');
    } else if (session && segments[0] !== '(tabs)') {
      // If LOGGED IN, and NOT inside the main app -> Send to Home Dashboard
      router.replace('/(tabs)'); 
    }
  }, [session, segments, navigationState?.key, isInitialized]);

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}