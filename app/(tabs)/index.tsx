import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const [email, setEmail] = useState('Loading...');
  const router = useRouter();

  useEffect(() => {
    // Fetch the user's data when the Home screen loads
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && user.email) {
        setEmail(user.email);
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Top Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning</Text>
          {/* We display the fetched email here for now! */}
          <Text style={styles.name}>{email}</Text> 
        </View>

        {/* Clicking this profile picture opens the Profile screen */}
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarText}>{email.charAt(0).toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Rest of your Home Screen UI goes here... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB', padding: 25, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  greeting: { fontSize: 16, color: '#888' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#7B61FF' }
});