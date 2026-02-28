import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');

  // Logout Function
  async function handleLogout() {
    await supabase.auth.signOut();
    // Your _layout.tsx will automatically catch this and send them to the Login screen!
  }

  // Change Password Function
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

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.header}>My Profile</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB', padding: 25, paddingTop: 50 },
  backButton: { marginBottom: 20 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  section: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, marginBottom: 30 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 10 },
  input: { backgroundColor: '#F9F9FB', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#EEE', marginBottom: 15 },
  saveButton: { backgroundColor: '#7B61FF', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: 'bold' },
  logoutButton: { alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderRadius: 15 },
  logoutText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 }
});