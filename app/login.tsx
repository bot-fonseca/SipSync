import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Used for the dropdown arrows

const EXERCISE_OPTIONS = [
  "Sedentary (Little to none)", 
  "Light (1-3 times/week)", 
  "Moderate (3-5 times/week)", 
  "High (5-7 times/week)", 
  "Extreme (Heavy exercise/job)"
];

// You can add all 195 countries here later!
const COUNTRIES = ["Argentina", "Brazil", "Canada", "France", "Germany", "Mexico", "Portugal", "Puerto Rico", "Spain", "United Kingdom", "United States"];

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');

  const [dob, setDob] = useState('');
  const [gender, setGender] = useState(''); 
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [country, setCountry] = useState('');   
  const [exercise, setExercise] = useState(''); 

  // --- MODAL STATES ---
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  // Filter countries based on what you type (e.g., "Po")
  const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(searchCountry.toLowerCase()));

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    else router.replace('/');
    setLoading(false);
  }

  async function signUpWithEmail() {
    if (!userName) return Alert.alert("Missing Info", "Please enter a User Name.");
    if (!gender) return Alert.alert("Missing Info", "Please select a gender.");
    if (!country || !exercise) return Alert.alert("Missing Info", "Please select a Country and Exercise Level.");

    setLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email: email, 
      password: password,
      options: {
        data: { userName, dob, gender, weight, height, country, exercise }
      }
    });

    if (error) Alert.alert('Error', error.message);
    else router.replace('/');
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{isSignUpMode ? 'Create Account' : 'Welcome Back'}</Text>
      <Text style={styles.subtitle}>{isSignUpMode ? 'Enter your details to calculate your water target' : 'Log in to track your hydration'}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="brooklyn@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} placeholder="Enter password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      </View>

      {isSignUpMode &&(
        <View style={styles.inputContainer}>
          <Text style={styles.label}>User Name</Text>
          <TextInput style={styles.input} placeholder="Enter your username" value={userName} onChangeText={setUserName} autoCapitalize="words" />
        </View>
      )}

      {isSignUpMode && (
        <View style={styles.metricsBox}>
          <Text style={styles.metricsHeader}>Personal Metrics</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={dob} onChangeText={setDob} keyboardType="numeric" />
            </View>
            
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity style={[styles.genderButton, gender === 'M' && styles.genderButtonActive]} onPress={() => setGender('M')}>
                  <Text style={[styles.genderText, gender === 'M' && styles.genderTextActive]}>M</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.genderButton, gender === 'F' && styles.genderButtonActive]} onPress={() => setGender('F')}>
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

          {/* --- FAKE DROPDOWN INPUTS --- */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Country</Text>
            <TouchableOpacity style={styles.dropdownInput} onPress={() => setShowCountryModal(true)}>
              <Text style={{ color: country ? '#333' : '#999', fontSize: 16 }}>{country || 'Select Country'}</Text>
              <Ionicons name="chevron-down" size={20} color="#7B61FF" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Activity Level</Text>
            <TouchableOpacity style={styles.dropdownInput} onPress={() => setShowExerciseModal(true)}>
              <Text style={{ color: exercise ? '#333' : '#999', fontSize: 16 }}>{exercise || 'Select Activity Level'}</Text>
              <Ionicons name="chevron-down" size={20} color="#7B61FF" />
            </TouchableOpacity>
          </View>

        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={isSignUpMode ? signUpWithEmail : signInWithEmail} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>{isSignUpMode ? 'Sign Up & Save Data' : 'Log In'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsSignUpMode(!isSignUpMode)} disabled={loading}>
          <Text style={styles.secondaryButtonText}>{isSignUpMode ? 'Already have an account? Log In' : 'New here? Create Account'}</Text>
        </TouchableOpacity>
      </View>

      {/* --- COUNTRY SEARCH MODAL --- */}
      <Modal visible={showCountryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TextInput style={styles.searchInput} placeholder="Type to search (e.g., Po)" value={searchCountry} onChangeText={setSearchCountry} autoFocus />
            <FlatList 
              data={filteredCountries}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalOption} onPress={() => { setCountry(item); setShowCountryModal(false); setSearchCountry(''); }}>
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCountryModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- EXERCISE SELECT MODAL --- */}
      <Modal visible={showExerciseModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Activity Level</Text>
            {EXERCISE_OPTIONS.map((option, index) => (
              <TouchableOpacity key={index} style={styles.modalOption} onPress={() => { setExercise(option); setShowExerciseModal(false); }}>
                <Text style={styles.modalOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowExerciseModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  genderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  genderButton: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E0E7FF', backgroundColor: '#FFF', alignItems: 'center', marginHorizontal: 4 },
  genderButtonActive: { backgroundColor: '#7B61FF', borderColor: '#7B61FF' },
  genderText: { fontSize: 16, color: '#555', fontWeight: '500' },
  genderTextActive: { color: '#FFF', fontWeight: 'bold' },
  buttonContainer: { marginTop: 10 },
  primaryButton: { backgroundColor: '#7B61FF', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#E0E7FF', padding: 18, borderRadius: 15, alignItems: 'center' },
  secondaryButtonText: { color: '#7B61FF', fontSize: 16, fontWeight: 'bold' },

  // --- NEW DROPDOWN & MODAL STYLES ---
  dropdownInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E0E7FF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  searchInput: { backgroundColor: '#F0F4FF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15 },
  modalOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalOptionText: { fontSize: 16, color: '#333', textAlign: 'center' },
  modalCloseBtn: { marginTop: 20, padding: 15, backgroundColor: '#FFE5E5', borderRadius: 12, alignItems: 'center' },
  modalCloseText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 }
});