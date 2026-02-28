import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [userName, setUserName] = useState('Loading...');
  const router = useRouter();

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Look for the userName, if they didn't set one, just show the first part of their email
        if (user.user_metadata && user.user_metadata.userName) {
          setUserName(user.user_metadata.userName);
        } else {
          setUserName(user.email?.split('@')[0] || 'User');
        }
      }
    }
    loadUserData();
  }, []);

  return (
    <View style={styles.container}>
      {/* Top Header Section matching your design */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {/* Avatar on the left */}
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
          </TouchableOpacity>

          {/* Greeting and Username */}
          <View style={styles.greetingBox}>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.name}>{userName}</Text>
          </View>
        </View>

        {/* Notification Bell on the right */}
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* The rest of your app UI will go below this! */}
      <View style={styles.placeholderBox}>
        <Text>The rest of the dashboard goes here!</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB', paddingHorizontal: 25, paddingTop: 60 },
  
  // Header Styles
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#7B61FF' },
  
  greetingBox: { justifyContent: 'center' },
  greeting: { fontSize: 14, color: '#888', marginBottom: 2 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  iconButton: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },

  // Temporary Placeholder Style
  placeholderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});