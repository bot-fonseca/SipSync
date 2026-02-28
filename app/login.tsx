import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router'; 


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter(); // <-- ADD THIS!

  // Update this function
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // FORCE the app to go to the Home screen on success!
      router.replace('/'); 
    }
    setLoading(false);
  }

  // Update this function too
  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Account created! Sending you in...');
      // FORCE the app to go to the Home screen!
      router.replace('/'); 
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome to SipSync!</Text>
      <Text style={styles.subtitle}>Log in to track your hydration</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="brooklyn@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry // This hides the text with dots!
        />
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={signInWithEmail} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Log In</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={signUpWithEmail} disabled={loading}>
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB', padding: 25, justifyContent: 'center' },
  header: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 40 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  input: { 
    backgroundColor: '#FFF', padding: 15, borderRadius: 12, fontSize: 16,
    borderWidth: 1, borderColor: '#E0E7FF' 
  },
  buttonContainer: { marginTop: 20 },
  primaryButton: { 
    backgroundColor: '#7B61FF', padding: 18, borderRadius: 15, 
    alignItems: 'center', marginBottom: 15 
  },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { 
    backgroundColor: '#E0E7FF', padding: 18, borderRadius: 15, 
    alignItems: 'center' 
  },
  secondaryButtonText: { color: '#7B61FF', fontSize: 16, fontWeight: 'bold' }
});