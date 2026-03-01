import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // Standard Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');

  // Metric States
  const [age, setAge] = useState('');
  const [gender, setGender] = useState(''); // This will now hold 'M' or 'F'
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [phone, setPhone] = useState('');

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    else router.replace('/');
    setLoading(false);
  }

async function signUpWithEmail() {
    // 1. Force the app to check for the username and gender before sending!
    if (!userName) {
      Alert.alert("Missing Info", "Please enter a User Name.");
      return;
    }
    if (!gender) {
      Alert.alert("Missing Info", "Please select a gender.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email: email, 
      password: password,
      options: {
        // 2. Explicitly tell Supabase exactly what data to save
        data: { 
          userName: userName, 
          age: age, 
          gender: gender, 
          weight: weight, 
          height: height, 
          phone: phone 
        }
      }
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/');
    }
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{isSignUpMode ? 'Create Account' : 'Welcome Back'}</Text>
      <Text style={styles.subtitle}>
        {isSignUpMode ? 'Enter your details to calculate your water target' : 'Log in to track your hydration'}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="brooklyn@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} placeholder="Enter password" value={password} onChangeText={setPassword} secureTextEntry  autoCapitalize="none"/>
      </View>

      {isSignUpMode &&(
        <View style={styles.inputContainer}>
          <Text style={styles.label}>User Name</Text>
          <TextInput style={styles.input} placeholder="Enter your username" value={userName} onChangeText={setUserName} autoCapitalize="none" />
        </View>
      )}
      {/* --- METRICS SECTION --- */}
      {isSignUpMode && (
        <View style={styles.metricsBox}>
          <Text style={styles.metricsHeader}>Personal Metrics</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Age</Text>
              <TextInput style={styles.input} placeholder="e.g. 25" value={age} onChangeText={setAge} keyboardType="numeric" />
            </View>
            
            {/* --- THE NEW GENDER BUTTONS --- */}
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity 
                  style={[styles.genderButton, gender === 'M' && styles.genderButtonActive]} 
                  onPress={() => setGender('M')}
                >
                  <Text style={[styles.genderText, gender === 'M' && styles.genderTextActive]}>M</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.genderButton, gender === 'F' && styles.genderButtonActive]} 
                  onPress={() => setGender('F')}
                >
                  <Text style={[styles.genderText, gender === 'F' && styles.genderTextActive]}>F</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput style={styles.input} placeholder="e.g. 70" value={weight} onChangeText={setWeight} keyboardType="numeric" />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput style={styles.input} placeholder="e.g. 175" value={height} onChangeText={setHeight} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="+1 234 567 8900" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
        </View>
      )}

      {/* --- BUTTONS --- */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={isSignUpMode ? signUpWithEmail : signInWithEmail} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>{isSignUpMode ? 'Sign Up & Save Data' : 'Log In'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsSignUpMode(!isSignUpMode)} disabled={loading}>
          <Text style={styles.secondaryButtonText}>{isSignUpMode ? 'Already have an account? Log In' : 'New here? Create Account'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F9F9FB', padding: 25, justifyContent: 'center', paddingVertical: 50 },
  header: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 30 },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#E0E7FF' },
  
  metricsBox: { backgroundColor: '#F0F4FF', padding: 15, borderRadius: 15, marginBottom: 20 },
  metricsHeader: { fontSize: 18, fontWeight: 'bold', color: '#7B61FF', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  
  // --- NEW STYLES FOR GENDER BUTTONS ---
  genderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  genderButton: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E0E7FF', backgroundColor: '#FFF', alignItems: 'center', marginHorizontal: 4 },
  genderButtonActive: { backgroundColor: '#7B61FF', borderColor: '#7B61FF' },
  genderText: { fontSize: 16, color: '#555', fontWeight: '500' },
  genderTextActive: { color: '#FFF', fontWeight: 'bold' },
  
  buttonContainer: { marginTop: 10 },
  primaryButton: { backgroundColor: '#7B61FF', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#E0E7FF', padding: 18, borderRadius: 15, alignItems: 'center' },
  secondaryButtonText: { color: '#7B61FF', fontSize: 16, fontWeight: 'bold' }
});