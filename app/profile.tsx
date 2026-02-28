import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  
  const [email, setEmail] = useState('Loading...');
  const [metadata, setMetadata] = useState<any>({});

  useEffect(() => {
    async function loadUserData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user) {
        setEmail(user.email || '');
        if (user.user_metadata) {
          setMetadata(user.user_metadata);
        }
      }
    }
    loadUserData();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function handlePasswordChange() {
    if (newPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Success", "Your password has been updated!");
    setNewPassword('');
  }

  // Get the first letter for the avatar (Defaults to email if no username exists)
  const firstLetter = metadata.userName ? metadata.userName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container}>
      
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.infoCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{firstLetter}</Text>
        </View>
        
        {/* THE NEW STACK ORDER: Username -> Email -> Phone */}
        <Text style={styles.nameText}>{metadata.userName || 'No Username'}</Text>
        <Text style={styles.emailText}>{email}</Text>
        <Text style={styles.phoneText}>{metadata.phone || 'No phone provided'}</Text>

        <View style={styles.metricsGrid}>
          <MetricBox label="Age" value={metadata.age || '--'} />
          <MetricBox label="Gender" value={metadata.gender || '--'} />
          <MetricBox label="Weight" value={metadata.weight ? `${metadata.weight} kg` : '--'} />
          <MetricBox label="Height" value={metadata.height ? `${metadata.height} cm` : '--'} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Update Password</Text>
        <TextInput 
          style={styles.input} 
          placeholder="New Password" 
          secureTextEntry 
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handlePasswordChange}>
          <Text style={styles.saveText}>Save New Password</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function MetricBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB', paddingHorizontal: 25, paddingTop: 50 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  infoCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#7B61FF' },
  
  // New Text Styles for the Stack
  nameText: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  emailText: { fontSize: 14, color: '#555', marginBottom: 4 },
  phoneText: { fontSize: 14, color: '#888', marginBottom: 20 },
  
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  metricBox: { width: '47%', backgroundColor: '#F9F9FB', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 10 },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: '#7B61FF', marginBottom: 5 },
  metricLabel: { fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  
  section: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 25 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 15 },
  input: { backgroundColor: '#F9F9FB', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', marginBottom: 15, fontSize: 16 },
  saveButton: { backgroundColor: '#7B61FF', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  logoutButton: { alignItems: 'center', padding: 18, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#FFE5E5' },
  logoutText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 }
});