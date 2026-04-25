import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://ozrrinkzccewyogkzoki.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cnJpbmt6Y2Nld3lvZ2t6b2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMDY1NzIsImV4cCI6MjA5MjY4MjU3Mn0.oJHOkhcFd-SWWAZdIQcjHggbYIbNAjrdTd8kR8B__i8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Saves the login token securely
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
