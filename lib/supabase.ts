import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://xhfisbizbuljexoqynhb.supabase.co';
const supabaseAnonKey = 'sb_publishable_0Oi1SGjvDP13UdaKOVFrQA_-qhopSBb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Saves the login token securely
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
